import Phaser from 'phaser'
import { Point2 } from '@common/Math/MathUtil'
import { SpatialAudio } from './SpatialAudio'

class Plugin extends Phaser.Plugins.ScenePlugin {
  private readonly spatialAudios: Set<SpatialAudio> = new Set

  boot(): void {
    if (this.game.config.audio.disableWebAudio) {
      throw 'To use this plugin, you must set the \'audio.disableWebAudio\' config to false.'
    }
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update.bind(this))
    this.scene.events.on(Phaser.Scenes.Events.DESTROY, this.destroy.bind(this))
  }

  /**
   * 3D 공간화 음향을 추가합니다.
   * @param key 재생할 사운드 에셋의 키입니다.
   * @param position 사운드가 발생할 씬의 좌표입니다. 이 좌표와 청취자의 좌표에 따라 사운드의 크기가 조절되며, `setListenerPosition` 메서드로 청취자의 위치를 지정할 수 있습니다.
   * @param config 사운드의 설정입니다.
   * @returns 추가된 3D 공간화 사운드 인스턴스입니다.
   */
  addSpatialAudio(key: string, position: Point2, config?: Phaser.Types.Sound.SoundConfig): SpatialAudio {
    const sound = new SpatialAudio(this.scene, key, position, config)

    sound.once(Phaser.Sound.Events.DESTROY, (): void => {
      this.spatialAudios.delete(sound)
    })

    this.spatialAudios.add(sound)
    return sound
  }

  /**
   * 씬이 매 프레임 업데이트 될 때 마다 호출될 메서드입니다.
   * 씬이 일시중지되었거나,파괴되었다면 더 이상 호출되지 않습니다.  
   * *절대 직접 호출하지 마십시오.*
   */
  update(): void {
    this.spatialAudios.forEach((audio) => audio.update())
  }

  destroy(): void {
    this.spatialAudios.forEach((audio) => audio.destroy())
    this.spatialAudios.clear()
  }
}

export { Plugin, SpatialAudio }