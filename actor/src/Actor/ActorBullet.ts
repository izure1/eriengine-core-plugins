import Phaser from 'phaser'
import { base64Load } from '@common/Phaser/AssetLoader'
import { Point2 } from '@common/Math/MathUtil'
import { Actor } from './Actor'
import { Bullet } from './Bullet/Bullet'
import { Rocket } from './Bullet/Rocket'
import { Missile } from './Bullet/Missile'
import { CollideHandler } from './Bullet/types'

export class ActorBullet {
  private readonly bulletset: Set<Bullet> = new Set
  private readonly actor: Actor

  private static generateTexture(scene: Phaser.Scene): void {
    // base64Load(scene, BubbleEmotion['?'], bubbleQuestion)
  }

  static update(bullet: ActorBullet, time: number, delta: number): void {
    bullet.update(time, delta)
  }

  static destroy(bullet: ActorBullet): void {
    bullet.destroy()
  }

  /** 생성된 모든 탄막을 배열로 반환합니다. */
  get bullets(): Bullet[] {
    return [...this.bulletset]
  }

  /** 생성된 모든 탄막 중, `Rocket` 인스턴스만 배열로 반환합니다. */
  get rockets(): Rocket[] {
    return this.bullets.filter((bullet) => bullet instanceof Rocket) as Rocket[]
  }

  /** 생성된 모든 탄막 중, `Missile` 인스턴스만 배열로 반환합니다. */
  get missiles(): Missile[] {
    return this.bullets.filter((bullet) => bullet instanceof Missile) as Missile[]
  }

  private update(time: number, delta: number): void {
    for (const bullet of this.bulletset) {
      bullet.update(time, delta)
    }
  }

  constructor(actor: Actor) {
    this.actor = actor
    ActorBullet.generateTexture(this.actor.scene)
  }

  private destroy(): void {
    for (const bullet of this.bulletset) {
      bullet.destroy()
    }
    this.bulletset.clear()
  }

  /**
   * 로켓 투사체를 생성합니다.
   * 로켓 투사체는 지정한 방향으로 직진하는 특징을 가진 투사체를 구현하기에 적합합니다.
   * 이 투사체를 발사하기 위해서는 `fire`, `fireToAngle`, `fireToTarget` 메서드를 사용하십시오.
   * 
   * 만일 파티클 기능을 사용하고 싶다면, 해당 인스턴스의 `particle` 속성을 사용하십시오.
   * 투사체가 충돌하였을 때 작동할 콜백함수는 `addCollideEvent` 메서드를 사용하십시오.
   * @example
   * ```
   * const rocket = this.bullet.addRocket({ x: 0, y: 0 }, 'rocket')
   * rocket.particle.add('flame', 'flame.png')
   * rocket.addCollideEvent((e, pair) => {
   *   if (pair !== me) {
   *     pair.destroy()
   *   }
   *   rocket.particle.explode('flame', 30)
   *   rocket.destroy()
   * })
   * ```
   * @param point 로켓이 생성될 좌표입니다.
   * @param texture 로켓에 사용할 텍스쳐입니다.
   * @param frame 로켓에 사용할 애니메이션 프레임입니다.
   * @param onCollide 로켓이 물리 객체와 충돌하였을 때 호출할 콜백함수를 지정합니다. `addCollideEvent` 메서드를 통해서도 등록할 수 있습니다.
   * @param onBeforeDestroy 로켓이 파괴되었을 때 호출할 콜백함수를 지정합니다. `addBeforeDestroyEvent` 메서드를 통해서도 등록할 수 있습니다.
   */
  addRocket(point: Point2, texture: string|Phaser.Textures.Texture, frame?: string|number, onCollide?: CollideHandler, onBeforeDestroy?: () => void): Rocket {
    const { x, y } = point
    const bullet = new Rocket(this.actor, x, y, texture, frame)

    this.bulletset.add(bullet)
    this.actor.scene.add.existing(bullet)

    if (onCollide) {
      bullet.addCollideEvent(onCollide)
    }

    if (onBeforeDestroy) {
      bullet.addBeforeDestroyEvent(onBeforeDestroy)
    }

    bullet.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.bulletset.delete(bullet)
    })

    return bullet
  }

  /**
   * 미사일 투사체를 생성합니다.
   * 미사일 투사체는 지정된 타켓을 유도하여 추적하는 특징을 가진 투사체를 구현하기에 적합합니다.
   * 이 투사체를 발사하기 위해서는 `fire`, `fireToAngle`, `fireToTarget` 메서드를 사용하십시오.
   * 
   * 만일 파티클 기능을 사용하고 싶다면, 해당 인스턴스의 `particle` 속성을 사용하십시오.
   * 투사체가 충돌하였을 때 작동할 콜백함수는 `addCollideEvent` 메서드를 사용하십시오.
   * @example
   * ```
   * const rocket = this.bullet.addRocket({ x: 0, y: 0 }, 'rocket')
   * rocket.particle.add('flame', 'flame.png')
   * rocket.addCollideEvent((e, pair) => {
   *   if (pair !== me) {
   *     pair.destroy()
   *   }
   *   rocket.particle.explode('flame', 30)
   *   rocket.destroy()
   * })
   * ```
   * @param point 미사일이 생성될 좌표입니다.
   * @param texture 미사일에 사용할 텍스쳐입니다.
   * @param frame 미사일에 사용할 애니메이션 프레임입니다.
   * @param onCollide 로켓이 물리 객체와 충돌하였을 때 호출할 콜백함수를 지정합니다. `addCollideEvent` 메서드를 통해서도 등록할 수 있습니다.
   * @param onBeforeDestroy 로켓이 파괴되었을 때 호출할 콜백함수를 지정합니다. `addBeforeDestroyEvent` 메서드를 통해서도 등록할 수 있습니다.
   */
  addMissile(point: Point2, texture: string|Phaser.Textures.Texture, frame?: string|number, onCollide?: CollideHandler, onBeforeDestroy?: () => void): Missile {
    const { x, y } = point
    const bullet = new Missile(this.actor, x, y, texture, frame)

    this.bulletset.add(bullet)
    this.actor.scene.add.existing(bullet)

    if (onCollide) {
      bullet.addCollideEvent(onCollide)
    }

    if (onBeforeDestroy) {
      bullet.addBeforeDestroyEvent(onBeforeDestroy)
    }

    bullet.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.bulletset.delete(bullet)
    })

    return bullet
  }

  /**
   * 두 점 사이의 각도를 구합니다.
   * @param from 기준점의 위치입니다.
   * @param to 대상의 위치입니다.
   * @returns 기준점을 기준으로 대상을 향하는 각도를 반환합니다.
   */
  getAngleBetweenPoints(from: Point2, to: Point2): number {
    return Phaser.Math.RadToDeg(Math.atan2(to.y - from.y, to.x - from.x))
  }
}