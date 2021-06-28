import Phaser from 'phaser'
import { isDisplayingOnCamera } from '@common/Phaser/GameObjectUtil'

type OptimizableObject = Phaser.GameObjects.GameObject&Phaser.GameObjects.Components.Transform&Phaser.GameObjects.Components.Origin&Phaser.GameObjects.Components.Size

class Plugin extends Phaser.Plugins.ScenePlugin {
  private __objects: Set<OptimizableObject> = new Set

  boot(): void {
    this.scene.renderer.on(Phaser.Scenes.Events.RENDER, this.render.bind(this))
    this.scene.events.on(Phaser.Scenes.Events.DESTROY, this.destroy.bind(this))
  }

  /**
   * 플러그인에 `add` 메서드로 등록한 모든 게임 오브젝트 목록을 배열로 반환합니다.
   */
  get list(): Phaser.GameObjects.GameObject[] {
    return Array.from(this.__objects)
  }

  /**
   * 씬이 매 프레임 렌더링 될 때 마다 호출될 메서드입니다.
   * 씬이 일시중지되었거나, 파괴되었다면 더 이상 호출되지 않습니다.  
   * *절대 직접 호출하지 마십시오.*
   */
  render(): void {
    this.optimization()
  }

  destroy(): void {
    this.disableOptimization()
  }

  private onGameObjectAddedToScene = (gameObject: OptimizableObject, scene: Phaser.Scene) => {
    if (scene === this.scene) {
      this.add(gameObject)
    }
    // 현재 플러그인이 담당하는 씬과 다른 씬에 추가되었을 경우
    // 이것은 씬에 오브젝트가 추가되거나, addToDisplayList 메서드로 다른 씬에 추가되었을 때 동작합니다.
    else {
      this.remove(gameObject)
    }
  }

  private onGameObjectRemoveFromScene = (gameObject: OptimizableObject, scene: Phaser.Scene) => {
    this.__objects.has(gameObject)

    // 현재 플러그인이 담당하는 씬에서 제거되었을 경우
    // 이것은 removeFromDisplayList, 또는 destroy 메서드로 씬에서 파괴되었을 때 동작합니다.
    if (!scene || scene === this.scene) {
      this.remove(gameObject)
    }
  }

  /**
   * 게임 오브젝트를 최적화 목록에 등록합니다.
   * 등록된 게임 오브젝트는, 카메라에 비추어지고 있지 않을 경우, displayList 목록에서 제거되어 게임을 더욱 빠르게 실행할 수 있도록 도와줍니다.
   * @param gameObject 최적화 목록에 등록할 게임 오브젝트입니다.
   */
  add(gameObject: OptimizableObject): this {
    // 이전에 추가된 이벤트를 제거하고, 다시 할당합니다.
    // 이벤트가 할당되어 있지 않다면 무시될 것입니다.
    this.remove(gameObject)

    this.__objects.add(gameObject)

    // 이벤트 초기화
    gameObject.once(Phaser.GameObjects.Events.ADDED_TO_SCENE, this.onGameObjectAddedToScene)
    gameObject.once(Phaser.GameObjects.Events.REMOVED_FROM_SCENE, this.onGameObjectRemoveFromScene)
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.onGameObjectRemoveFromScene)

    return this
  }

  /**
   * `add` 메서드로 등록한 게임 오브젝트를 최적화 목록에서 제거합니다.  
   * 만일 게임 오브젝트가 최적화로 인해 숨겨진 상태에서 이 메서드를 호출한다면, 오브젝트는 숨겨진 상태로 남아있게 됩니다.  
   * 따라서 *직접 `gameObject.addToDisplayList` 메서드를 호출하여 등록하여야 합니다.*
   * ```
   * this.optimization.remove(gameObject)
   * gameObject.addToDisplayList(this.sys.displayList)
   * ```
   * @param gameObject 최적화 목록에서 제거할 게임 오브젝트입니다.
   */
  remove(gameObject: OptimizableObject): this {
    this.__objects.delete(gameObject)

    gameObject.off(Phaser.GameObjects.Events.ADDED_TO_SCENE, this.onGameObjectAddedToScene)
    gameObject.off(Phaser.GameObjects.Events.REMOVED_FROM_SCENE, this.onGameObjectRemoveFromScene)
    gameObject.off(Phaser.GameObjects.Events.DESTROY, this.onGameObjectRemoveFromScene)

    return this
  }

  /**
   * 현재 플러그인의 디스플레이 리스트에 해당 오브젝트를 추가합니다.
   * gameObject.addToDisplayList 메서드와 다른 점은, ADDED_TO_SCENE 이벤트를 발생시키지 않는다는 점입니다.
   * 만일 오브젝트의 디스플레이 리스트가, 플러그인의 디스플레이 리스트와 다를 경우 무시됩니다.
   * @param gameObject 디스플레이 리스트에 추가하고자 할 게임 오브젝트입니다.
   */
  private addToDisplayList(gameObject: OptimizableObject): void {
    const displayList = this.scene.sys.displayList
    if (displayList.exists(gameObject)) {
      return
    }

    gameObject.displayList = displayList

    displayList.add(gameObject, true)
    displayList.queueDepthSort()
  }

  /**
   * 현재 플러그인의 디스플레이 리스트에서 해당 오브젝트를 제거합니다.
   * gameObject.removeFromDisplayList 메서드와 다른 점은, REMOVE_FROM_SCENE 이벤트를 발생시키지 않는다는 점입니다.
   * 만일 오브젝트의 디스플레이 리스트가, 플러그인의 디스플레이 리스트와 다를 경우 무시됩니다.
   * @param gameObject 디스플레이 리스트에서 제거하고자 할 게임 오브젝트입니다.
   */
  private removeFromDisplayList(gameObject: OptimizableObject): void {
    const displayList = this.scene.sys.displayList
    if (!displayList.exists(gameObject)) {
      return
    }

    gameObject.displayList.remove(gameObject, true)
    gameObject.displayList.queueDepthSort()
    
    ;(gameObject as any).displayList = null
  }

  /**
   * 현재 플러그인에 등록된 모든 게임 오브젝트를 순회하여, 카메라에 비추어지고 있지 않은 오브젝트는 displayList에서 제거합니다.
   * 이 메서드는 씬이 render 이벤트를 방출할 때, 자동으로 호출되므로, 직접 호출하지 않아도 됩니다.
   */
  protected optimization(): void {
    let isNeedUpdate = false

    // 업데이트된 카메라 목록이 있는지 여부를 확인합니다.
    for (const camera of this.scene.cameras.cameras) {
      if (camera.dirty) {
        isNeedUpdate = true
        break
      }
    }

    // 이전 업데이트에서 업데이트 된 내용이 없다면 중지합니다.
    if (!isNeedUpdate) {
      return
    }

    for (const gameObject of this.__objects.values()) {
      let isDisplaying = false
      for (const camera of this.scene.cameras.cameras) {
        if (!isDisplayingOnCamera(camera, gameObject)) {
          continue
        }
        isDisplaying = true
        break
      }

      if (isDisplaying) {
        this.addToDisplayList(gameObject)
      }
      else {
        this.removeFromDisplayList(gameObject)
      }
    }
  }

  /**
   * 씬이 파괴되었을 때 호출됩니다.
   * 현재 플러그인에 등록된 모든 게임 오브젝트에서 이벤트를 제거해야 합니다.
   */
  protected disableOptimization(): void {
    this.__objects.forEach((gameObject) => {
      this.remove(gameObject)
    })
  }
}

export { Plugin }