import { getSmaller } from '@common/Math/MathUtil'
import Phaser from 'phaser'

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
import { FlashPostFX } from './Pipelines/FlashPostFX'
export { FlashPostFX } from './Pipelines/FlashPostFX'

type Constructor<T> = { new (...args: any): T }

enum FeelingPipeline {
  burning,
  dream,
  foggy,
  frozen,
  glassy,
  gloomy,
  inversion,
  noise
}

enum ActionPipeline {
  flash
}

class Plugin extends Phaser.Plugins.ScenePlugin {
  protected currentFeelings: Set<keyof typeof FeelingPipeline> = new Set

  boot(): void {
    this.addPostPipeline<typeof FeelingPipeline>(this.feelingPipelineClasses, 'burning', BurningPostFX)
    this.addPostPipeline<typeof FeelingPipeline>(this.feelingPipelineClasses, 'dream', DreamPostFX)
    this.addPostPipeline<typeof FeelingPipeline>(this.feelingPipelineClasses, 'foggy', FoggyPostFX)
    this.addPostPipeline<typeof FeelingPipeline>(this.feelingPipelineClasses, 'frozen', FrozenPostFX)
    this.addPostPipeline<typeof FeelingPipeline>(this.feelingPipelineClasses, 'glassy', GlassyPostFX)
    this.addPostPipeline<typeof FeelingPipeline>(this.feelingPipelineClasses, 'gloomy', GloomyPostFX)
    this.addPostPipeline<typeof FeelingPipeline>(this.feelingPipelineClasses, 'inversion', InversionPostFX)
    this.addPostPipeline<typeof FeelingPipeline>(this.feelingPipelineClasses, 'noise', NoisePostFX)

    this.addPostPipeline<typeof ActionPipeline>(this.actionPipelineClasses, 'flash', FlashPostFX)

    this.scene.events.once(Phaser.Scenes.Events.READY, () => {
      this.camera.setPostPipeline(FlashPostFX)
    })
  }

  private addPostPipeline<T>(
    map: Map<keyof T, Constructor<Phaser.Renderer.WebGL.Pipelines.PostFXPipeline>>,
    key: keyof T,
    pipeline: Constructor<Phaser.Renderer.WebGL.Pipelines.PostFXPipeline>
  ): void {
    if (map.has(key)) {
      return
    }
    map.set(key, pipeline)
  }

  private get camera(): Phaser.Cameras.Scene2D.Camera {
    return this.scene.cameras.main
  }

  private get feelingPipelineClasses(): Map<keyof typeof FeelingPipeline, Constructor<Phaser.Renderer.WebGL.Pipelines.PostFXPipeline>> {
    return (this.systems.renderer as any).pipelines.postPipelineClasses
  }

  private get actionPipelineClasses(): Map<keyof typeof ActionPipeline, Constructor<Phaser.Renderer.WebGL.Pipelines.PostFXPipeline>> {
    return (this.systems.renderer as any).pipelines.postPipelineClasses
  }

  /**
   * 기존에 추가되었던 모든 화면 효과를 제거하고, 새롭게 추가합니다.
   * @param feelings 추가할 화면 효과입니다.
   */
  setFeeling(...feelings: (keyof typeof FeelingPipeline)[]): this {
    this.resetFeeling()
    for (const feeling of feelings) {
      this.addFeeling(feeling)
    }

    return this
  }

  /**
   * 화면에 새로운 효과를 추가합니다. 이는 기존에 등록했던 효과를 제거하지 않고, 새롭게 추가합니다. 이미 추가된 효과라면 무시합니다.
   * 추가된 순서에 따라 화면이 다르게 보일 수 있습니다.
   * 기존에 추가된 효과를 제거하고 싶다면, `resetEnvironment` 메서드를 사용하십시오.
   * @param feelings 추가할 화면 효과입니다.
   */
  addFeeling(...feelings: (keyof typeof FeelingPipeline)[]): this {
    for (const feeling of feelings) {
      if (this.currentFeelings.has(feeling)) {
        continue
      }
  
      const Pipeline = this.feelingPipelineClasses.get(feeling) ?? null
      if (!Pipeline) {
        continue
      }
  
      this.currentFeelings.add(feeling)
      this.camera.setPostPipeline(Pipeline)
    }

    return this
  }

  /**
   * 화면에 추가된 효과를 제거합니다.
   * @param feelings 제거할 화면 효과입니다.
   */
  deleteFeeling(...feelings: (keyof typeof FeelingPipeline)[]): this {
    for (const feeling of feelings) {
      if (!this.currentFeelings.has(feeling)) {
        continue
      }
  
      const Pipeline = this.feelingPipelineClasses.get(feeling) ?? null
      if (!Pipeline) {
        continue
      }
  
      this.currentFeelings.delete(feeling)
      // Fix phaser types bug
      this.camera.removePostPipeline(Pipeline as any)
    }

    return this
  }

  /**
   * 기존에 추가한 화면 효과를 전부 제거합니다.
   */
  resetFeeling(): this {
    this.deleteFeeling(...this.currentFeelings.keys())
    return this
  }

  /**
   * 화면에 퍼지는 붉은 피격 효과를 보여줍니다.
   * 화면 중심을 기준으로 주변에 비네트 효과가 번쩍합니다. 이는 플레이어가 공격받고 있다는 정보를 시각적으로 알리기에 적합합니다.
   * @param intensity 효과의 강렬함을 지정합니다. 이 숫자가 클수록 더 강력하게 비칩니다. 기본값은 `1`입니다.
   * @param duration 효과가 시작되고 끝나기까지 걸리는 시간(ms)입니다. 기본값은 `1000` 입니다.
   * @param cameraShakeDuration 카메라 흔들림 지속시간을 지정합니다. 이 값을 `0`으로 지정하면 카메라가 흔들리지 않습니다. 기본값은 `duration / 10`입니다.
   * @param cameraShakeIntensity 카메라 흔들림의 강도를 지정합니다. 이 값을 `0`으로 지정하면 카메라가 흔들리지 않습니다. 기본값은 `intensity / 20`입니다.
   */
  wound(intensity: number = 1, duration: number = 1000, cameraShakeDuration: number = duration / 10, cameraShakeIntensity: number = intensity / 20): this {
    const Pipeline = this.actionPipelineClasses.get('flash')
    if (!Pipeline) {
      return this
    }

    let pipelines = this.camera.getPostPipeline(Pipeline) as FlashPostFX|FlashPostFX[]
    if (!pipelines) {
      return this
    }
    if (!Array.isArray(pipelines)) {
      pipelines = [pipelines]
    }

    for (const pipeline of pipelines) {
      pipeline.start(new Phaser.Display.Color(255, 0, 0), 0.7, intensity, duration)
    }

    this.camera.shake(cameraShakeDuration, cameraShakeIntensity)

    return this
  }

  /**
   * 하얗게 번쩍이는 효과를 보여줍니다.
   * 이는 공격을 하였을 때, 타격감을 표현하기에 적합합니다.
   * @param intensity 효과의 강렬함을 지정합니다. 이 숫자가 클수록 더 강력하게 비칩니다. 기본값은 `2`입니다.
   * @param duration 효과가 시작되고 끝나기까지 걸리는 시간(ms)입니다. 기본값은 `400` 입니다.
   * @param cameraShakeDuration 카메라 흔들림 지속시간을 지정합니다. 이 값을 `0`으로 지정하면 카메라가 흔들리지 않습니다. 기본값은 `duration / 10`입니다.
   * @param cameraShakeIntensity 카메라 흔들림의 강도를 지정합니다. 이 값을 `0`으로 지정하면 카메라가 흔들리지 않습니다. 기본값은 `intensity / 20`입니다.
   */
  critical(intensity: number = 2, duration: number = 400, cameraShakeDuration: number = duration / 10, cameraShakeIntensity: number = intensity / 20): this {
    const Pipeline = this.actionPipelineClasses.get('flash')
    if (!Pipeline) {
      return this
    }

    let pipelines = this.camera.getPostPipeline(Pipeline) as FlashPostFX|FlashPostFX[]
    if (!pipelines) {
      return this
    }
    if (!Array.isArray(pipelines)) {
      pipelines = [pipelines]
    }

    for (const pipeline of pipelines) {
      pipeline.start(new Phaser.Display.Color(255, 255, 255), 1, intensity, duration)
    }

    this.camera.shake(cameraShakeDuration, cameraShakeIntensity)

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