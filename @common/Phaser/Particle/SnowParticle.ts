import Phaser from 'phaser'

import { DefaultParticle, useRandomPositionEmitterConfig, useRandomRotateEmitterConfig } from './DefaultParticle'

export class SnowParticle extends DefaultParticle {
  constructor(scene: Phaser.Scene, x: number, y: number, emitRadius: number = 200, texture: string, config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {}) {
    super(
      scene,
      x,
      y,
      texture,
      {
        blendMode: Phaser.BlendModes.SCREEN,
        lifespan: 10000,
        gravityY: 10,
        frequency: 300,
        quantity: 2,
        speed: { min: 0, max: 20 },
        alpha: { start: 0, end: 1 },
        scale: { start: 0.3, end: 0 },
        ...useRandomRotateEmitterConfig(180),
        ...useRandomPositionEmitterConfig(emitRadius),
        ...config
      }
    )
  }
}