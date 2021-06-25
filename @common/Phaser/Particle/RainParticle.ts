import Phaser from 'phaser'

import { DefaultParticle, useRandomPositionEmitterConfig, useRandomRotateEmitterConfig } from './DefaultParticle'

export class RainParticle extends DefaultParticle {
  constructor(scene: Phaser.Scene, x: number, y: number, emitRadius: number = 200, texture: string, config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {}) {
    super(
      scene,
      x,
      y,
      texture,
      {
        blendMode: Phaser.BlendModes.SCREEN,
        lifespan: 1000,
        gravityY: 3000,
        gravityX: 100,
        quantity: 3,
        alpha: { start: 0, end: 1 },
        scale: { start: 0.3, end: 0 },
        ...useRandomPositionEmitterConfig(emitRadius),
        ...config
      }
    )
  }
}