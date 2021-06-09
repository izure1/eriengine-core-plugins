import { getSmaller } from '@common/Math/MathUtil'
import Phaser, { Cameras } from 'phaser'

import { BurningPostFX } from './Pipelines/BurningPostFX'
export { BurningPostFX } from './Pipelines/BurningPostFX'
import { DreamPostFX } from './Pipelines/DreamPostFX'
export { DreamPostFX } from './Pipelines/DreamPostFX'
import { FoggyPostFX } from './Pipelines/FoggyPostFX'
export { FoggyPostFX } from './Pipelines/FoggyPostFX'
import { FrozenPostFX } from './Pipelines/FrozenPostFX'
export { FrozenPostFX } from './Pipelines/FrozenPostFX'
import { GlassyPostFX } from './Pipelines/GlassyPostFX'
export { GlassyPostFX } from './Pipelines/GlassyPostFX'
import { GloomyPostFX } from './Pipelines/GloomyPostFX'
export { GloomyPostFX } from './Pipelines/GloomyPostFX'
import { InversionPostFX } from './Pipelines/InversionPostFX'
export { InversionPostFX } from './Pipelines/InversionPostFX'
import { NoisePostFX } from './Pipelines/NoisePostFX'
export { NoisePostFX } from './Pipelines/NoisePostFX'
import { RainyPostFX } from './Pipelines/RainyPostFX'
export { RainyPostFX } from './Pipelines/RainyPostFX'

type Constructor<T> = { new (...args: any): T }

enum PostPipeline {
  burning,
  dream,
  foggy,
  frozen,
  glassy,
  gloomy,
  inversion,
  noise,
  rainy
}

class Plugin extends Phaser.Plugins.ScenePlugin {
  protected currentEnvironments: Set<keyof typeof PostPipeline> = new Set

  boot(): void {
    this.addPostPipeline('burning', BurningPostFX)
    this.addPostPipeline('dream', DreamPostFX)
    this.addPostPipeline('foggy', FoggyPostFX)
    this.addPostPipeline('frozen', FrozenPostFX)
    this.addPostPipeline('glassy', GlassyPostFX)
    this.addPostPipeline('gloomy', GloomyPostFX)
    this.addPostPipeline('inversion', InversionPostFX)
    this.addPostPipeline('noise', NoisePostFX)
    this.addPostPipeline('rainy', RainyPostFX)
  }

  private addPostPipeline(key: keyof typeof PostPipeline, pipeline: Constructor<Phaser.Renderer.WebGL.Pipelines.PostFXPipeline>): void {
    if (this.postPipelineClasses.has(key)) {
      return
    }
    this.postPipelineClasses.set(key, pipeline)
  }

  private get camera(): Phaser.Cameras.Scene2D.Camera {
    return this.scene.cameras.main
  }

  private get postPipelineClasses(): Map<string, Constructor<Phaser.Renderer.WebGL.Pipelines.PostFXPipeline>> {
    return (this.systems.renderer as any).pipelines.postPipelineClasses
  }

  /**
   * 기존에 추가되었던 모든 화면 효과를 제거하고, 새롭게 추가합니다.
   * @param environments 추가할 화면 효과입니다.
   */
  setEnvironment(...environments: (keyof typeof PostPipeline)[]): this {
    this.resetEnvironment()
    for (const env of environments) {
      this.addEnvironment(env)
    }

    return this
  }

  /**
   * 화면에 새로운 효과를 추가합니다. 이는 기존에 등록했던 효과를 제거하지 않고, 새롭게 추가합니다. 이미 추가된 효과라면 무시합니다.
   * 추가된 순서에 따라 화면이 다르게 보일 수 있습니다.
   * 기존에 추가된 효과를 제거하고 싶다면, `resetEnvironment` 메서드를 사용하십시오.
   * @param environments 추가할 화면 효과입니다.
   */
  addEnvironment(...environments: (keyof typeof PostPipeline)[]): this {
    for (const environment of environments) {
      if (this.currentEnvironments.has(environment)) {
        continue
      }
  
      const Pipeline = this.postPipelineClasses.get(environment) ?? null
      if (!Pipeline) {
        continue
      }
  
      this.currentEnvironments.add(environment)
      this.camera.setPostPipeline(Pipeline)
    }

    return this
  }

  /**
   * 화면에 추가된 효과를 제거합니다.
   * @param environments 제거할 화면 효과입니다.
   */
  deleteEnvironment(...environments: (keyof typeof PostPipeline)[]): this {
    for (const environment of environments) {
      if (!this.currentEnvironments.has(environment)) {
        continue
      }
  
      const Pipeline = this.postPipelineClasses.get(environment) ?? null
      if (!Pipeline) {
        continue
      }
  
      this.currentEnvironments.delete(environment)
      // Fix phaser types bug
      this.camera.removePostPipeline(Pipeline as any)
    }

    return this
  }

  /**
   * 기존에 추가한 화면 효과를 전부 제거합니다.
   */
  resetEnvironment(): this {
    this.deleteEnvironment(...this.currentEnvironments.keys())
    return this
  }

  /**
   * 씬이 매 프레임 업데이트 될 때 마다 호출될 메서드입니다.
   * 씬이 일시중지되었거나,파괴되었다면 더 이상 호출되지 않습니다.  
   * *절대 직접 호출하지 마십시오.*
   * @param time 씬이 시작한 후 흐른 시간(ms)입니다.
   * @param delta 이전 프레임과 현재 프레임 사이에 흐른 시간(ms)입니다. 게임은 일반적으로 60프레임이므로, 1/60초인 0.016초입니다.
   */
  update(_time: number, _delta: number): void {
  }

  destroy(): void {}
}

export { Plugin }