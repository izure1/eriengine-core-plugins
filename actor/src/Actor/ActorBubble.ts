import Phaser from 'phaser'
import { Actor } from './Actor'
import { Point2 } from '@common/Math/MathUtil'
import { TypingText } from '@common/Phaser/TypingText'

class ActorBubbleTyper extends TypingText {
    private actor: Actor|null = null
    private offset: Point2 = { x: 0, y: 0 }
    private baseStyle: Phaser.Types.GameObjects.Text.TextStyle = { fontSize: '15px', color: 'white', strokeThickness: 3, stroke: 'black' }
    private appendStyle: Phaser.Types.GameObjects.Text.TextStyle = {}

    constructor(actor: Actor) {
        super(actor.world.scene, 0, 0, '', {})
        this.actor = actor
        this.generateTextObject()
        this.setStyle(this.currentStyle)
    }

    private get currentStyle(): Phaser.Types.GameObjects.Text.TextStyle {
        return { ...this.baseStyle, ...this.appendStyle }
    }

    private generateTextObject(): void {
        this.setDepth(Phaser.Math.MAX_SAFE_INTEGER)
        this.setOrigin(0.5, 0.5)
    }

    private updatePosition(): void {
        const x: number = this.actor!.x + this.offset.x
        const y: number = this.actor!.y + this.offset.y
        this.setPosition(x, y)
    }

    setAlign(align: 'left'|'center'|'right'): this {
        switch(align) {
            case 'left':
                this.originX = 0
                break
            case 'center':
                this.originX = 0.5
                break
            case 'right':
                this.originX = 1
                break
        }
        return this
    }

    setVertical(vertical: 'top'|'middle'|'bottom'): this {
        switch(vertical) {
            case 'top':
                this.originY = 0
                break
            case 'middle':
                this.originY = 0.5
                break
            case 'bottom':
                this.originY = 1
                break
        }
        return this
    }

    setBaseTextStyle(style: Phaser.Types.GameObjects.Text.TextStyle): this {
        this.baseStyle = style
        this.setStyle(this.currentStyle)
        return this
    }

    clearBaseTextStyle(): this {
        this.baseStyle = {}
        this.setStyle(this.currentStyle)
        return this
    }

    setOffset(offset: Point2): this {
        this.offset = offset
        return this
    }

    say(text: string, speed: number = 35, style: Phaser.Types.GameObjects.Text.TextStyle = {}): this {
        this.appendStyle = style

        this.setStyle(this.currentStyle)
        this.typingText(text, speed)

        // .on('done', (): void => {
        //     this.textObject?.setText(this.textContent)
        //     this.destroyStepper()
            
        //     this.stepper = new IntervalManager(this.scene!)
        //     this.stepper.on('done', (): void => {
        //         this.textObject?.setText('')
        //         this.destroyStepper()
        //     }).start(2500, 1)
        // })
        // .start(speed, this.textContent.length)
        return this
    }

    notice(text: string, style: Phaser.Types.GameObjects.Text.TextStyle = {}): this {
        this.appendStyle = style
        this.setStyle(this.currentStyle)
        this.setText(text)
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
    private textmap: Map<string, ActorBubbleTyper> = new Map

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

    of(key: string): ActorBubbleTyper {
        if (!this.textmap.has(key)) {
            this.textmap.set(key, new ActorBubbleTyper(this.actor!))
        }
        return this.textmap.get(key)!
    }

    private updateTypers(time: number, delta: number): void {
        for (const bubble of this.textmap.values()) {
            bubble.update(time, delta)
        }
    }

    private update(time: number, delta: number): void {
        this.updateTypers(time, delta)
    }

    private destroy(): void {
        for (const typer of this.textmap.values()) {
            typer.destroy()
        }
        this.textmap.clear()
        this.actor = null
    }
}