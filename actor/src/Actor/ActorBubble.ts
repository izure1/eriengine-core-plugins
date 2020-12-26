import Phaser from 'phaser'
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

class ActorBubbleEmitter {
    private actor: Actor|null = null
    private offset: Point2 = { x: 0, y: 0 }
    private baseStyle: Phaser.Types.GameObjects.Text.TextStyle = { fontSize: '15px', color: 'white', strokeThickness: 3, stroke: 'black' }
    private appendStyle: Phaser.Types.GameObjects.Text.TextStyle = {}
    private image: Phaser.GameObjects.Image|null = null
    private text: TypingText|null = null
    private imageTween: Phaser.Tweens.Tween|null = null
    private textTimeEvent: Phaser.Time.TimerEvent|null = null
    private isNotice: boolean = false

    constructor(actor: Actor) {
        this.actor = actor
        this.generateObjects()
    }

    private get scene(): Phaser.Scene|null {
        if (!this.actor) {
            return null
        }
        return this.actor.scene
    }

    private get currentStyle(): Phaser.Types.GameObjects.Text.TextStyle {
        return { ...this.baseStyle, ...this.appendStyle }
    }

    private generateObjects(): void {
        if (!this.scene) {
            return
        }
        this.text = new TypingText(this.scene, 0, 0, '', {})
        this.text.setDepth(Phaser.Math.MAX_SAFE_INTEGER)
        this.text.setOrigin(0.5, 0.5)
        this.text?.setStyle(this.currentStyle)
        this.text.setVisible(false)

        this.image = this.scene.add.image(0, 0, '')
        this.image.setDepth(Phaser.Math.MAX_SAFE_INTEGER)
        this.image.setOrigin(0.5, 0.5)
        this.image.setVisible(false)
    }

    private updatePosition(): void {
        const x: number = this.actor!.x + this.offset.x
        const y: number = this.actor!.y + this.offset.y
        this.text?.setPosition(x, y)
        this.image?.setPosition(x, y)
    }

    setAlign(align: 'left'|'center'|'right'): this {
        if (!this.text || !this.image) {
            return this
        }
        switch(align) {
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

    setVertical(vertical: 'top'|'middle'|'bottom'): this {
        if (!this.text || !this.image) {
            return this
        }
        switch(vertical) {
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

    setBaseTextStyle(style: Phaser.Types.GameObjects.Text.TextStyle): this {
        this.baseStyle = style
        this.text?.setStyle(this.currentStyle)
        return this
    }

    clearBaseTextStyle(): this {
        this.baseStyle = {}
        this.text?.setStyle(this.currentStyle)
        return this
    }

    setOffset(offset: Point2|keyof typeof BubbleEmitterOffset): this {
        if (!this.actor) {
            return this
        }

        const isoW: number = getIsometricWidth(this.actor.side)
        const isoH: number = getIsometricHeight(this.actor.side)

        const displayHeight: number     = this.actor.displayHeight
        
        const margin: number            = 20
        const relativeX: number         = Math.abs(isoW + margin)
        const relativeTop: number       = Math.abs(displayHeight - isoH + margin)
        const relativeMiddle: number    = Math.abs((displayHeight - isoH)/2)
        const relativeBottom: number    = Math.abs(isoH + margin)

        let x: number
        let y: number
        if (typeof offset === 'string') {
            switch(offset) {
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
        this.offset = offset as Point2
        return this
    }

    private clearTextTimeEvent(dispatchCallback: boolean = false): void {
        if (!this.textTimeEvent) {
            return
        }
        this.textTimeEvent.remove(dispatchCallback)
        this.textTimeEvent = null
    }

    private clearImageTween(): void {
        if (!this.imageTween) {
            return
        }
        this.imageTween.remove()
        this.imageTween = null
    }

    private destroyText(): void {
        this.text?.destroy()
        this.text = null
    }

    private destroyImage(): void {
        this.image?.destroy()
        this.image = null
    }

    say(text: string, speed: number = 35, style: Phaser.Types.GameObjects.Text.TextStyle = {}): this {
        this.isNotice = false
        this.text?.setVisible(false)
        
        this.clearTextTimeEvent()
        this.closeEmotion(0, (): void => {
            this.appendStyle = style
            this.text?.setText('')
            this.text?.setStyle(this.currentStyle)
            this.text?.setVisible(true)
            this.text?.startTyping(text, speed).on('done', (): void => {
                if (!this.scene) {
                    return
                }
                this.textTimeEvent = this.scene?.time.delayedCall(2500, (): void => {
                    this.text?.setText('')
                    this.text?.setVisible(false)
                    this.clearTextTimeEvent()
                })
            })
        })
        return this
    }

    notice(text: string, style: Phaser.Types.GameObjects.Text.TextStyle = {}): this {
        this.isNotice = true
        
        this.text?.setVisible(false)
        this.clearTextTimeEvent()
        this.closeEmotion(0, (): void => {
            this.appendStyle = style
            this.text?.setText(text)
            this.text?.setStyle(this.currentStyle)
            this.text?.setVisible(true)
        })
        return this
    }

    private openEmotion(key: string|keyof typeof BubbleEmotion|Phaser.Textures.Texture, callback?: () => void): void {
        if (!this.scene) {
            return
        }

        this.clearImageTween()

        this.text?.setVisible(false)
        this.image?.setVisible(true)
        this.image?.setScale(0)

        const emotions: string[] = Object.keys(BubbleEmotion)
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
        }).on(Phaser.Tweens.Events.TWEEN_COMPLETE, (): void => {
            if (callback) {
                callback()
            }
        })
    }

    private closeEmotion(delay: number = 0, callback?: () => void): void {
        if (!this.scene) {
            return
        }

        this.clearImageTween()

        const after = (): void => {
            this.image?.setVisible(false)
            this.clearImageTween()

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

    emotion(key: keyof typeof BubbleEmotion|string|Phaser.Textures.Texture, duration: number = 2500): this {
        if (!this.scene) {
            return this
        }

        this.text?.setVisible(false)

        this.openEmotion(key, (): void => {
            this.closeEmotion(duration, (): void => {
                if (this.isNotice) {
                    this.text?.setVisible(true)
                }
            })
        })
        return this
    }

    update(time: number, delta: number): void {
        this.updatePosition()
    }

    destroy(): void {
        this.clearTextTimeEvent()
        this.clearImageTween()
        this.destroyText()
        this.destroyImage()
        this.actor = null
    }
}

export class ActorBubble {
    private actor: Actor|null = null
    private emitters: Map<string, ActorBubbleEmitter> = new Map

    static update(bubble: ActorBubble, time: number, delta: number): void {
        bubble.update(time, delta)
    }

    static destroy(bubble: ActorBubble): void {
        bubble.destroy()
    }

    constructor(actor: Actor) {
        this.actor = actor
    }

    private get scene(): Phaser.Scene|null {
        if (!this.actor) return null
        return this.actor.world.scene
    }

    of(key: string): ActorBubbleEmitter {
        if (!this.emitters.has(key)) {
            this.emitters.set(key, new ActorBubbleEmitter(this.actor!))
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
        this.actor = null
    }
}