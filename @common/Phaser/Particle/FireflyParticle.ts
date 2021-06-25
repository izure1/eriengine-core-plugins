import Phaser from 'phaser'

import { DefaultParticle, useRandomPositionEmitterConfig } from './DefaultParticle'

export class FireflyParticle extends DefaultParticle {
  constructor(scene: Phaser.Scene, x: number, y: number, emitRadius: number = 200, texture: string, config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {}) {
    super(
      scene,
      x,
      y,
      texture,
      {
        blendMode: Phaser.BlendModes.ADD,
        lifespan: 5000,
        frequency: 300,
        speed: { min: 0, max: 50 },
        scale: { start: 0.1, end: 0 },
        ...useRandomPositionEmitterConfig(emitRadius),
        ...config
      }
    )
  }
}