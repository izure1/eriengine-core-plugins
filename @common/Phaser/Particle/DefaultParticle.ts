import Phaser from 'phaser'

export function useRandomPositionEmitterConfig(emitRadius: number): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig {
  return {
    emitZone: {
      type: 'random',
      source: {
        getRandomPoint: (point) => {
          const radius = Phaser.Math.Between(0, emitRadius)
          const angle = Phaser.Math.Between(0, 360)
          const rad = Phaser.Math.DegToRad(angle)
          const x = Math.cos(rad) * radius
          const y = Math.sin(rad) * radius
          point.x = x
          point.y = y
        }
      }
    }
  }
}

export function useRandomRotateEmitterConfig(angle: number): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig {
  return {
    rotate: {
      onEmit: (particle) => {
        (particle.data as any).rotateDirection = Math.random() > 0.5 ? 1 : -1
      },
      onUpdate: (particle, _key, t, _value) => {
        const direction = (particle.data as any).rotateDirection ?? 1
        const maxAngle = angle * direction
        return t * maxAngle
      }
    }
  }
}

export function useYoyoScaleEmitterConfig(maxScale: number): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig {
  return {
    scale: {
      onEmit: (_particle, _key, _value) => {
        return Math.random()
      },
      onUpdate: (_particle, _key, t, _value) => {
        const angle = t * 180
        const scale = Math.sin(Phaser.Math.DegToRad(angle))
        return scale * maxScale
      }
    }
  }
}

export function useDefaultEmitterConfig(): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig {
  return {
    blendMode: Phaser.BlendModes.ADD
  }
}

export abstract class DefaultParticle extends Phaser.GameObjects.Particles.ParticleEmitterManager {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, emitterConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig|Phaser.Types.GameObjects.Particles.ParticleEmitterConfig[]) {
    super(scene, texture)

    if (!Array.isArray(emitterConfig)) {
      emitterConfig = [emitterConfig]
    }
    for (const config of emitterConfig) {
      const emitter = this.createEmitter({
        ...useDefaultEmitterConfig(),
        ...config
      })
      emitter.setPosition(x, y).start()
    }
      
    this.scene.add.existing(this)
  }
}