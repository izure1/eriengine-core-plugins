import Phaser from 'phaser'

import { DefaultParticle, useRandomPositionEmitterConfig, useRandomRotateEmitterConfig } from './DefaultParticle'

export class SmokeParticle extends DefaultParticle {
  constructor(scene: Phaser.Scene, x: number, y: number, emitRadius: number = 50, texture: string, config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {}) {
    super(
      scene,
      x,
      y,
      texture,
      {
        blendMode: Phaser.BlendModes.MULTIPLY,
        gravityY: -100,
        gravityX: 10,
        lifespan: 3000,
        frequency: 200,
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