import Phaser from 'phaser'
import { Actor } from './Actor'
import { Point2 } from '@common/Math/MathUtil'
import { IntervalManager } from '@common/Phaser/IntervalManager'

class ActorBubbleTyper {
    private actor: Actor|null = null
    private textContent: string = ''
    private textObject: Phaser.GameObjects.Text|null = null
    private originX: number = 0.5
    private originY: number = 0.5
    private offset: Point2 = { x: 0, y: 0 }
    private baseStyle: Phaser.Types.GameObjects.Text.TextStyle = { fontSize: '15px', color: 'white', strokeThickness: 3, stroke: 'black' }
    private appendStyle: Phaser.Types.GameObjects.Text.TextStyle = {}
    private stepper: IntervalManager|null = null

    static update(typer: ActorBubbleTyper, time: number, delta: number): void {
        typer.update(time, delta)
    }

    static destroy(typer: ActorBubbleTyper): void {
        typer.destroy()
    }

    constructor(actor: Actor) {
        this.actor = actor
        this.generateTextObject()
        this.setStyle()
    }

    private get scene(): Phaser.Scene|null {
        if (!this.actor) return null
        return this.actor.world.scene
    }

    private get currentStyle(): Phaser.Types.GameObjects.Text.TextStyle {
        return { ...this.baseStyle, ...this.appendStyle }
    }

    private generateTextObject(): void {
        this.textObject = this.scene?.add.text(0, 0, this.textContent)!
        this.textObject.setDepth(Phaser.Math.MAX_SAFE_INTEGER)
        this.textObject.setOrigin(0.5, 0.5)
    }

    private setStyle(): void {
        this.textObject?.setStyle(this.currentStyle)
    }

    private updatePosition(): void {
        const x: number = this.actor!.x + this.offset.x
        const y: number = this.actor!.y + this.offset.y
        this.textObject?.setPosition(x, y)
    }

    private setOrigin(): void {
        const { originX, originY } = this
        this.textObject?.setOrigin(originX, originY)
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
        this.setOrigin()
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
        this.setOrigin()
        return this
    }

    setBaseTextStyle(style: Phaser.Types.GameObjects.Text.TextStyle): this {
        this.baseStyle = style
        this.setStyle()
        return this
    }

    clearBaseTextStyle(): this {
        this.baseStyle = {}
        this.setStyle()
        return this
    }

    setOffset(offset: Point2): this {
        this.offset = offset
        return this
    }

    private destroyStepper(): void {
        if (!this.stepper) {
            return
        }
        this.stepper.stop()
        this.stepper.destroy()
        this.stepper = null
    }

    say(text: string, speed: number = 35, style: Phaser.Types.GameObjects.Text.TextStyle = {}): this {
        this.appendStyle = style
        this.textContent = text

        if (this.stepper) {
            this.destroyStepper()
            this.textObject?.setText('')
        }

        this.setStyle()

        this.stepper = new IntervalManager(this.scene!)
        this.stepper
        .on('step', (current: number): void => {
            const content: string = this.textContent.substr(0, current)
            this.textObject?.setText(content)
        })
        .on('done', (): void => {
            this.textObject?.setText(this.textContent)
            this.destroyStepper()
            
            this.stepper = new IntervalManager(this.scene!)
            this.stepper.on('done', (): void => {
                this.textObject?.setText('')
                this.destroyStepper()
            }).start(2500, 1)
        })
        .start(speed, this.textContent.length)
        return this
    }

    notice(text: string, style: Phaser.Types.GameObjects.Text.TextStyle = {}): this {
        this.appendStyle = style
        this.destroyStepper()
        this.setStyle()
        this.textObject?.setText(text)
        return this
    }

    private update(time: number, delta: number): void {
        this.updatePosition()
    }

    private destroy(): void {
        this.destroyStepper()
        this.textObject?.destroy()
        this.textObject = null
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
            ActorBubbleTyper.update(bubble, time, delta)
        }
    }

    private update(time: number, delta: number): void {
        this.updateTypers(time, delta)
    }

    private destroy(): void {
        for (const typer of this.textmap.values()) {
            ActorBubbleTyper.destroy(typer)
        }
        this.textmap.clear()
        this.actor = null
    }
}