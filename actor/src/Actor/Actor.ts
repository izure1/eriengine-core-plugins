import Phaser from 'phaser'
import { v4 as uuid } from 'uuid'

import { createIsometricDiamondPoints, getIsometricSide, GridObject, Point2, getAngleBetweenPoints } from '@common/Math/MathUtil'
import { Plugin as ActorPlugin } from '../eriengine-core-plugin-actor'
import { ActorBattle } from './ActorBattle'
import { ActorRun } from './ActorRun'
import { ActorDot } from './ActorDot'
import { ActorBubble } from './ActorBubble'
import { ActorParticle } from './ActorParticle'
import { ActorBullet } from './ActorBullet'

export abstract class Actor extends Phaser.Physics.Matter.Sprite implements GridObject {
  /**
   * 자신의 정보를 담고있는 프록시 정보입니다.
   */
  private readonly __proxy: Actor

  /** 액터의 고유값입니다. 액터를 비교하기 위해서, 해당 값을 사용할 수 있습니다. 이 값은 읽기 전용입니다. */
  readonly id: string = uuid()

  /**
   * 액터의 플러그인 설정입니다. *건드리지 마십시오.*
   */
  plugin!: ActorPlugin

  /**
   * 액터의 교전 시스템을 담당합니다.
   * 각 액터를 세력으로 구분하고, 스킬을 추가하고, 사용합니다.
   * 스킬을 사용할 때, 지정한 특정 세력에게만 작용하도록 할 수 있습니다.
   * 가령 아군에게 버프를 주고 싶다면, 아군 액터를 `setAlly` 메서드를 이용하여 등록한 뒤, `useSkill` 메서드에 아군 세력만을 효과 범위로 지정해 호출하십시오.
   */
  readonly battle: ActorBattle

  /**
   * 액터의 말풍선 목록이 담겨져 있습니다.
   * `of` 메서드를 이용하여 새로운 말풍선을 만들거나 가져오십시오.
   */
  readonly bubble: ActorBubble

  /**
   * 액터 주변으로 파티클 효과를 줍니다. 이는 액터가 스킬을 사용하거나, 파괴될 때 주변에 폭발효과를 주는 등에 사용하기에 좋습니다.
   */
  readonly particle: ActorParticle

  /**
   * 액터의 움직임을 담당합니다. 액터 인스턴스에 물리적인 힘을 가하여 상하좌우로 움직이게 만듭니다.
   * 특정 지역까지 이동하는 좌표 목록을 주어, 액터가 길을 찾아 움직일 수 있도록 할 수도 있습니다.
   */
  readonly run: ActorRun

  /**
   * 액터의 탄막 시스템을 구현합니다. 투사체를 발사하거나, 맞았을 때 구현하기에 좋습니다.
   */
  readonly bullet: ActorBullet

  /**
   * 액터에게 꾸준한 효과를 주기 위해 사용됩니다. 가령 독 데미지같이 몇 초에 걸쳐 꾸준한 효과를 주어야할 때 사용합니다.
   */
  readonly dot: ActorDot

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string|Phaser.Textures.Texture, frame?: string|number, option?: Phaser.Types.Physics.Matter.MatterBodyConfig) {
    super(scene.matter.world, x, y, texture, frame, option)

    this.initVertices()

    this.__proxy = new Proxy(this, {
      set: this.PROXY_SETTER.bind(this)
    })

    this.battle = new ActorBattle(this.__proxy)
    this.bubble = new ActorBubble(this.__proxy)
    this.particle = new ActorParticle(this.__proxy)
    this.run = new ActorRun(this.__proxy)
    this.bullet = new ActorBullet(this.__proxy)
    this.dot = new ActorDot(this.__proxy)

    return this.__proxy
  }

  /** 씬의 메인카메라가 현재 액터를 따라다니는지 여부를 반환합니다. */
  get isCameraFollowing(): boolean {
    if (
      !this.scene ||
      !this.scene.cameras ||
      !this.scene.cameras.main
    ) {
      return false
    }

    return this.scene.cameras.main._follow === this
  }

  /** 액터의 충돌체입니다. */
  get matterBody(): MatterJS.BodyType {
    return this.body as MatterJS.BodyType
  }

  /** 액터가 가지는 충돌체의 한 변의 길이입니다. */
  get side(): number {
    const xHalf = this.displayWidth / 2

    return getIsometricSide(xHalf)
  }

  protected PROXY_SETTER(target: Actor, prop: keyof Actor, value: any): true {
    (target as any)[prop] = value

    switch (prop) {
      case 'scale':
      case 'scaleX':
      case 'scaleY':
      case 'width':
      case 'height':
      case 'displayWidth':
      case 'displayHeight':
        this.initVertices()
        break
        
      case 'x':
      case 'y':
        this.sortDepth()
        break
    }

    return true
  }

  /** 액터의 가로크기(displayWidth)를 이용하여 충돌체를 생성하여 반환합니다. */
  protected createVertices(): MatterJS.Vector[] {
    const points = createIsometricDiamondPoints(this.displayWidth)
    const vertices = this.scene.matter.vertices.create(points, this.matterBody)
    return vertices
  }

  /**
   * 액터의 가로크기(displayWidth)를 이용하여 충돌체를 생성한 뒤, 액터에 적용합니다.  
   * 흔히 액터의 크기가 변경되었을 때 호출합니다.
   * 액터의 `scale`, `scaleX`, `scaleY`, `width`, `height`, `displayWidth`, `displayHeight` 속성이 변경되었을 때 자동으로 호출됩니다.
   * 따라서 일반적으론 직접 호출할 필요가 없습니다.
   */
  protected initVertices(): void {
    this.scene.matter.body.setVertices(this.matterBody, this.createVertices())
    this.scene.matter.body.setInertia(this.matterBody, Infinity)

    this.setOrigin(0.5, (this.displayHeight - this.displayWidth / 4) / this.displayHeight)
  }

  /**
   * 플러그인의 `addActor` 메서드로 액터가 추가되었을 때 자동으로 호출될 메서드입니다.
   * *절대 직접 호출하지 마십시오.*
   */
  __initPlugin(plugin: ActorPlugin): void {
    this.plugin = plugin

    const updateBound = (time: number, delta: number): void => {
      if (this.active) {
        this.update(time, delta)
        this.updateDefaultPlugins(time, delta)
      }
    }
    
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, updateBound)

    this.on(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.events.off(Phaser.Scenes.Events.UPDATE, updateBound)

      this.end()
      this.stopFollowCamera()
      this.destroyDefaultPlugins()

      this.plugin.dropActor(this)
    })
  }

  /**
   * 이 액터를 기준으로 주변에 다른 액터를 탐색하여, 찾은 모든 액터를 배열로 반환합니다.
   * 자신은 제외됩니다.
   * @param radius 검색할 반경입니다.
   * @param actors 검색할 리스트입니다. 기본값으로 씬의 모든 Actor 인스턴스가 포함됩니다.
   * @param sortByDistance 검색된 리스트를 액터의 좌표로부터 가까운 순서대로 정렬해서 반환할 것인지 여부를 지정합니다.
   */
  getAroundActors(radius: number, actors: Actor[] = this.plugin.actors, sortByDistance: boolean = false): Actor[] {
    const aroundActors = this.plugin.getActorsInArea(this.x, this.y, radius, actors, sortByDistance)

    const i = aroundActors.indexOf(this)
    if (i !== -1) {
      aroundActors.splice(i, 1)
    }
    return aroundActors
  }

  /**
   * 대상과의 각도를 구합니다.
   * @param to 대상의 위치입니다.
   * @returns 액터를 기준으로 대상을 향하는 각도를 반환합니다.
   */
  getAngleBetween(to: Point2): number {
    return getAngleBetweenPoints(this, to)
  }

  /**
   * 현재 액터를 기준으로 특정 각도와 거리를 주어 해당 지역의 좌표를 얻어옵니다.
   * @param angle 액터를 기준으로 가르킬 방향입니다.
   * @param radius 액터를 기준으로 `angle` 매개변수로 나아갈 거리입니다.
   * @returns 주어진 `angle`, `radius` 매개변수를 종합하여, 해당 각도로 나아간 거리에 있는 좌표를 반환합니다.
   */
  getPointFromAngle(angle: number, radius: number): Point2 {
    const rad = Phaser.Math.DegToRad(angle)
    const x = Math.cos(rad) * radius
    const y = Math.sin(rad) * radius

    return {
      x: x + this.x,
      y: y + this.y
    }
  }

  /**
   * 액터가 씬에 추가되었을 때 호출될 메서드입니다.  
   * *절대 직접 호출하지 마십시오.*
   */
  abstract start(): void

  /**
   * 액터가 씬에 추가된 후, 씬이 매 프레임 업데이트 될 때 마다 호출될 메서드입니다.
   * 씬이 일시중지되었거나,파괴되었다면 더 이상 호출되지 않습니다.  
   * *절대 직접 호출하지 마십시오.*
   * @param time 씬이 시작한 후 흐른 시간(ms)입니다.
   * @param delta 이전 프레임과 현재 프레임 사이에 흐른 시간(ms)입니다. 게임은 일반적으로 60프레임이므로, 1/60초인 0.016초입니다.
   */
  abstract update(time: number, delta: number): void

  /**
   * 액터가 파괴되었을 때 호출될 메서드입니다.  
   * *절대 직접 호출하지 마십시오.*
   */
  abstract end(): void

  /** 액터의 `y` 좌표를 이용하여 `depth` 값을 설정합니다. 일반적으로 자동으로 호출되며, *절대 직접 호출하지 마십시오.* */
  private sortDepth(): void {
    this.setDepth(this.y)
  }

  /** 액터에서 사용하는 기본 플러그인을 업데이트합니다. 일반적으로 자동으로 호출되며, *절대 직접 호출하지 마십시오.* */
  private updateDefaultPlugins(time: number, delta: number): void {
    ActorDot.update(this.dot, time, delta)
    ActorRun.update(this.run, time, delta)
    ActorBubble.update(this.bubble, time, delta)
    ActorParticle.update(this.particle, time, delta)
    ActorBullet.update(this.bullet, time, delta)
  }

  /** 액터에서 사용하는 기본 플러그인을 파괴합니다. 일반적으로 자동으로 호출되며, *절대 직접 호출하지 마십시오.* */
  private destroyDefaultPlugins(): void {
    ActorDot.destroy(this.dot)
    ActorRun.destroy(this.run)
    ActorBattle.destroy(this.battle)
    ActorBubble.destroy(this.bubble)
    ActorParticle.destroy(this.particle)
    ActorBullet.destroy(this.bullet)
  }

  // Fix bug matter.js setStatic removes body issue (#https://github.com/liabru/matter-js/issues/641)
  /**
   * Changes the physics body to be either static `true` or dynamic `false`.
   * @param value `true` to set the body as being static, or `false` to make it dynamic.
   */
  setStatic(value: boolean): this {
    if (value === this.isStatic()) {
      return this
    }

    super.setStatic(value)

    return this
  }

  /**
   * 씬의 메인카메라가 액터를 따라다니도록 설정합니다.
   * @param zoom 카메라의 줌 수치를 정합니다. 기본값은 `1`입니다.
   * @param duration 카메라가 처음으로 액터로 이동할 때 걸릴 시간(ms)입니다. 기본값은 `300`입니다.
   * @param lerpX 액터가 움직일 때, 카메라가 x좌표로 따라 움직이는데 걸리는 반응속도입니다. 기본값은 `1`입니다.
   * @param lerpY 액터가 움직일 때, 카메라가 y좌표로 따라 움직이는데 걸리는 반응속도입니다. 기본값은 `lerpX`입니다.
   */
  followCamera(zoom: number = 1, duration: number = 300, lerpX: number = 1, lerpY: number = lerpX): this {
    this.scene.cameras.main.zoomTo(zoom, duration, Phaser.Math.Easing.Expo.Out).startFollow(this, undefined, lerpX, lerpY)

    return this
  }

  /** 씬의 메인카메라가 액터를 그만 따라다니도록 설정합니다. */
  stopFollowCamera(): this {
    if (this.isCameraFollowing) {
      this.scene.cameras.main.stopFollow()
    }
    
    return this
  }
}