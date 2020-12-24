import Phaser from 'phaser'
import { Actor } from './Actor'
import { Point2 } from '@common/Math/MathUtil'
import { TypingText } from '@common/Phaser/TypingText'

class ActorBubbleEmitter {
    private actor: Actor|null = null
    private offset: Point2 = { x: 0, y: 0 }
    private baseStyle: Phaser.Types.GameObjects.Text.TextStyle = { fontSize: '15px', color: 'white', strokeThickness: 3, stroke: 'black' }
    private appendStyle: Phaser.Types.GameObjects.Text.TextStyle = {}
    private image: Phaser.GameObjects.Sprite|null = null
    private text: TypingText|null = null

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

        this.image = this.scene.add.sprite(0, 0, this.scene.textures.get('asdfasdf'))
        this.image.setDepth(Phaser.Math.MAX_SAFE_INTEGER)
        this.image.setOrigin(0.5, 0.5)
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

    setOffset(offset: Point2): this {
        this.offset = offset
        return this
    }

    say(text: string, speed: number = 35, style: Phaser.Types.GameObjects.Text.TextStyle = {}): this {
        this.text?.setVisible(true)
        this.image?.setVisible(false)
        
        this.appendStyle = style
        this.text?.setStyle(this.currentStyle)
        this.text?.startTyping(text, speed).on('done', (): void => {
            this.scene?.time.delayedCall(2500, (): void => {
                this.text?.setText('')
            })
        })
        return this
    }

    notice(text: string, style: Phaser.Types.GameObjects.Text.TextStyle = {}): this {
        this.text?.setVisible(true)
        this.image?.setVisible(false)

        this.appendStyle = style
        this.text?.setStyle(this.currentStyle)
        this.text?.setText(text)
        return this
    }

    emotion(animationKey: Phaser.Animations.Animation|Phaser.Types.Animations.PlayAnimationConfig|string, duration: number = 2500): this {
        this.text?.setActive(false)
        this.image?.setVisible(true)

        this.image?.play(animationKey, true)

        if (duration < 0) {
            return this
        }
        var a = this.scene?.time.delayedCall(duration, (): void => {
            this.image?.setVisible(false)
        })
        a.re
        return this
    }

    update(time: number, delta: number): void {
        this.updatePosition()
    }

    destroy(): void {
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