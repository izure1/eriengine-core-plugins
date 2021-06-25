import Phaser from 'phaser'

import { DefaultParticle, useRandomPositionEmitterConfig, useRandomRotateEmitterConfig, useYoyoScaleEmitterConfig } from './DefaultParticle'

export class GlitterParticle extends DefaultParticle {
  constructor(scene: Phaser.Scene, x: number, y: number, emitRadius: number = 200, texture: string, config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {}) {
    super(
      scene,
      x,
      y,
      texture,
      {
        blendMode: Phaser.BlendModes.ADD,
        speed: 0,
        lifespan: 1500,
        frequency: 500,
        ...useYoyoScaleEmitterConfig(0.2),
        ...useRandomRotateEmitterConfig(45),
        ...useRandomPositionEmitterConfig(emitRadius),
        ...config
      }
    )
  }
}