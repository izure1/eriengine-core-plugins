import Phaser from 'phaser'
import { IntervalManager } from './IntervalManager'

class TypingText extends Phaser.GameObjects.Text {
    private textContent: string = ''
    private stepper: IntervalManager|null = null

    constructor(scene: Phaser.Scene, x: number, y: number, text: string|string[], style: Phaser.Types.GameObjects.Text.TextStyle) {
        super(scene, x, y, text, style)
        this.registDestroy()
        this.scene.add.existing(this)
    }

    private registDestroy(): void {
        this.on(Phaser.GameObjects.Events.DESTROY, (): void => {
            this.destroyStepper()
        })
    }

    private destroyStepper(): void {
        this.stepper?.destroy()
        this.stepper = null
    }

    protected startTyping(text: string, speed: number = 35): IntervalManager {
        this.textContent = text

        if (this.stepper) {
            this.destroyStepper()
            this.setText('')
        }

        this.stepper = new IntervalManager(this.scene)
        this.stepper
            .on('step', (current: number): void => {
                const content: string = this.textContent.substr(0, current)
                this.setText(content)
            })
            .on('done', (): void => {
                this.setText(this.textContent)
                this.destroyStepper()
            })
            .start(speed, this.textContent.length)
        return this.stepper
    }
}

export { TypingText }