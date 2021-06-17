import Phaser from 'phaser'
import { Bullet } from './Bullet'

export class Rocket extends Bullet {
  protected revisionAngle: number = 90
  protected forwardAngle: number = 0
  protected lerpForce: number = 0

  /**
   * 회전의 보정치를 설정합니다. 이는 렌더링을 위해 사용됩니다.
   * 투사체의 경우 해당 목표로 날아갈 때, 머리 부분이 타켓을 향하도록 그려져야 합니다.
   * 따라서 기본적으로 탄막은 현재 위치와, 목표의 위치 사이의 각도를 계산해 자동으로 탄막의 각도(angle)을 설정합니다.
   * 이 메서드는 탄막의 각도에 수정치를 더합니다. 따라서 최종적으로 탄막의 각도는 `탄막의 각도 + 수정치`만큼 회전합니다.
   * @param angle 탄막의 각도의 수정치입니다.
   */
  setRevisionAngle(angle: number): this {
    this.revisionAngle = angle
    return this
  }

  /**
   * 해당 각도를 향해 로켓을 발사합니다.
   * 발사에는 물리적인 힘이 필요하며, `force` 매개변수로 지정할 수 있습니다.
   * 힘의 단위는 일반적으로 `0 ~ 1` 사이의 실수이지만, 투사체의 크기와 마찰력, 그리고 중력에 따라 필요한 힘이 달라질 수 있습니다.
   * 
   * 로켓은 매 프레임마다 해당 각도를 향해 힘을 가하여 추진력을 더하여, 도중에 멈추는 일 없이 날아갑니다. 이 힘은 `lerpForce` 매개변수를 통해 지정할 수 있습니다.
   * 이로써 로켓은 목표를 향해 해당 각도로 계속 날아갈 것입니다.
   * @param angle 발사각입니다.
   * @param fireForce 발사 시 가할 힘의 크기이며, 일반적으로 `0 ~ 1` 사이의 실수입니다.
   * @param lerpForce 매 프레임 가해질 추진력의 크기이며, 일반적으로 `0 ~ 1` 사이의 실수입니다.
   */
  fireRocket(angle: number, fireForce: number, lerpForce: number): this {
    this.forwardAngle = angle

    this.changeLerpForce(lerpForce)
    this.fireBullet(angle, fireForce)

    return this
  }

  /**
   * 로켓에 매 프레임마다 가해질 힘의 크기를 수정합니다.
   * @param lerpForce 매 프레임 대상의 좌표를 향해 가해질 힘의 크기입니다. 일반적으로 `0 ~ 1` 사이의 실수입니다.
   */
  changeLerpForce(lerpForce: number): this {
    this.lerpForce = lerpForce
    return this
  }

  /**
   * 로켓이 전진하는 각도를 수정합니다.
   * @param angle 발사각입니다.
   */
  changeAngle(angle: number): this {
    this.forwardAngle = angle
    return this
  }

  /** 로켓이 목표를 향해 추진하는 메서드입니다. */
  private propel(): void {
    this.fireBullet(this.forwardAngle, this.lerpForce)
  }

  update(time: number, delta: number): void {
    super.update(time, delta)

    const x = this.velocity.x + this.x
    const y = this.velocity.y + this.y
    this.setAngle(this.getAngleBetween({ x, y }) + this.revisionAngle)
    this.propel()
  }
}