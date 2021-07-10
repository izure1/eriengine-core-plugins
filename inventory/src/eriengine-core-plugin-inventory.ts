import Phaser from 'phaser'
import { Point2 } from '@common/Math/MathUtil'

import { Inventory } from './Inventory'
import { ItemBlueprint } from './Item'

export class Plugin extends Phaser.Plugins.ScenePlugin {
  private __inventories: Map<any, Inventory> = new Map
  private __itemBlueprints: Map<string, ItemBlueprint> = new Map

  boot(): void {
    this.scene.events.on(Phaser.Scenes.Events.DESTROY, this.destroy.bind(this))
  }

  /** `addItemBlueprint` 메서드로 추가된 모든 아이템 타입을 배열로 반환합니다. */
  get blueprints(): ItemBlueprint[] {
    return Array.from(this.__itemBlueprints.values())
  }

  /** `addItemBlueprint` 메서드로 추가된 모든 아이템의 키값을 배열로 반환합니다. */
  get blueprintKeys(): string[] {
    return Array.from(this.__itemBlueprints.keys())
  }

  // 인벤토리 주인을 설정하고, 인벤토리 인스턴스를 생성 및 반환
  /**
   * 인벤토리의 주인을 설정하고, 인벤토리 인스턴스를 생성합니다.
   * 기존에 이미 생성했다면 생성되었던 인벤토리 인스턴스를 반환합니다.
   * @param owner 인벤토리의 주인입니다. 문자열, 게임 오브젝트 등 모든 타입을 사용할 수 있습니다.
   * @returns 생성된 인벤토리 인스턴스입니다.
   */
  of(owner: any): Inventory {
    if (!this.__inventories.has(owner)) {
      this.__inventories.set(owner, new Inventory(this, owner))
    }
    return this.__inventories.get(owner)!
  }

  /**
   * 새로운 아이템 블루프린트를 추가합니다.
   * 추가한 이후에 인벤토리 인스턴스에서 동일한 `key` 속성을 이용하여 아이템을 추가/사용할 수 있습니다.
   * ```
   * this.inventory.addItemBlueprint({ key: 'potion', ... })
   * this.inventory.of(myActor).add('potion') // 아이템 추가
   * this.inventory.of(myActor).use('potion') // 아이템 사용
   * ```
   * @param item 아이템의 상세 구현이 되어있는 설계도입니다.
   */
  addItemBlueprint(item: ItemBlueprint): this {
    this.__itemBlueprints.set(item.key, item)

    return this
  }

  /**
   * `addItemBlueprint` 메서드로 해당 아이템 블루프린트를 추가했는지 여부를 반환합니다.
   * @param key 추가한 아이템 블루프린트의 고유 키값입니다.
   */
  hasItemBlueprint(key: string): boolean {
    return this.__itemBlueprints.has(key)
  }

  /**
   * `addItemBlueprint` 메서드로 추가된 아이템 블루프린트를 반환합니다.
   * 추가되지 않았다면 `null`을 반환합니다.
   * @param key 추가한 아이템 블루프린트의 고유 키값입니다.
   */
  getItemBlueprint(key: string): ItemBlueprint|null {
    return this.__itemBlueprints.get(key) ?? null
  }

  destroy(): void {
    this.__inventories.clear()
    this.__itemBlueprints.clear()
  }
}