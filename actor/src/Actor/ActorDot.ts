import { Actor } from './Actor'

type UpdateCallback = (time: number, delta: number) => void
interface DotJob {
    start: number
    duration: number
    tickCallback?: UpdateCallback
    doneCallback?: UpdateCallback
}

export class ActorDot {
    private jobmap: Map<string, DotJob> = new Map
    private actor: Actor|null = null

    static update(dot: ActorDot, time: number, delta: number): void {
        dot.update(time, delta)
    }

    static destroy(dot: ActorDot): void {
        dot.destroy()
    }

    constructor(actor: Actor) {
        this.actor = actor
    }

    private get scene(): Phaser.Scene|null {
        if (!this.actor) return null
        return this.actor.world.scene
    }

    private get now(): number {
        return this.actor?.world.scene.time.now as number
    }

    start(key: string, duration: number, tickCallback?: UpdateCallback, doneCallback?: UpdateCallback): this {
        const start: number = this.now
        this.jobmap.set(key, { start, duration, tickCallback, doneCallback })
        return this
    }

    has(key: string): boolean {
        return this.jobmap.has(key)
    }

    stop(key: string): this {
        this.jobmap.delete(key)
        return this
    }

    private update(time: number, delta: number): void {
        for (const [ key, { start, duration, tickCallback, doneCallback } ] of this.jobmap) {
            if (start + duration < time) {
                if (doneCallback) {
                    doneCallback(time, delta)
                }
                this.jobmap.delete(key)
                continue
            }
            if (tickCallback) {
                tickCallback(time, delta)
            }
        }
    }

    private destroy(): void {
        this.actor = null
        this.jobmap.clear()
    }
}