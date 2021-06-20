import Phaser from 'phaser'
import { GridObject, getIsometricSide } from '@common/Math/MathUtil'

export class IsometricFloor extends Phaser.GameObjects.Sprite implements GridObject {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: Phaser.Textures.Texture|string, frame?: string|number) {
    super(scene, x, y, texture, frame)

    this.init()
  }

  get side(): number {
    const xHalf = this.displayWidth / 2
    return getIsometricSide(xHalf)
  }

  init(): void {
    this.setOrigin(0.5, (this.displayHeight - this.displayWidth / 4) / this.displayHeight)
    this.setDepth(Phaser.Math.MIN_SAFE_INTEGER)
  }
}