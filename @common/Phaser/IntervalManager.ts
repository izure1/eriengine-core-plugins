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
    private remainTime: number = 0
    private intervalTime: number = 0
    private isRunning: boolean = false
    private onUpdateCallback: ((time: number, delta: number) => void)|null = null

    constructor(scene: Phaser.Scene) {
        super()
        this.scene = scene
        this.registUpdateHandler()
    }

    start(interval: number, maxiumStep: number): void {
        this.currentStep = 0
        this.maxiumStep = maxiumStep
        this.remainTime = interval
        this.intervalTime = interval
        this.isRunning = true
    }

    stop(): void {
        this.currentStep = 0
        this.maxiumStep = 0
        this.remainTime = 0
        this.intervalTime = 0
        this.isRunning = false
    }

    finish(): void {
        this.remainTime = 0
        this.currentStep = this.maxiumStep
        this.onUpdate(0, 0)
    }

    private onUpdate(time: number, delta: number): void {
        if (!this.isRunning) {
            return
        }
        this.remainTime -= delta
        if (this.remainTime <= 0) {
            this.remainTime = this.intervalTime
            this.emit('step', this.currentStep++, this.maxiumStep)
        }
        if (this.currentStep >= this.maxiumStep) {
            this.stop()
            this.emit('done', this.currentStep, this.maxiumStep)
            this.destroy()
        }
    }

    private registUpdateHandler(): void {
        this.onUpdateCallback = this.onUpdate.bind(this)
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdateCallback)
    }

    private removeUpdateHandler(): void {
        if (!this.onUpdateCallback) {
            return
        }
        this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdateCallback)
    }

    destroy(): void {
        this.stop()
        this.removeUpdateHandler()
    }
}