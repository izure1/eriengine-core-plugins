import Phaser from 'phaser'
import { Point2 } from '@common/Math/MathUtil'

export class SpatialAudio extends Phaser.Sound.WebAudioSound {
  /**
   *  현재 청취자가 카메라를 기준으로 작동하는지 여부를 반환합니다. `attachListenerOnCamera` 메서드를 이용하여 변경할 수 있습니다.
   *  이 값이 `true`로 되어있다면, `setListenerPosition` 메서드와 관련없이 항상 씬의 메인카메라를 기준으로 사운드를 듣습니다.
   */
  isListenerOnCamera: boolean = true
  /** 사운드가 발생하는 씬의 x좌표입니다. 청취자의 위치와 `this.thresholdRadius` 값을 계산하여 사운드의 크기가 조정됩니다. */
  x!: number
  /** 사운드가 발생하는 씬의 y좌표입니다. 청취자의 위치와 `this.thresholdRadius` 값을 계산하여 사운드의 크기가 조정됩니다. */
  y!: number
  private readonly scene!: Phaser.Scene
  private readonly spatialPannerNode!: PannerNode
  private readonly spatialListener!: AudioListener
  private _thresholdRadius: number = 1000
  /** 사운드를 듣는 청취자의 씬의 좌표입니다. */
  protected readonly listener: Point2 = { x: 0, y: 0 }

  constructor(scene: Phaser.Scene, key: string, position: Point2, config?: Phaser.Types.Sound.SoundConfig) {
    super(scene.sound as Phaser.Sound.WebAudioSoundManager, key, config)

    this.scene = scene
    this.setPosition(position)

    this.spatialPannerNode = this.context.createPanner()
    this.spatialListener = this.pannerNode.context.listener
    
    this.spatialPannerNode.panningModel = 'HRTF'
    this.spatialPannerNode.distanceModel = 'linear'
    this.spatialPannerNode.maxDistance = this.normalizeDistance(this.thresholdRadius)
    this.spatialPannerNode.refDistance = 1
    this.spatialPannerNode.rolloffFactor = 1
    this.spatialPannerNode.coneInnerAngle = 360
    this.spatialPannerNode.coneOuterAngle = 0
    this.spatialPannerNode.coneOuterGain = 0

    this.spatialPannerNode.orientationX.value = 0
    this.spatialPannerNode.orientationY.value = 0
    this.spatialPannerNode.orientationZ.value = 1

    this.spatialListener.forwardX.value = 0
    this.spatialListener.forwardY.value = 0
    this.spatialListener.forwardZ.value = -1
    this.spatialListener.upX.value = 0
    this.spatialListener.upY.value = 1
    this.spatialListener.upZ.value = 0
    
    this.pannerNode.disconnect()
    this.pannerNode.connect(this.spatialPannerNode)
    this.spatialPannerNode.connect(this.manager.destination)
  }

  private get context(): BaseAudioContext {
    return this.pannerNode.context || this.volumeNode.context
  }

  private get manager(): Phaser.Sound.WebAudioSoundManager {
    return this.scene.sound as Phaser.Sound.WebAudioSoundManager
  }

  protected updateSpatial(): void {
    let listenerX: number = this.listener.x
    let listenerY: number = this.listener.y

    if (this.isListenerOnCamera) {
      const { worldView } = this.scene.cameras.main
      const { centerX, centerY } = worldView
      listenerX = centerX
      listenerY = centerY
    }
    this.spatialListener.positionX.value = listenerX
    this.spatialListener.positionY.value = listenerY
    this.spatialPannerNode.positionX.value = this.x
    this.spatialPannerNode.positionY.value = this.y
  }
  
  private normalizeDistance(distance: number): number {
    return Phaser.Math.Distance.Between(0, 0, distance, distance)
  }
  
  /**
   * 사운드의 한계 범위를 지정합니다. 사운드의 발생지와 청취자의 좌표 사이 거리에 따라 볼륨이 조정됩니다.
   * 그 거리가 이 값보다 크다면 더 이상 사운드가 들리지 않습니다.
   * @param distance 사운드가 들릴 한계 범위입니다.
   */
  setThresholdRadius(distance: number): this {
    this.thresholdRadius = distance
    return this
  }

  /** 사운드의 한계 범위입니다. 사운드의 좌표와 청취자의 좌표 사이의 거리에 따라 사운드의 크기가 조정됩니다. */
  set thresholdRadius(distance: number) {
    this.spatialListener.positionZ.value = distance
    this.spatialPannerNode.maxDistance = this.normalizeDistance(distance)
  }
  
  /** 사운드의 한계 범위입니다. 사운드의 좌표와 청취자의 좌표 사이의 거리에 따라 사운드의 크기가 조정됩니다. */
  get thresholdRadius(): number {
    return this._thresholdRadius
  }

  /**
   * 사운드의 볼륨을 페이드합니다.
   * @param volume 사운드의 볼륨입니다. 0 ~ 1의 숫자를 가질 수 있습니다. 0은 음소거, 1은 최대 볼륨입니다.
   * @param duration 페이드될 시간(ms)입니다. 이 시간동안 천천히 볼륨이 조정됩니다.
   * @returns 페이드 효과를 위한 트윈 인스턴스입니다. 인스턴스를 이용하여 페이드를 멈출 수 있습니다.
   */
  fade(volume: number, duration: number): Phaser.Tweens.Tween {
    return this.scene.tweens.add({
      targets: this,
      volume,
      duration,
      onUpdate: (tween): void => {
        this.setVolume(tween.getValue())
      },
      onComplete: (tween): void => {
        this.setVolume(volume)
      }
    })
  }

  /**
   * 사운드의 볼륨을 페이드인합니다.
   * @param duration 페이드될 시간(ms)입니다. 이 시간동안 천천히 볼륨이 조정됩니다.
   * @returns 페이드 효과를 위한 트윈 인스턴스입니다. 인스턴스를 이용하여 페이드를 멈출 수 있습니다.
   */
  fadeIn(duration: number): Phaser.Tweens.Tween {
    return this.fade(1, duration)
  }

  /**
   * 사운드의 볼륨을 페이드아웃합니다.
   * @param duration 페이드될 시간(ms)입니다. 이 시간동안 천천히 볼륨이 조정됩니다.
   * @returns 페이드 효과를 위한 트윈 인스턴스입니다. 인스턴스를 이용하여 페이드를 멈출 수 있습니다.
   */
  fadeOut(duration: number): Phaser.Tweens.Tween {
    return this.fade(0, duration)
  }

  /**
   * 사운드의 발생지 위치를 지정합니다. 청취자는 발생지의 좌표에 따라 사운드를 적절하게 들을 수 있습니다.
   * @param position 사운드가 재생될 씬의 좌표입니다.
   */
  setPosition(position: Point2): this {
    const { x, y } = position
    this.x = x
    this.y = y
    return this
  }

  /**
   * 사운드를 들을 청취자의 위치를 지정합니다. 만일 카메라를 기준으로 사운드를 듣고 싶다면, `attachListenerOnCamera` 메서드를 이용하여 쉽게 구현할 수 있습니다.
   * @param position 청취자의 씬의 좌표입니다.
   */
  setListenerPosition(position: Point2): this {
    const { x, y } = position
    this.listener.x = x
    this.listener.y = y
    return this
  }

  /**
   * 청취자를 카메라에 부착시킬지 여부를 지정합니다. 이 값이 `true`라면 씬의 메인카메라를 기준으로 사운드를 듣습니다.
   * 이는 현재 플레이어가 보고 있는 화면을 기준으로 사운드를 듣고 싶을 때 유용합니다.
   * @param activity 청취자를 카메라에 부착시킬지 여부를 지정합니다.
   */
  attachListenerOnCamera(activity: boolean): this {
    this.isListenerOnCamera = activity
    return this
  }

  /**
   * 씬이 매 프레임 업데이트 될 때 마다 호출될 메서드입니다.
   * 씬이 일시중지되었거나,파괴되었다면 더 이상 호출되지 않습니다.  
   * *절대 직접 호출하지 마십시오.*
   */
  update(): void {
    this.updateSpatial()
  }
}