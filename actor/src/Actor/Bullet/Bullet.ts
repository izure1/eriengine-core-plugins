import Phaser from 'phaser'
import { Actor } from '../Actor'
import { Point2 } from '@common/Math/MathUtil'
import { ActorParticle } from '@common/Phaser/ActorParticle'
import { CollideHandler, CollideObject, BeforeDestroyHandler } from './types'

export class Bullet extends Phaser.Physics.Matter.Sprite {
  private readonly collideEventName = Symbol('onCollide')
  private readonly beforeDestroyEventName = Symbol('onDestroy')
  readonly actor: Actor
  readonly particle: ActorParticle

  constructor(actor: Actor, x: number, y: number, texture: string | Phaser.Textures.Texture, frame?: string | number | undefined, options?: Phaser.Types.Physics.Matter.MatterBodyConfig | undefined) {
    super(actor.world, x, y, texture, frame, options)

    this.actor = actor
    this.particle = new ActorParticle(this)

    this.generateEvents()
    this.once(Phaser.GameObjects.Events.DESTROY, this.onDestroy.bind(this))
  }

  private onDestroy(): void {
    this.emit(this.beforeDestroyEventName)

    this.destroyParticle()
    this.removeEvents()
  }

  private destroyParticle(): void {
    ActorParticle.destroy(this.particle)
  }
  
  private removeEvents(): void {
    this.removeListener(this.collideEventName)
    this.removeListener(this.beforeDestroyEventName)
  }

  /** 현재 탄막의 속도를 2차원 벡터로 반환합니다. */
  get velocity(): Point2 {
    return this.body?.velocity ?? { x: 0, y: 0 }
  }

  /**
   * 대상과의 각도를 구합니다.
   * @param target 대상의 위치입니다.
   * @returns 대상을 향하는 각도를 반환합니다.
   */
  getAngleBetween(target: Point2): number {
    return this.actor.bullet.getAngleBetweenPoints(this, target)
  }

  /**
   * 해당 각도를 향해 투사체를 발사합니다.
   * 발사에는 물리적인 힘이 필요하며, `force` 매개변수로 지정할 수 있습니다.
   * 힘의 단위는 일반적으로 `0 ~ 1` 사이의 실수이지만, 투사체의 크기와 마찰력, 그리고 중력에 따라 필요한 힘이 달라질 수 있습니다.
   * 
   * 투사체는 해당 각도로 발사되지만, 중력, 마찰력 등을 포함해 힘이 다하면 멈추게 됩니다.
   * 만일 일직선으로 직진하는 투사체가 필요하다면 `addRocket`, `addMissile` 등의 인스턴스를 생성한 뒤, `fireRocket`, `fireMissile` 메서드를 사용하십시오.
   * @param angle 발사각입니다.
   * @param fireForce 발사 시 가할 힘의 크기이며, 일반적으로 `0 ~ 1` 사이의 실수입니다.
   */
  fireBullet(angle: number, fireForce: number): this {
    const rad = Phaser.Math.DegToRad(angle)
    const x = Math.cos(rad) * fireForce
    const y = Math.sin(rad) * fireForce
    
    this.applyForce(new Phaser.Math.Vector2(x, y))
    return this
  }

  private getPairCollider(e: Phaser.Types.Physics.Matter.MatterCollisionData): CollideObject|null {
    const { bodyA, bodyB } = e
    for (const body of [ bodyA, bodyB ]) {
      const { gameObject } = body
      if (!gameObject) {
        continue
      }
      if (body === this.body) {
        continue
      }
      return gameObject
    }
    return null
  }

  private generateEvents(): void {
    this.setOnCollide((e: Phaser.Types.Physics.Matter.MatterCollisionData) => {
      const pair = this.getPairCollider(e)
      if (!pair) {
        return null
      }
      this.emit(this.collideEventName, e, pair)
    })
  }

  /**
   * 이 투사체가 물리객체와 충돌했을 때 호출될 콜백함수를 등록합니다.
   * 등록한 콜백 함수는 충돌 이벤트와, 충돌한 대상을 매개변수로 받습니다.
   * 이 메서드를 여러번 호출하면 여러개의 콜백함수를 등록할 수 있으며, 이후 등록한 순서대로 호출됩니다.
   * @param callback 이 투사체가 물리객체와 충돌했을 때 호출될 콜백함수입니다.
   */
  addCollideEvent(callback: CollideHandler): this {
    this.on(this.collideEventName, callback)
    return this
  }

  /**
   * 이 투사체가 `destroy` 메서드를 통해 파괴되었을 때 투사체가 초기화되기 전, 호출될 콜백함수를 등록합니다.
   * 이는 `on('destroy', ...)` 메서드를 통해 지정하는 것보다 안정적입니다.
   * @param callback 이 투사체가 `destroy` 메서드를 통해 파괴되었을 때 호출될 콜백함수입니다.
   */
  addBeforeDestroyEvent(callback: BeforeDestroyHandler): this {
    this.once(this.beforeDestroyEventName, callback)
    return this
  }
}