import Phaser from 'phaser'

import { DefaultParticle, useRandomPositionEmitterConfig } from './DefaultParticle'

export class SparkParticle extends DefaultParticle {
  constructor(scene: Phaser.Scene, x: number, y: number, emitRadius: number = 0, texture: string, config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {}) {
    super(
      scene,
      x,
      y,
      texture,
      {
        blendMode: Phaser.BlendModes.ADD,
        speed: 200,
        lifespan: 400,
        quantity: 2,
        scale: { start: 1, end: 0 },
        ...useRandomPositionEmitterConfig(emitRadius),
        ...config
      }
    )
  }
}