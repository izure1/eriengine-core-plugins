import Phaser from 'phaser'

import { DefaultParticle, useRandomPositionEmitterConfig, useRandomRotateEmitterConfig, useYoyoScaleEmitterConfig } from './DefaultParticle'

export class ExplodeParticle extends DefaultParticle {
  constructor(scene: Phaser.Scene, x: number, y: number, emitRadius: number = 50, texture: string, config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {}) {
    super(
      scene,
      x,
      y,
      texture,
      {
        blendMode: Phaser.BlendModes.ADD,
        speed: 0,
        lifespan: 400,
        frequency: 50,
        angle: { min: 0, max: 180 },
        ...useYoyoScaleEmitterConfig(1),
        ...useRandomRotateEmitterConfig(45),
        ...useRandomPositionEmitterConfig(emitRadius),
        ...config
      }
    )
  }
}