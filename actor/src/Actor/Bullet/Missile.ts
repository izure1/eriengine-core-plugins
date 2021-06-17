import Phaser from 'phaser'
import { Point2 } from '@common/Math/MathUtil'
import { Rocket } from './Rocket'

type GameObject = Phaser.GameObjects.GameObject&Phaser.GameObjects.Components.Transform

export class Missile extends Rocket {
  protected target: GameObject|Point2|null = null
  protected isChasing: boolean = false
  private isGameObject: boolean = false

  /**
   * 해당 목표를 향해 미사일을 발사합니다.
   * 발사에는 물리적인 힘이 필요하며, `force` 매개변수로 지정할 수 있습니다.
   * 힘의 단위는 일반적으로 `0 ~ 1` 사이의 실수이지만, 투사체의 크기와 마찰력, 그리고 중력에 따라 필요한 힘이 달라질 수 있습니다.
   * 
   * 미사일은 목표를 향해 매 프레임 힘을 가하여 도중에 멈추는 일 없이 날아갑니다. 이 힘은 `lerpForce` 매개변수를 통해 지정할 수 있습니다.
   * 이로써 미사일은 목표를 추적하며 해당 목표를 계속 추적하여 날아갈 것입니다.
   * @param angle 발사각입니다.
   * @param fireForce 발사 시 가할 힘의 크기이며, 일반적으로 `0 ~ 1` 사이의 실수입니다.
   * @param lerpForce 매 프레임 가해질 추진력의 크기이며, 일반적으로 `0 ~ 1` 사이의 실수입니다.
   * @param target 명중시킬 목표입니다.
   */
  fireMissile(angle: number, fireForce: number, lerpForce: number, target: Point2): this {
    this.changeTarget(target)
    return this.fireRocket(angle, fireForce, lerpForce)
  }

  /**
   * 미사일이 추적할 목표를 수정합니다.
   * @param target 새로운 목표물입니다.
   */
  changeTarget(target: GameObject|Point2|null): this {
    this.target = target
    this.isChasing = true
    this.isGameObject = target instanceof Phaser.GameObjects.GameObject
    return this
  }

  update(time: number, delta: number): void {
    super.update(time, delta)

    if (!this.isChasing) {
      return
    }

    if (
      (this.isGameObject && !(this.target as GameObject).active) || // 게임 오브젝트이지만 비활성화 되어 있거나
      !this.target || // 타켓이 없거나
      isNaN(this.target.x) || // 좌표가 잘못되었을 경우
      isNaN(this.target.y)
    ) {
      if (this.isChasing) {
        this.destroy()
      }
      return
    }

    this.changeAngle(this.getAngleBetween(this.target))
  }
}