import Phaser from 'phaser'
import { base64Load } from '@common/Phaser/AssetLoader'
import { DefaultParticle } from '@common/Phaser/Particle/DefaultParticle'
import { FireflyParticle } from '@common/Phaser/Particle/FireflyParticle'
import { GlitterParticle } from '@common/Phaser/Particle/GlitterParticle'
import { SmokeParticle } from '@common/Phaser/Particle/SmokeParticle'
import { ExplodeParticle } from '@common/Phaser/Particle/ExplodeParticle'
import { JetParticle } from '@common/Phaser/Particle/JetParticle'
import { SparkParticle } from '@common/Phaser/Particle/SparkParticle'
import { BurnParticle } from '@common/Phaser/Particle/BurnParticle'
import { SnowParticle } from '@common/Phaser/Particle/SnowParticle'
import { RainParticle } from '@common/Phaser/Particle/RainParticle'

import particleGreen from '@assets/particle-green.png'
import particleWhite from '@assets/particle-white.png'
import particleFlash from '@assets/particle-flash.png'
import particleGlitter from '@assets/particle-glitter.png'
import particleSmoke from '@assets/particle-smoke.png'
import particleSnow from '@assets/particle-snow.png'
import particleRaindrop from '@assets/particle-raindrop.png'

export enum ParticleAsset {
  'particle-green' = '__ERIENGINE_CORE_PLUGIN_PARTICLE_KEY_GREEN__',
  'particle-white' = '__ERIENGINE_CORE_PLUGIN_PARTICLE_KEY_WHITE__',
  'particle-flash' = '__ERIENGINE_CORE_PLUGIN_PARTICLE_KEY_FLASH__',
  'particle-glitter' = '__ERIENGINE_CORE_PLUGIN_PARTICLE_KEY_GLITTER__',
  'particle-smoke' = '__ERIENGINE_CORE_PLUGIN_PARTICLE_KEY_SMOKE__',
  'particle-snow' = '__ERIENGINE_CORE_PLUGIN_PARTICLE_KEY_SNOW__',
  'particle-raindrop' = '__ERIENGINE_CORE_PLUGIN_PARTICLE_KEY_RAINDROP__'
}

declare class ParticleChildren extends DefaultParticle {}

class Plugin extends Phaser.Plugins.ScenePlugin {
  private particleset: Set<ParticleChildren> = new Set

  boot(): void {    
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update.bind(this))
    this.scene.events.on(Phaser.Scenes.Events.DESTROY, this.destroy.bind(this))

    Plugin.generateTexture(this.scene)
  }

  private static generateTexture(scene: Phaser.Scene): void {
    base64Load(scene, ParticleAsset['particle-green'], particleGreen)
    base64Load(scene, ParticleAsset['particle-white'], particleWhite)
    base64Load(scene, ParticleAsset['particle-flash'], particleFlash)
    base64Load(scene, ParticleAsset['particle-glitter'], particleGlitter)
    base64Load(scene, ParticleAsset['particle-smoke'], particleSmoke)
    base64Load(scene, ParticleAsset['particle-snow'], particleSnow)
    base64Load(scene, ParticleAsset['particle-raindrop'], particleRaindrop)
  }
  
  private update(time: number, delta: number): void {
  }

  destroy(): void {
    for (const particle of this.particleset) {
      particle.destroy()
    }
  }

  /**
   * 반딧불이 날아다니는 효과를 내는 파티클 지역을 생성합니다.
   * `emitRadius` 매개변수를 이용하여 반딧불이 생성되는 지역의 범위를 설정할 수 있습니다.
   * @param x 파티클이 생성될 x좌표입니다.
   * @param y 파티클이 생성될 y좌표입니다.
   * @param emitRadius 파티클이 생성되는 영역의 범위입니다. 파티클은 이 범위 내에서 랜덤하게 생성될 것입니다.
   */
  addFirefly(x: number, y: number, emitRadius?: number): FireflyParticle {
    const particle = new FireflyParticle(this.scene, x, y, emitRadius, ParticleAsset['particle-flash'])
    this.particleset.add(particle)

    return particle
  }
  
  /**
   * 반짝임 효과를 내는 파티클 지역을 생성합니다.
   * 이는 특정 지역에 아이템이 있다는 효과를 줄 때 유용합니다.
   * `emitRadius` 매개변수를 이용하여 파티클이 생성되는 지역의 범위를 설정할 수 있습니다.
   * @param x 파티클이 생성될 x좌표입니다.
   * @param y 파티클이 생성될 y좌표입니다.
   * @param emitRadius 파티클이 생성되는 영역의 범위입니다. 파티클은 이 범위 내에서 랜덤하게 생성될 것입니다.
   */
  addGlitter(x: number, y: number, emitRadius?: number): GlitterParticle {
    const particle = new GlitterParticle(this.scene, x, y, emitRadius, ParticleAsset['particle-glitter'])
    this.particleset.add(particle)

    return particle
  }
  
  /**
   * 연기 효과를 내는 파티클 지역을 생성합니다.
   * `emitRadius` 매개변수를 이용하여 파티클이 생성되는 지역의 범위를 설정할 수 있습니다.
   * @param x 파티클이 생성될 x좌표입니다.
   * @param y 파티클이 생성될 y좌표입니다.
   * @param emitRadius 파티클이 생성되는 영역의 범위입니다. 파티클은 이 범위 내에서 랜덤하게 생성될 것입니다.
   */
  addSmoke(x: number, y: number, emitRadius?: number): SmokeParticle {
    const particle = new SmokeParticle(this.scene, x, y, emitRadius, ParticleAsset['particle-smoke'])
    this.particleset.add(particle)
  
    return particle
  }

  /**
   * 폭발 효과를 내는 파티클 지역을 생성합니다.
   * 이는 건물이나, 기계가 터지는 효과를 줄 때 유용합니다.
   * `emitRadius` 매개변수를 이용하여 파티클이 생성되는 지역의 범위를 설정할 수 있습니다.
   * @param x 파티클이 생성될 x좌표입니다.
   * @param y 파티클이 생성될 y좌표입니다.
   * @param emitRadius 파티클이 생성되는 영역의 범위입니다. 파티클은 이 범위 내에서 랜덤하게 생성될 것입니다.
   */
  addExplode(x: number, y: number, emitRadius?: number): ExplodeParticle {
    const particle = new ExplodeParticle(this.scene, x, y, emitRadius, ParticleAsset['particle-flash'])
    this.particleset.add(particle)
  
    return particle
  }

  /**
   * 로켓과 같은 추진체의 분사 효과를 내는 파티클 지역을 생성합니다.
   * `emitRadius` 매개변수를 이용하여 파티클이 생성되는 지역의 범위를 설정할 수 있습니다.
   * @param x 파티클이 생성될 x좌표입니다.
   * @param y 파티클이 생성될 y좌표입니다.
   * @param emitRadius 파티클이 생성되는 영역의 범위입니다. 파티클은 이 범위 내에서 랜덤하게 생성될 것입니다.
   */
  addJet(x: number, y: number, emitRadius?: number): JetParticle {
    const particle = new JetParticle(this.scene, x, y, emitRadius, ParticleAsset['particle-flash'])
    this.particleset.add(particle)
  
    return particle
  }

  /**
   * 불똥이 튀는 효과를 내는 파티클 지역을 생성합니다.
   * `emitRadius` 매개변수를 이용하여 파티클이 생성되는 지역의 범위를 설정할 수 있습니다.
   * @param x 파티클이 생성될 x좌표입니다.
   * @param y 파티클이 생성될 y좌표입니다.
   * @param emitRadius 파티클이 생성되는 영역의 범위입니다. 파티클은 이 범위 내에서 랜덤하게 생성될 것입니다.
   */
   addSpark(x: number, y: number, emitRadius?: number): SparkParticle {
    const particle = new SparkParticle(this.scene, x, y, emitRadius, ParticleAsset['particle-smoke'])
    this.particleset.add(particle)
  
    return particle
  }
  
  /**
   * 타오르는 불길의 효과를 내는 파티클 지역을 생성합니다.
   * `emitRadius` 매개변수를 이용하여 파티클이 생성되는 지역의 범위를 설정할 수 있습니다.
   * @param x 파티클이 생성될 x좌표입니다.
   * @param y 파티클이 생성될 y좌표입니다.
   * @param emitRadius 파티클이 생성되는 영역의 범위입니다. 파티클은 이 범위 내에서 랜덤하게 생성될 것입니다.
   */
  addBurn(x: number, y: number, emitRadius?: number): BurnParticle {
    const particle = new BurnParticle(this.scene, x, y, emitRadius, ParticleAsset['particle-flash'])
    this.particleset.add(particle)
  
    return particle
  }

  /**
   * 눈이 내리는 효과를 내는 파티클 지역을 생성합니다.
   * `emitRadius` 매개변수를 이용하여 파티클이 생성되는 지역의 범위를 설정할 수 있습니다.
   * @param x 파티클이 생성될 x좌표입니다.
   * @param y 파티클이 생성될 y좌표입니다.
   * @param emitRadius 파티클이 생성되는 영역의 범위입니다. 파티클은 이 범위 내에서 랜덤하게 생성될 것입니다.
   */
  addSnow(x: number, y: number, emitRadius?: number): SnowParticle {
    const particle = new SnowParticle(this.scene, x, y, emitRadius, ParticleAsset['particle-snow'])
    this.particleset.add(particle)
  
    return particle
  }

  /**
   * 비가 내리는 효과를 내는 파티클 지역을 생성합니다.
   * `emitRadius` 매개변수를 이용하여 파티클이 생성되는 지역의 범위를 설정할 수 있습니다.
   * @param x 파티클이 생성될 x좌표입니다.
   * @param y 파티클이 생성될 y좌표입니다.
   * @param emitRadius 파티클이 생성되는 영역의 범위입니다. 파티클은 이 범위 내에서 랜덤하게 생성될 것입니다.
   */
  addRain(x: number, y: number, emitRadius?: number): RainParticle {
    const particle = new RainParticle(this.scene, x, y, emitRadius, ParticleAsset['particle-raindrop'])
    this.particleset.add(particle)
  
    return particle
  }
}

export { Plugin }