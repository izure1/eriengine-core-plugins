import Phaser from 'phaser'
import { Actor } from './Actor'

type Texture = Phaser.Textures.Texture|string
type ParticleEmitterConfig = Phaser.Types.GameObjects.Particles.ParticleEmitterConfig
interface ParticleEmitterOption {
    isTop: boolean
    emitter: Phaser.GameObjects.Particles.ParticleEmitter
}

export class ActorParticle {
    private actor: Actor|null = null
    private emittermap: Map<string, ParticleEmitterOption> = new Map

    static update(particle: ActorParticle, time: number, delta: number): void {
        particle.update(time, delta)
    }

    static destroy(particle: ActorParticle): void {
        particle.destroy()
    }
    
    static createEmitterOption(emitter: Phaser.GameObjects.Particles.ParticleEmitter, isTop: boolean): ParticleEmitterOption {
        return { isTop, emitter }
    }

    constructor(actor: Actor) {
        this.actor = actor
    }

    private get scene(): Phaser.Scene|null {
        if (!this.actor) return null
        return this.actor.world.scene
    }

    private get emitters(): Phaser.GameObjects.Particles.ParticleEmitter[] {
        const emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = []
        for (const { emitter } of this.emittermap.values()) {
            emitters.push(emitter)
        }
        return emitters
    }

    add(key: string, texture: Texture, isTop: boolean = false, config: ParticleEmitterConfig = {}): this {
        if (!this.actor || !this.scene) {
            return this
        }

        const configDefault: ParticleEmitterConfig = {
            speed: 200,
            lifespan: 400,
            blendMode: Phaser.BlendModes.ADD,
            scale: { start: 1, end: 0 }
        }
        const configAppended: ParticleEmitterConfig = { ...configDefault, ...config }

        const manager: Phaser.GameObjects.Particles.ParticleEmitterManager = this.scene.add.particles(texture)
        const emitter: Phaser.GameObjects.Particles.ParticleEmitter = manager.createEmitter(configAppended).startFollow(this.actor)

        const option: ParticleEmitterOption = ActorParticle.createEmitterOption(emitter, isTop)

        this.remove(key)
        this.emittermap.set(key, option)

        return this
    }

    private destroyEmitter(emitter: Phaser.GameObjects.Particles.ParticleEmitter): void {
        if (!this.actor) {
            return
        }
        emitter.stop()
        this.scene?.time.delayedCall(emitter.lifespan.propertyValue, (): void => {
            emitter.manager.destroy()
        })
    }

    private destroyAllEmitter(): void {
        for (const emitter of this.emitters) {
            this.destroyEmitter(emitter)
        }
    }

    remove(key: string): this {
        if (this.emittermap.has(key)) {
            const { emitter } = this.emittermap.get(key)!
            this.destroyEmitter(emitter)
        }
        return this
    }

    has(key: string): boolean {
        return this.emittermap.has(key)
    }

    get(key: string): Phaser.GameObjects.Particles.ParticleEmitter|null {
        if (!this.emittermap.has(key)) {
            return null
        }
        const { emitter } = this.emittermap.get(key)!
        return emitter
    }

    play(key: string, frequency: number = 0, quantity: number = 1): this {
        if (!this.actor) {
            return this
        }
        if (!this.emittermap.has(key)) {
            return this
        }
        const { emitter } = this.emittermap.get(key)!
        emitter.setFrequency(frequency, quantity).start()
        return this
    }

    pause(key: string): this {
        if (!this.actor) {
            return this
        }
        if (!this.emittermap.has(key)) {
            return this
        }
        const { emitter } = this.emittermap.get(key)!
        emitter.stop()
        return this
    }

    explode(key: string, count: number): this {
        if (!this.actor) {
            return this
        }
        if (!this.emittermap.has(key)) {
            return this
        }
        const { emitter } = this.emittermap.get(key)!
        const { x, y } = this.actor
        emitter.start()
        emitter.explode(count, x, y)
        return this
    }

    private sortDepth(): void {
        if (!this.actor) {
            return
        }
        for (const { emitter, isTop } of this.emittermap.values()) {
            if (!emitter.manager) {
                continue
            }
            const depth: number = isTop ? 1 : -1
            emitter.manager.setDepth(this.actor.y + depth)
        }
    }

    private update(time: number, delta: number): void {
        this.sortDepth()
    }

    private destroy(): void {
        this.destroyAllEmitter()
        this.emittermap.clear()
        this.actor = null
    }
}