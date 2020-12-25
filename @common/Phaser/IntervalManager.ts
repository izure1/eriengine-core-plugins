import Phaser from 'phaser'
import { TypedEmitter } from 'tiny-typed-emitter'

interface Events {
    step: (currentStep: number, maxiumStep: number) => void
    done: (currentStep: number, maxiumStep: number) => void
}

export class IntervalManager extends TypedEmitter<Events> {
    private scene: Phaser.Scene
    private currentStep: number = 0
    private maxiumStep: number = 0
    private intervalTime: number = 0
    private timeEvent: Phaser.Time.TimerEvent|null = null

    constructor(scene: Phaser.Scene) {
        super()
        this.scene = scene
    }

    start(interval: number, maxiumStep: number): void {
        this.currentStep = 0
        this.maxiumStep = maxiumStep
        this.intervalTime = interval
        this.setTimeout()
    }

    finish(): void {
        this.currentStep = this.maxiumStep
        this.setTimeout()
    }

    private destroyTimeEvent(): void {
        if (!this.timeEvent) {
            return
        }
        this.timeEvent.remove()
        this.timeEvent = null
    }

    private setTimeout(): void {
        this.destroyTimeEvent()
        this.timeEvent = this.scene.time.delayedCall(this.intervalTime, (): void => {
            this.emit('step', this.currentStep++, this.maxiumStep)
            this.setTimeout()
        })
        if (this.currentStep >= this.maxiumStep) {
            this.emit('done', this.currentStep, this.maxiumStep)
            this.destroy()
        }
    }

    destroy(): void {
        this.destroyTimeEvent()
        this.currentStep = 0
        this.maxiumStep = 0
        this.intervalTime = 0
    }
}