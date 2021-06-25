import Phaser from 'phaser'

import { DefaultParticle, useRandomPositionEmitterConfig, useYoyoScaleEmitterConfig } from './DefaultParticle'

export class BurnParticle extends DefaultParticle {
  constructor(scene: Phaser.Scene, x: number, y: number, emitRadius: number = 0, texture: string, config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {}) {
    super(
      scene,
      x,
      y,
      texture,
      [
        {
          blendMode: Phaser.BlendModes.ADD,
          speed: 0,
          lifespan: 2000,
          frequency: 30,
          gravityY: -100,
          alpha: { start: 1, end: 0 },
          ...useYoyoScaleEmitterConfig(1),
          ...useRandomPositionEmitterConfig(emitRadius),
          ...config
        }
      ]
    )
  }
}