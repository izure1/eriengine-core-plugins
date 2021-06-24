import Phaser from 'phaser'

import { DefaultParticle, useRandomPositionEmitterConfig, useRandomRotateEmitterConfig } from './DefaultParticle'

export class JetParticle extends DefaultParticle {
  constructor(scene: Phaser.Scene, x: number, y: number, emitRadius: number = 0, texture: string, config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {}) {
    super(
      scene,
      x,
      y,
      texture,
      [
        {
          speed: 200,
          lifespan: 400,
          alpha: { start: 1, end: 0 },
          scale: { start: 0.5, end: 1 },
          ...useRandomRotateEmitterConfig(180),
          ...useRandomPositionEmitterConfig(emitRadius),
          ...config
        }
      ]
    )
  }
}