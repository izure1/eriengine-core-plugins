import Phaser from 'phaser'
import { TypedEmitter } from 'tiny-typed-emitter'
import { Actor } from './Actor'
import { BubbleEmotion } from '../eriengine-core-plugin-actor'
import { Point2, getIsometricWidth, getIsometricHeight } from '@common/Math/MathUtil'
import { TypingText } from '@common/Phaser/TypingText'

enum BubbleEmitterOffset {
  'top',
  'left',
  'right',
  'bottom',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
}

interface ActorBubbleEmitterEvent {
  'show-text':        (text: Phaser.GameObjects.Text|null) => void
  'clear-text':       (text: Phaser.GameObjects.Text|null) => void
  'show-emotion':     (image: Phaser.GameObjects.Image|null) => void
  'clear-emotion':    (image: Phaser.GameObjects.Image|null) => void
  'say-typing-start': (text: Phaser.GameObjects.Text|null) => void
  'say-typing':       (text: Phaser.GameObjects.Text|null) => void
  'say-typing-done':  (text: Phaser.GameObjects.Text|null) => void
  'say-finish':       (text: Phaser.GameObjects.Text|null) => void
}

class ActorBubbleEmitter extends TypedEmitter<ActorBubbleEmitterEvent> {
  private readonly actor: Actor
  private readonly offset: Point2 = { x: 0, y: 0 }
  private baseStyle: Phaser.Types.GameObjects.Text.TextStyle = { fontSize: '15px', color: 'white', strokeThickness: 3, stroke: 'black' }
  private appendStyle: Phaser.Types.GameObjects.Text.TextStyle = {}
  private image: Phaser.GameObjects.Image|null = null
  private text: TypingText|null = null
  private imageTween: Phaser.Tweens.Tween|null = null
  private textTimeEvent: Phaser.Time.TimerEvent|null = null
  private isNotice: boolean = false
  private noticeText: string|string[] = ''

  constructor(actor: Actor) {
    super()

    this.actor = actor

    this.generateObjects()
  }

  /** 해당 액터 인스턴스가 속한 씬을 반환합니다. 씬에 추가되어있지 않다면 `null`을 반환합니다. */
  private get scene(): Phaser.Scene {
    return this.actor.scene
  }

  /** 현재 말풍선에 적용된 텍스트 스타일을 반환합니다. */
  private get currentStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      ...this.baseStyle,
      ...this.appendStyle
    }
  }

  /** 말풍선 기능에 필요한 게임 오브젝트를 생성합니다. 자동으로 호출되며, *절대 직접 호출하지 마십시오.* */
  private generateObjects(): void {
    this.text = new TypingText(this.scene, 0, 0, '', {})
    this.text.setDepth(Phaser.Math.MAX_SAFE_INTEGER)
    this.text.setOrigin(0.5, 0.5)
    this.text.setStyle(this.currentStyle)
    this.text.setVisible(false)

    this.image = this.scene.add.image(0, 0, '')
    this.image.setDepth(Phaser.Math.MAX_SAFE_INTEGER)
    this.image.setOrigin(0.5, 0.5)
    this.image.setVisible(false)
  }

  /** 말풍선 위치를 업데이트합니다. 자동으로 호출되며, *절대 직접 호출하지 마십시오.* */
  private updatePosition(): void {
    const x = this.actor.x + this.offset.x
    const y = this.actor.y + this.offset.y
    this.text?.setPosition(x, y)
    this.image?.setPosition(x, y)
  }

  /**
   * 말풍선의 가로 정렬 위치를 설정합니다.
   * @param align 말풍선의 가로 정렬을 설정합니다. `left`는 좌측으로, `center`은 중심, `right`은 우측을 기준으로 정렬됩니다.
   */
  setAlign(align: 'left'|'center'|'right'): this {
    if (!this.text || !this.image) {
      return this
    }

    switch (align) {
      case 'left':
        this.text.originX = 0
        this.image.originX = 0
        break
      case 'center':
        this.text.originX = 0.5
        this.image.originX = 0.5
        break
      case 'right':
        this.text.originX = 1
        this.image.originX = 1
        break
    }

    return this
  }

  /**
   * 말풍선의 세로 정렬 위치를 설정합니다.
   * @param vertical 말풍선의 세로 정렬을 설정합니다. `top`은 상단으로, `middle`은 중심, `bottom`은 하단을 기준으로 정렬됩니다.
   */
  setVertical(vertical: 'top'|'middle'|'bottom'): this {
    if (!this.text || !this.image) {
      return this
    }

    switch (vertical) {
      case 'top':
        this.text.originY = 0
        this.image.originY = 0
        break
      case 'middle':
        this.text.originY = 0.5
        this.image.originY = 0.5
        break
      case 'bottom':
        this.text.originY = 1
        this.image.originY = 1
        break
    }

    return this
  }

  /**
   * 말풍선의 기본 텍스트 스타일을 설정합니다. 글꼴, 크기, 굵기, 기울기 등을 설정합니다.
   * @param style 스타일 정보입니다.
   */
  setBaseTextStyle(style: Phaser.Types.GameObjects.Text.TextStyle): this {
    this.baseStyle = style
    this.text?.setStyle(this.currentStyle)
    
    return this
  }

  /** 기본 말풍선 텍스트 스타일을 초기화합니다. */
  clearBaseTextStyle(): this {
    this.baseStyle = {}
    this.text?.setStyle(this.currentStyle)

    return this
  }

  /**
   * 말풍선이 해당 액터를 기준으로 어느 위치에 표시될 것인지를 설정합니다. `x`, `y` 좌표로 직접 설정할 수도 있고, 주어진 값으로 간단히 설정할 수도 있습니다.
   * @param offset 상대 좌표입니다. `x`, `y` 좌표로 설정하면, 해당 액터 인스턴스를 기준으로 상대 좌표를 상세히 설정할 수 있습니다.
   */
  setOffset(offset: Point2|keyof typeof BubbleEmitterOffset): this {
    const isoW = getIsometricWidth(this.actor.side)
    const isoH = getIsometricHeight(this.actor.side)

    const displayHeight = this.actor.displayHeight
    
    const margin            = 20
    const relativeX         = Math.abs(isoW + margin)
    const relativeTop       = Math.abs(displayHeight - isoH + margin)
    const relativeMiddle    = Math.abs((displayHeight - isoH)/2)
    const relativeBottom    = Math.abs(isoH + margin)

    let x: number
    let y: number
    if (typeof offset === 'string') {
      switch (offset) {
        case 'bottom':
          x = 0
          y = relativeBottom
          offset = { x, y }
          break
        case 'bottom-left':
          x = relativeX * -1
          y = relativeBottom
          offset = { x, y }
          break
        case 'bottom-right':
          x = relativeX
          y = relativeBottom
          offset = { x, y }
          break
        case 'left':
          x = relativeX * -1
          y = relativeMiddle * -1
          offset = { x, y }
          break
        case 'right':
          x = relativeX
          y = relativeMiddle * -1
          offset = { x, y }
          break
        case 'top':
          x = 0
          y = relativeTop * -1
          offset = { x, y }
          break
        case 'top-left':
          x = relativeX * -1
          y = relativeTop * -1
          offset = { x, y }
          break
        case 'top-right':
          x = relativeX
          y = relativeTop * -1
          offset = { x, y }
          break
      }
    }
    
    this.offset.x = offset.x
    this.offset.y = offset.y

    return this
  }

  /**
   * 기본 텍스트 스타일에 병합할 스타일을 설정합니다. 자동으로 호출되며, *직접 호출하지 마십시오.*
   * @param style 스타일 정보입니다.
   */
  private appendTextStyle(style: Phaser.Types.GameObjects.Text.TextStyle = {}): void {
    this.appendStyle = style

    this.text?.setStyle(this.currentStyle)
  }

  /**
   * 말풍선 텍스트를 보여줍니다. 자동으로 호출되며, *직접 호출하지 마십시오.*
   * @param text 보여줄 텍스트입니다. 문자열 배열을 사용하면, 줄바꿈을 표현할 수 있습니다.
   */
  private showText(text: string|string[] = ''): void {
    this.text?.setStyle(this.currentStyle)
    this.text?.setText(text)
    this.text?.setVisible(true)

    this.emit('show-text', this.text)
  }

  /**
   * 말풍선 텍스트를 제거합니다. 자동으로 호출되며, *직접 호출하지 마십시오.*
   * @param callback 말풍선이 제거된 후 호출될 함수입니다.
   */
  private clearText(callback: boolean = false): void {
    this.text?.setText('')
    this.text?.setVisible(false)
    
    this.emit('clear-text', this.text)
    
    if (this.textTimeEvent) {
      this.textTimeEvent.remove(callback)
      this.textTimeEvent = null
    }
  }

  /** 말풍선 텍스트 스타일을 초기화합니다. 자동으로 호출되며, *직접 호출하지 마십시오.* */
  private clearTextStyle(): void {
    this.appendStyle = {}
    this.baseStyle = {}
  }

  /** 말풍선 이미지 트윈을 제거합니다. 자동으로 호출되며, *직접 호출하지 마십시오.* */
  private clearImageTween(): void {
    if (!this.imageTween) {
      return
    }
    this.imageTween.remove()
    this.imageTween = null
  }

  /** 말풍선 텍스트를 파괴합니다. 자동으로 호출되며, *직접 호출하지 마십시오.* */
  private destroyText(): void {
    this.text?.destroy()
    this.text = null
  }

  /** 말풍선 이미지를 파괴합니다. 자동으로 호출되며, *직접 호출하지 마십시오.* */
  private destroyImage(): void {
    this.image?.destroy()
    this.image = null
  }

  /**
   * 말풍선에 텍스트를 출력합니다. 텍스트가 타이핑되듯이 한 글자씩 출력합니다. 출력이 끝난 뒤에는 일정 시간 뒤에 자동으로 사라집니다.
   * @param text 보여줄 텍스트 문자열입니다.
   * @param speed 한 글자가 타이핑되는데 걸리는 시간(ms)입니다. 기본값은 `35`입니다.
   * @param style 이 텍스트에 추가로 적용될 텍스트 스타일입니다.
   */
  say(text: string, speed: number = 35, style: Phaser.Types.GameObjects.Text.TextStyle = {}): this {
    this.isNotice = false
    
    this.clearText()
    this.closeEmotion(0, () => {
      this.appendTextStyle(style)
      this.showText()
      
      this.emit('say-typing-start', this.text)

      this.text?.startTyping(text, speed)
        .on('step', () => {
          this.emit('say-typing', this.text)
        })
        .on('done', () => {
          this.emit('say-typing-done', this.text)

          this.textTimeEvent = this.scene?.time.delayedCall(2500, () => {
            this.emit('say-finish', this.text)

            this.clearText()
          })
        })
    })

    return this
  }

  /**
   * 말풍선에 텍스트를 고정합니다. 
   * `clear`, `say` 메서드를 사용하기 전까지 이 텍스트는 사라지지 않습니다. 일반적으로 액터의 이름같이 캐릭터 위에 고정되어있는 텍스트를 위해 사용합니다.
   * @param text 보여줄 텍스트 문자열입니다.
   * @param style 이 텍스트에 추가로 적용될 텍스트 스타일입니다.
   */
  notice(text: string|string[], style: Phaser.Types.GameObjects.Text.TextStyle = {}): this {
    this.isNotice = true
    this.noticeText = text
    
    this.clearText()
    this.closeEmotion(0, () => {
      this.appendTextStyle(style)
      this.showText(text)
    })

    return this
  }

  /**
   * 말풍선 이미지를 엽니다. 자동으로 호출되며, *직접 호출하지 마십시오.*
   * @param key 말풍선 이미지로 사용할 텍스쳐 키입니다. 기본값도 지원합니다.
   * @param callback 말풍선이 열린 뒤 호출될 함수입니다.
   */
  private openEmotion(key: keyof typeof BubbleEmotion|Phaser.Textures.Texture, callback?: () => void): void {
    this.clearImageTween()
    this.clearText()

    this.image?.setVisible(true)
    this.image?.setScale(0)

    const emotions = Object.keys(BubbleEmotion)
    if (key instanceof Phaser.Textures.Texture) {
      this.image?.setTexture(key.key)
    }
    else if (emotions.indexOf(key) !== -1) {
      this.image?.setTexture(BubbleEmotion[key as keyof typeof BubbleEmotion])
    }
    else {
      this.image?.setTexture(key)
    }

    this.imageTween = this.scene.tweens.add({
      targets: this.image,
      scale: 1,
      duration: 300,
      ease: Phaser.Math.Easing.Back.Out
    }).on(Phaser.Tweens.Events.TWEEN_COMPLETE, () => {
      this.emit('show-emotion', this.image)

      if (callback) {
        callback()
      }
    })
  }

  /**
   * 말풍선 이미지를 닫습니다. 자동으로 호출되며, *직접 호출하지 마십시오.*
   * @param delay 닫히기까지 대기할 시간입니다.
   * @param callback 닫힌 후 호출될 함수입니다.
   */
  private closeEmotion(delay: number = 0, callback?: () => void): void {
    this.clearImageTween()

    const after = () => {
      this.image?.setVisible(false)
      this.clearImageTween()

      this.emit('clear-emotion', this.image)

      if (callback) {
        callback()
      }
    }

    if (!this.image?.visible) {
      after()
      return
    }

    this.imageTween = this.scene.tweens.add({
      targets: this.image,
      scale: 0,
      duration: 300,
      delay,
      ease: Phaser.Math.Easing.Back.In
    }).on(Phaser.Tweens.Events.TWEEN_COMPLETE, after)
  }

  /**
   * 말풍선 이미지를 보여줍니다. 몇 가지 감정표현 이미지의 기본값이 있습니다. 만약 원하는 이미지를 띄우고 싶다면, 로드된 이미지를 텍스쳐를 이용하여 `scene.textures.get(key)`로 매개변수를 넘기십시오.
   * @param key 보여줄 말풍선 키입니다.
   * @param duration 말풍선을 보여줄 시간(ms)입니다. 기본값은 `2500`입니다.
   */
  emotion(key: keyof typeof BubbleEmotion|Phaser.Textures.Texture, duration: number = 2500): this {
    this.clearText()

    this.openEmotion(key, () => {
      this.closeEmotion(duration, () => {
        if (this.isNotice) {
          this.showText(this.noticeText)
        }
      })
    })

    return this
  }

  /**
   * 말풍선의 텍스트, 또는 이미지를 제거합니다.
   * @param clearNotice `notice` 메서드로 보여주는 텍스트도 제거할지 여부를 결정합니다. 기본값은 `true`입니다.
   */
  clear(clearNotice: boolean = true): this {
    if (clearNotice) {
      this.isNotice = false
      this.noticeText = ''
    }

    this.clearText()
    this.closeEmotion(0, () => {
      if (this.isNotice) {
        this.showText(this.noticeText)
      }
    })

    return this
  }

  /**
   * 말풍선을 업데이트하는 함수입니다. 씬이 매 프레임 업데이트 될 때 마다 자동으로 호출됩니다. *직접 호출하지 마십시오.*
   * @param time 
   * @param delta 
   */
  update(_time: number, _delta: number): void {
    this.updatePosition()
  }

  /** 말풍선 인스턴스를 파괴합니다. 자동으로 호출되며, *직접 호출하지 마십시오.* */
  destroy(): void {
    this.clearText()
    this.clearTextStyle()
    this.clearImageTween()
    this.destroyText()
    this.destroyImage()
  }
}

export class ActorBubble {
    private readonly actor: Actor
    private readonly emitters: Map<string, ActorBubbleEmitter> = new Map

    static update(bubble: ActorBubble, time: number, delta: number): void {
      bubble.update(time, delta)
    }

    static destroy(bubble: ActorBubble): void {
      bubble.destroy()
    }

    constructor(actor: Actor) {
      this.actor = actor
    }

    /** 해당 액터 인스턴스가 속한 씬을 반환합니다. 씬에 추가되어있지 않다면 `null`을 반환합니다. */
    // private get scene(): Phaser.Scene|null {
    //     if (!this.actor) return null
    //     return this.actor.world.scene
    // }

    /**
     * 말풍선 인스턴스를 반환합니다. 말풍선이 없다면 만든 뒤 반환하고, 존재한다면 가져와서 반환합니다.
     * 말풍선입니다.
     * 액터의 주변에 떠다니는 텍스트, 또는 이미지를 표현할 수 있습니다.
     * 액터가 대사를 말하거나, 이름, 레벨 등의 정보를 표기할 수 있습니다.
     * `say` 메서드는 대사를, `notice`는 레벨을, `emotion`은 감정표현을 표현하기에 적합합니다.
     * @param key 가져올 말풍선 키입니다.
     */
    of(key: string): ActorBubbleEmitter {
      if (!this.emitters.has(key)) {
        this.emitters.set(key, new ActorBubbleEmitter(this.actor))
      }
      return this.emitters.get(key)!
    }

    private updateTypers(time: number, delta: number): void {
      for (const bubble of this.emitters.values()) {
        bubble.update(time, delta)
      }
    }

    private update(time: number, delta: number): void {
      this.updateTypers(time, delta)
    }

    private destroy(): void {
      for (const typer of this.emitters.values()) {
        typer.destroy()
      }
      this.emitters.clear()
    }
}