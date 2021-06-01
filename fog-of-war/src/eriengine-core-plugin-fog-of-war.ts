import { getSmaller } from '@common/Math/MathUtil'
import Phaser from 'phaser'

type Target = Phaser.GameObjects.Sprite&Phaser.GameObjects.Image
type Revealer = Target&Phaser.GameObjects.Components.Transform

class Plugin extends Phaser.Plugins.ScenePlugin {
  private enabled: boolean = false
  private revealer: Revealer|null = null
  private light: Phaser.GameObjects.Light|null = null
  private daylight: number = 0
  private daylightDone: boolean = true
  private daylightTween: Phaser.Tweens.Tween|null = null
  private color: number = 0xffffff
  private ambientColor: number = 0x000000
  private radius: number = 300
  private intensity: number = 3
  private __filter: (object: Phaser.GameObjects.GameObject) => boolean = () => true

  /** Phaser3의 lights pipeline을 지원하는 타입의 게임 오브젝트만을 반환합니다. */
  private get supportedTargets(): Phaser.GameObjects.GameObject[] {
    return this.scene.children.list.filter((object: Phaser.GameObjects.GameObject): boolean => {
      return  !(object instanceof Phaser.GameObjects.Shape) &&
              !(object instanceof Phaser.GameObjects.Graphics) &&
              !(object instanceof Phaser.GameObjects.Polygon)
    })
  }

  /** `setRevealer` 메서드로 지정한 필터의 영향을 받는 씬 게임 오브젝트 목록을 반환합니다. */
  get targets(): Phaser.GameObjects.GameObject[] {
    return this.supportedTargets.filter(this.filter)
  }

  /** lights pipeline 영향을 받을 게임 오브젝트 필터를 설정합니다. */
  private set filter(value: (object: Phaser.GameObjects.GameObject) => boolean) {
    this.__filter = value
    this.setInactive(...this.scene.children.list)
    this.setActive(...this.targets)
  }

  /** lights pipeline 영향을 받을 게임 오브젝트 필터를 반환합니다. */
  private get filter() {
    return this.__filter
  }

  /**
   * 게임 오브젝트의 lights pipeline을 활성화합니다.
   * 이 메서드는 `this.filter`의 영향을 받습니다.
   * lights pipeline을 지원하지 않는 게임 오브젝트는 활성화되지 않습니다.
   * 자동으로 호출되며, *직접 호출하지 마십시오.*
   * @param targets lights pipeline을 활성화할 게임 오브젝트입니다.
   */
  private setActive(...targets: Phaser.GameObjects.GameObject[]): void {
    for (const target of targets) {
      if ( !('setPipeline' in target) ) {
        continue
      }
      const object: Target = target as Target
      object.setPipeline(Phaser.Renderer.WebGL.Pipelines.LIGHT_PIPELINE)
    }
    if (this.revealer) {
      this.setInactive(this.revealer)
    }
  }

  /**
   * 게임 오브젝트의 lights pipeline을 비활성화합니다.
   * lights pipeline을 지원하지 않는 게임 오브젝트는 활성화되지 않습니다.
   * 이는 `object.resetPipeline` 메서드를 호출하므로, 사용자가 정의한 pipeline이 있다면 주의하십시오.
   * 자동으로 호출되며, *직접 호출하지 마십시오.*
   * @param targets 
   */
  private setInactive(...targets: Phaser.GameObjects.GameObject[]): void {
    for (const target of targets) {
      if ( !('setPipeline' in target) ) {
        continue
      }
      const object: Target = target as Target
      object.resetPipeline()
    }
  }

  /**
   * 씬에 라이트 게임 오브젝트를 생성합니다.
   * 자동으로 호출되며, *직접 호출하지 마십시오.*
   * @param x 라이트가 생성될 x좌표입니다. 기본값은 `0`입니다.
   * @param y 라이트가 생성될 y좌표입니다. 기본값은 `0`입니다.
   */
  private generateLight(x: number = 0, y: number = 0): void {
    if (this.light) {
      return
    }
    this.light = this.scene.lights.addLight(x, y, this.radius, this.color, this.intensity)
  }

  /** 씬에 라이트 게임 오브젝트를 파괴합니다. */
  private destroyLight(): void {
    if (!this.light) {
      return
    }
    this.scene.lights.removeLight(this.light)
    this.light = null
  }

  /** `setRevealer` 메서드로 활성화된 리벌버를 제거합니다. 자동으로 호출되며, *직접 호출하지 마십시오.* */
  private destroyRevealer(): void {
    this.revealer = null
  }

  /** `chagneDaylight` 메서드로 활성화된 트윈을 제거합니다. 자동으로 호출되며, *직접 호출하지 마십시오.* */
  private destroyDaylightTween(): void {
    if (this.daylightTween) {
      this.daylightTween.remove()
      this.daylightTween = null
    }
  }

  /**
   * 씬에 생성된 라이트 게임 오브젝트의 위치를 갱신합니다.
   * 위치는 `setRevealer`로 지정된 리벌버의 `x`, `y` 좌표의 영향을 받습니다.
   * 자동으로 호출되며, *직접 호출하지 마십시오.*
   */
  private updateLightPosition(): void {
    if (!this.light || !this.revealer) {
      return
    }
    const { x, y } = this.revealer
    this.light.setPosition(x, y)
  }

  /**
   * `setRevealer` 메서드로 지정된 리벌버 게임 오브젝트의 시야 반경 반지름 너비를 설정합니다.
   * @param radius 시야 반경 반지름 너비입니다.
   */
  setRadius(radius: number): this {
    this.radius = radius
    if (this.light) {
      this.light.setRadius(radius)
    }
    return this
  }

  /**
   * `setRevealer` 메서드로 지정된 리벌버 게임 오브젝트의 시야의 빛의 강도를 지정합니다.
   * 이 값이 크면 더 강렬한 빛이 비추어집니다. 약간 어두운 시야를 가지고 싶다면, 이 값을 약하게 하여 빛의 강도를 약하게 하십시오.
   * @param intensity 빛의 강도입니다.
   */
  setIntensity(intensity: number): this {
    this.intensity = intensity
    if (this.light) {
      this.light.setIntensity(intensity)
    }
    return this
  }

  /**
   * `setRevealer` 메서드로 지정된 리벌버 게임 오브젝트의 시야의 빛의 색상을 지정합니다.
   * 이는 빛의 색상을 지정하는 것이고, 빛이 닿지 않는 어둠의 색상을 지정하는 것이 아닙니다. 어둠의 색상을 지정하고 싶다면, `setAmbientColor` 메서드를 이용하십시오.
   * @param color 빛의 색상입니다.
   */
  setColor(color: number): this {
    this.color = color
    if (this.light) {
      this.light.setColor(color)
    }
    return this
  }

  /**
   * `setRevealer` 메서드로 지정된 리벌버 게임 오브젝트의 시야의 주변 어둠의 색상을 지정합니다.
   * 이는 빛의 색상을 지정하는 것이 아니고, 빛이 닿지 않는 어둠의 색상을 지정하는 것입니다. 빛의 색상을 지정하고 싶다면 `setColor` 메서드를 이용하십시오.
   * @param ambientColor 어둠의 색상입니다.
   */
  setAmbientColor(ambientColor: number): this {
    this.ambientColor = ambientColor
    this.scene.lights.setAmbientColor(ambientColor)
    return this
  }

  private changeDaylightEffect<T extends { color: number, ambient: number }>(before: T, after: T, duration: number): Promise<void> {
    return new Promise((resolve): void => {
      this.daylightDone = false
      this.daylightTween = this.scene.tweens.addCounter({
        from: 0,
        to: 100,
        duration,
        onUpdate: (tween): void => {
          const step = tween.getValue()
          const a = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.IntegerToColor(before.color),
            Phaser.Display.Color.IntegerToColor(after.color),
            100,
            step
          )
          const b = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.IntegerToColor(before.ambient),
            Phaser.Display.Color.IntegerToColor(after.ambient),
            100,
            step
          )
  
          const newColor = Phaser.Display.Color.GetColor32(a.r, a.g, a.b, a.a)
          const newAmbient = Phaser.Display.Color.GetColor32(b.r, b.g, b.b, b.a)
          this.setColor(newColor)
          this.setAmbientColor(newAmbient)
        },
        onComplete: () => {
          this.daylightDone = true
          resolve()
        }
      })
    })
  }

  /**
   * `setColor`, `setAmbientColor` 메서드를 이용해 낮/노을/밤 효과를 만듭니다.
   * `duration` 매개변수를 지정하면 부드럽게 시간이 변하는 효과를 줄 수 있습니다. 
   * 시간의 순서는 `daytime` → `twilight` → `night` 입니다. 마지막으로 지정한 값이 `daytime`이고, `night`로 변경한다면, 중간인 `twilight`을 거쳐서 시간대가 변화됩니다.
   * `twilight`에서 `daytime`으로 변화할 경우, `twilight` → `night` → `daytime` 순서로 변경됩니다. 이는 현실적인 시간 변화 효과를 줄 수 있습니다.
   * @param time 시간대를 설정합니다. `daytime`, `twilight`, `night` 중 선택할 수 있습니다.
   * @param duration 이 값을 지정하면 부드럽게 변화하는 효과를 줄 수 있습니다. 기본값은 `0`입니다.
   * @param nextDay 이 값을 `true`로 지정하면 현재 시각과 `time`이 같아도, 무조건 한 번 순회합니다. 가령 현재 시간이 `night`인데, `time`을 `night`로 지정하면 어떤 작동도 하지 않지만, 이 값을 `true`로 지정하면 하루를 순회합니다.
   */
  async changeDaylight(time: 'daytime'|'twilight'|'night', duration: number = 0, nextDay: boolean = false): Promise<void> {
    if (!this.enabled) {
      throw 'The \'enable\' method must be called first.'
    }

    this.destroyDaylightTween()

    const daytime = [Phaser.Display.Color.GetColor(255, 255, 255), Phaser.Display.Color.GetColor(255, 255, 255)]
    const twilight = [Phaser.Display.Color.GetColor(255, 255, 255), Phaser.Display.Color.GetColor(255, 100, 50)]
    const night = [Phaser.Display.Color.GetColor(255, 255, 255), Phaser.Display.Color.GetColor(0, 0, 0)]

    const times = new Map([
      ['daytime', 0],
      ['twilight', 1],
      ['night', 2]
    ])

    const timelines: number[] = []
    let i = this.daylight
    const stop = times.get(time)!
    while (++i) {
      const current = i % 3
      if (timelines.includes(current)) {
        break
      }
      timelines.push(current)
      if (current === stop) {
        break
      }
    }
    
    // 현재와 같은 시간대일 경우 색상을 변경하지 않습니다.
    // 하지만 만약 이전에 변경되던 도중이었다면, 무조건 nextDay를 활성화합니다.
    if (!this.daylightDone) {
      nextDay = true
    }
    if (!nextDay && timelines.length === 3) {
      timelines.length = 0
    }

    const daylights = [daytime, twilight, night]
    const interval = duration / timelines.length

    let beforeColor: number = this.color
    let beforeAmbient: number = this.ambientColor

    for (const daylight of timelines) {
      const [afterColor, afterAmbient] = daylights[daylight]
      
      await this.changeDaylightEffect(
        { color: beforeColor, ambient: beforeAmbient },
        { color: afterColor, ambient: afterAmbient },
        interval
      )
        
      beforeColor = this.color
      beforeAmbient = this.ambientColor

      this.daylight = daylight
    }
  }

  /**
   * 지정된 게임 오브젝트 주변에 빛이 밝혀집니다. 씬에서 단 하나의 게임 오브젝트에만 빛을 밝힐 수 있습니다.
   * 이는 게임의 주인공의 시야를 구현하는 용도로 사용하기에 좋습니다.
   * @param target 빛을 밝힐 게임 오브젝트입니다.
   * @param color 빛의 색상입니다. 기본값은 `this.color`입니다.
   * @param ambientColor 주변 어둠의 색상을 지정합니다. 기본값은 `this.ambientColor`입니다.
   * @param filter 전장의 안개의 영향을 받을 게임 오브젝트 필터 함수입니다. 이 함수는 매개변수로 게임 오브젝트를 받습니다.
   * 필터 함수는 씬의 모든 게임 오브젝트를 대상으로 작동하며, 이 함수가 `false`를 반환하면 해당 오브젝트는 전장의 안개의 영향을 받지 않습니다.
   * 가령 텍스트 게임 오브젝트를 전장의 안개의 효과에서 제외하고 싶다면, 아래처럼 사용할 수 있습니다.
   * ```
   * setRevealer(yourTarget, 0x000000, (object): boolean => {
   *   if (object instanceof Phaser.GameObjects.Text) {
   *     return false
   *   }
   *   return true
   * })
   * ```
   * 기본값은 `() => true` 입니다. 이는 씬에 있는 모든 게임 오브젝트를 대상으로 전장의 안개를 활성화하겠다는 의미입니다.
   */
  setRevealer(target: Revealer, color: number = this.color, ambientColor: number = this.ambientColor, filter = this.filter): this {
    if (!this.enabled) {
      throw 'The \'enable\' method must be called first.'
    }

    this.revealer = target
    this.color = color
    this.ambientColor = ambientColor
    this.filter = filter

    const { x, y } = target
    this.destroyLight()
    this.generateLight(x, y)
    
    return this
  }

  /**
   * 해당 씬에 빛 효과 플러그인을 활성화합니다.
   * `setRevealer`, `changeDaylight` 메서드를 사용하기 전에 해당 메서드를 먼저 호출해야 정상적으로 작동합니다.
   * 이 작업은 돌이킬 수 없습니다. 빛 효과는 씬을 구별하지 않으므로 주의하십시오. 가령 gui씬에서 이 메서드로 플러그인을 활성화한다면 다른 씬의 빛의 영향을 받게 됩니다.
   */
  enable(): this {
    if (this.enabled) {
      return this
    }

    this.setInactive(...this.scene.children.list)
    this.setActive(...this.targets)

    this.scene.lights.enable()
    this.scene.lights.setAmbientColor(this.ambientColor)
    this.enabled = true
    return this
  }

  /**
   * `setRevealer` 메서드로 지정한 필터를 통과한 게임 오브젝트를 lights pipeline을 활성화합니다.
   * @param object 게임 오브젝트입니다.
   */
  private onAdded(object: Phaser.GameObjects.GameObject): void {
    if (this.enabled && this.filter(object)) {
      this.setActive(object)
    }
  }

  boot(): void {
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update.bind(this))
    this.scene.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, this.onAdded.bind(this))
  }

  /**
   * 씬이 매 프레임 업데이트 될 때 마다 호출될 메서드입니다.
   * 씬이 일시중지되었거나,파괴되었다면 더 이상 호출되지 않습니다.  
   * *절대 직접 호출하지 마십시오.*
   * @param time 씬이 시작한 후 흐른 시간(ms)입니다.
   * @param delta 이전 프레임과 현재 프레임 사이에 흐른 시간(ms)입니다. 게임은 일반적으로 60프레임이므로, 1/60초인 0.016초입니다.
   */
  update(time: number, delta: number): void {
    this.updateLightPosition()
  }

  destroy(): void {
    this.destroyLight()
    this.destroyRevealer()
    this.destroyDaylightTween()
  }
}

export { Plugin }