import Phaser from 'phaser'

import { DefaultParticle, useRandomPositionEmitterConfig, useRandomRotateEmitterConfig } from './DefaultParticle'

export class JetSmokeParticle extends DefaultParticle {
  constructor(scene: Phaser.Scene, x: number, y: number, emitRadius: number = 0, texture: string, config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {}) {
    super(
      scene,
      x,
      y,
      texture,
      {
        blendMode: Phaser.BlendModes.MULTIPLY,
        lifespan: 1500,
        frequency: 50,
        speed: 0,
        alpha: { start: 1, end: 0 },
        scale: { start: 0.3, end: 1 },
        ...useRandomRotateEmitterConfig(45),
        ...useRandomPositionEmitterConfig(emitRadius),
        ...config
      }
    )
  }
}