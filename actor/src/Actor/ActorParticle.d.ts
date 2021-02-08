import Phaser from 'phaser';
import { Actor } from './Actor';
declare type Texture = Phaser.Textures.Texture | string;
declare type ParticleEmitterConfig = Phaser.Types.GameObjects.Particles.ParticleEmitterConfig;
interface ParticleEmitterOption {
    isTop: boolean;
    emitter: Phaser.GameObjects.Particles.ParticleEmitter;
}
export declare class ActorParticle {
    private actor;
    private emittermap;
    static update(particle: ActorParticle, time: number, delta: number): void;
    static destroy(particle: ActorParticle): void;
    static createEmitterOption(emitter: Phaser.GameObjects.Particles.ParticleEmitter, isTop: boolean): ParticleEmitterOption;
    constructor(actor: Actor);
    private get scene();
    private get emitters();
    add(key: string, texture: Texture, isTop?: boolean, config?: ParticleEmitterConfig): this;
    private destroyEmitter;
    private destroyAllEmitter;
    remove(key: string): this;
    has(key: string): boolean;
    get(key: string): Phaser.GameObjects.Particles.ParticleEmitter | null;
    play(key: string, frequency?: number, quantity?: number): this;
    pause(key: string): this;
    explode(key: string, count: number): this;
    private sortDepth;
    private update;
    private destroy;
}
export {};
