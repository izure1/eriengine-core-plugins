import { getSmaller } from '@common/Math/MathUtil'
import Phaser from 'phaser'

import { HitPostFX } from './Pipelines/HitPostFX'
import { SpeedPostFX } from './Pipelines/SpeedPostFX'
import { CriticalPostFX } from './Pipelines/CriticalPostFX'

type Constructor<T> = { new (...args: any): T }

enum PostPipeline {
  hit,
  speed,
  critical
}

class Plugin extends Phaser.Plugins.ScenePlugin {
  protected currentEnvironments: Set<keyof typeof PostPipeline> = new Set

  boot(): void {
    this.addPostPipeline('hit', HitPostFX)
    this.addPostPipeline('speed', SpeedPostFX)
    this.addPostPipeline('critical', CriticalPostFX)
  }

  private get camera(): Phaser.Cameras.Scene2D.Camera {
    return this.scene.cameras.main
  }

  private addPostPipeline(key: keyof typeof PostPipeline, pipeline: Constructor<Phaser.Renderer.WebGL.Pipelines.PostFXPipeline>): void {
    if (this.postPipelineClasses.has(key)) {
      return
    }
    this.postPipelineClasses.set(key, pipeline)
  }

  private get postPipelineClasses(): Map<keyof typeof PostPipeline, Constructor<Phaser.Renderer.WebGL.Pipelines.PostFXPipeline>> {
    return (this.systems.renderer as any).pipelines.postPipelineClasses
  }

  /**
   * 무언가에 피격당했을 때, 화면에 퍼지는 피격감 이펙트를 보여줍니다.
   * 화면 중심을 기준으로 주변에 비네트 효과가 번쩍합니다. 이는 플레이어가 공격받고 있다는 정보를 시각적으로 알리기에 적합합니다.
   * @param color 비네트 효과의 색상입니다. 기본값은 빨간색(`{ r: 255, g: 0, b: 0 }`) 입니다.
   * @param intensity 효과의 강렬함을 지정합니다. `0 ~ 1` 사이의 실수를 입력할 수 있습니다. 이 숫자가 클수록 더 강력하게 비칩니다. 기본값은 `1`입니다.
   * @param duration 효과가 시작되고 끝나기까지 걸리는 시간(ms)입니다. 기본값은 `0.15` 입니다.
   */
  hit(color: Phaser.Types.Display.ColorObject, intensity: number = 1, duration: number = 0.15): this {
    const Pipeline = this.postPipelineClasses.get('hit')
    if (!Pipeline) {
      return this
    }

    const pipeline = new Pipeline(this.game) as HitPostFX

    this.camera.setPostPipeline(pipeline)

    return this
  }

  /**
   * 화면에 속도감을 이펙트를 보여줍니다.
   * 화면 중심을 기준으로 주변에 모션 블러가 일어납니다. 이는 플레이어가 빠른 속도로 움직이고 있다는 정보를 시각적으로 알리기에 적합합니다.
   * @param intensity 효과의 강렬함을 지정합니다. `0 ~ 1` 사이의 실수를 입력할 수 있습니다. 이 숫자가 클수록 더 강력하게 비칩니다. 기본값은 `1`입니다.
   * @param duration 효과가 시작되고 끝나기까지 걸리는 시간(ms)입니다. 기본값은 `0.15`입니다.
   */
  speed(intensity: number, duration: number): this {
    const Pipeline = this.postPipelineClasses.get('speed')
    if (!Pipeline) {
      return this
    }

    this.camera
      .setPipelineData('feeling_speed', { intensity, duration })
      .setPostPipeline(Pipeline)

    return this
  }

  critical(intensity: number): this {
    const Pipeline = this.postPipelineClasses.get('speed')
    if (!Pipeline) {
      return this
    }

    this.camera
      .setPipelineData('feeling_speed', { intensity })
      .setPostPipeline(Pipeline)

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

  destroy(): void {
  }
}

export { Plugin }