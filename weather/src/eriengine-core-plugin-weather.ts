import { getSmaller } from '@common/Math/MathUtil'
import Phaser, { Cameras } from 'phaser'

import { GloomyPostFX } from './Pipelines/GloomyPostFX'
export { GloomyPostFX } from './Pipelines/GloomyPostFX'
import { DreamPostFX } from './Pipelines/DreamPostFX'
export { DreamPostFX } from './Pipelines/DreamPostFX'
import { GlowingPostFX } from './Pipelines/GlowingPostFX'
export { GlowingPostFX } from './Pipelines/GlowingPostFX'

type Constructor<T> = { new (...args: any): T }

enum Weather {
  clear = 'clear',
  rainy = 'rainy',
  cloud = 'cloud'
}

enum Shader {
  GloomyPostFX = 'GloomyPostFX',
  DreamPostFX = 'DreamPostFX',
  GlowingPostFX = 'GlowingPostFX'
}

class Plugin extends Phaser.Plugins.ScenePlugin {
  private weather: keyof typeof Weather = 'clear'

  boot(): void {
    this.addPostPipeline('GloomyPostFX', GloomyPostFX)
    this.addPostPipeline('DreamPostFX', DreamPostFX)
    this.addPostPipeline('GlowingPostFX', GlowingPostFX)
  }

  private addPostPipeline(key: keyof typeof Shader, shader: Constructor<Phaser.Renderer.WebGL.Pipelines.PostFXPipeline>): void {
    if (this.postPipelineClasses.has(key)) {
      return
    }
    this.postPipelineClasses.set(key, shader)
  }

  private get camera(): Phaser.Cameras.Scene2D.Camera {
    return this.scene.cameras.main
  }

  private get postPipelineClasses(): Map<string, Constructor<Phaser.Renderer.WebGL.Pipelines.PostFXPipeline>> {
    return (this.systems.renderer as any).pipelines.postPipelineClasses
  }

  changeWeather(weather: keyof typeof Weather): this {
    if (weather === this.weather) {
      return this
    }

    this.weather = weather
    this.camera.resetPostPipeline()

    switch (this.weather) {
      case 'clear': {
        break
      }
      case 'cloud': {
        this.camera.setPostPipeline(GloomyPostFX)
        break
      }
      case 'rainy': {
        this.camera.setPostPipeline(GloomyPostFX).setPostPipeline(DreamPostFX)
        break
      }
    }
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