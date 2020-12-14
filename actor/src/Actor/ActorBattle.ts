import { TypedEmitter } from 'tiny-typed-emitter'
import { Actor } from './Actor'
import { ActorDot } from './ActorDot'
import { Vector2 } from '@common/Math/MathUtil'

type ActorForce = 'all'|'all-except-me'|'allies'|'enemies'|'both'|'neutral'
interface HitInformation {
    name?: string
    isMiss?: boolean
    isImmunity?: boolean
    isDot?: boolean
    damage?: number
    heal?: number
    duration?: number
    [key: string]: any
}
type HitCallback = (targets: Actor, dot: ActorDot) => HitInformation

export interface EventParameter {
    'hit':      (target: Actor, information: HitInformation) => void
    'get-hit':  (from: Actor, information: HitInformation) => void
    'win':      (from: Actor) => void
    'defeat':   (froms: Actor[]) => void
}

export class ActorBattle extends TypedEmitter<EventParameter> {
    private actor: Actor|null
    private readonly skillmap: Map<string, HitCallback> = new Map       // 자신이 가지고 있는 스킬 목록입니다.
    private readonly enemyset: Set<Actor> = new Set                     // 자신이 교전을 할 적 액터 목록입니다.
    private readonly allyset: Set<Actor> = new Set                      // 자신의 아군 액터 목록입니다.
    private readonly attackerset: Set<Actor> = new Set                  // 자신을 공격하고 있는 액터 목록입니다. 아군, 적군을 구분하지 않습니다.

    static destroy(battle: ActorBattle): void {
        battle.destroy()
    }

    constructor(actor: Actor) {
        super()
        this.actor = actor
    }

    private get scene(): Phaser.Scene|null {
        if (!this.actor) return null
        return this.actor.world.scene
    }

    private get actors(): Actor[] {
        if (!this.actor) return []
        return this.actor?.plugin.actors
    }

    get all(): Actor[] {
        return this.actors
    }

    get except(): Actor[] {
        return this.all.filter((actor: Actor): boolean => actor.battle !== this.actor?.battle)
    }

    get enemies(): Actor[] {
        return [ ...this.enemyset.values() ]
    }

    get allies(): Actor[] {
        return [ ...this.allyset.values() ]
    }

    get both(): Actor[] {
        return [ ...this.enemies, ...this.allies ]
    }

    get neutral(): Actor[] {
        return this.all.filter((actor: Actor): boolean => !this.both.includes(actor))
    }

    get skills(): string[] {
        return [ ...this.skillmap.keys() ]
    }

    private getAffiliatedActors(force: ActorForce): Actor[] {
        switch(force) {
            case 'all':             return this.all
            case 'all-except-me':   return this.except
            case 'allies':          return this.allies
            case 'enemies':         return this.enemies
            case 'both':            return this.both
            case 'neutral':         return this.neutral
            default:                return []
        }
    }

    private getActorInArea(x: number, y: number, radius: number, actors?: Actor[], sortByDistance?: boolean): Actor[] {
        if (!this.actor) return []
        return this.actor.plugin.getActorsInArea(x, y, radius, actors, sortByDistance)
    }

    private getHit(from: Actor, information: HitInformation): void {
        if (!this.actor) return
        this.attackerset.add(from)
        this.emit('get-hit', from, information)
    }

    private hit(key: string, targets: Actor[]): void {
        if (!this.actor)                return
        if (!this.skillmap.has(key))    return

        const getInformation = this.skillmap.get(key)!
        for (const target of targets) {
            const information: HitInformation = getInformation(target, this.actor.dot)
            this.emit('hit', target, information)
            target.battle.getHit(this.actor, information)
        }
    }

    private forgetMe(): void {
        if (!this.actor) return
        for (const actor of this.actor.plugin.actors) {
            actor.battle.attackerset.delete(this.actor)
            actor.battle.enemyset.delete(this.actor)
            actor.battle.allyset.delete(this.actor)
        }
    }

    /**
     * 액터에 새로운 스킬을 지정합니다.
     * @param key 
     * @param callback 
     */
    addSkill(key: string, callback: HitCallback): this {
        this.skillmap.set(key, callback)
        return this
    }

    deleteSkill(key: string): this {
        this.skillmap.delete(key)
        return this
    }

    /** @alias useSkill for onlyAllies */
    useBuff(key: string, point: Vector2, radius: number = 1): this {
        this.useSkill(key, point, radius, 'allies')
        return this
    }

    /** @alias useSkill for onlyEnemies */
    useDebuff(key: string, point: Vector2, radius: number = 1): this {
        this.useSkill(key, point, radius, 'enemies')
        return this
    }

    /**
     * 
     * @param key 
     * @param point 
     * @param radius 
     * @param force 
     */
    useSkill(key: string, point: Vector2, radius: number = 1, force: ActorForce = 'all'): this {
        if (!this.actor) {
            return this
        }

        const { x, y }                  = point
        const targets                   = this.getAffiliatedActors(force)
        const validTargets: Actor[]     = this.getActorInArea(x, y, radius, targets, true)

        this.hit(key, validTargets)
        return this
    }

    /** 액터의 적 목록을 모두 제거합니다. */
    clearEnemy(): this {
        this.enemyset.clear()
        return this
    }

    /** 액터의 아군 목록을 모두 제거합니다. */
    clearAlly(): this {
        this.allyset.clear()
        return this
    }

    /**
     * 액터의 적 목록을 지정합니다. 기존에 지정된 적 목록은 초기화됩니다.
     * @param enemies 적 액터입니다.
     */
    setEnemy(...enemies: Actor[]): this {
        if (!this.actor) {
            return this
        }
        
        this.clearEnemy()
        for (const enemy of enemies) {
            this.enemyset.add(enemy)
        }
        this.enemyset.delete(this.actor)
        return this
    }

    /**
     * 액터의 아군 목록을 지정합니다. 기존에 지정된 아군 목록은 초기화됩니다.
     * @param allies 아군 액터입니다.
     */
    setAlly(...allies: Actor[]): this {
        if (!this.actor) {
            return this
        }

        this.clearAlly()
        for (const ally of allies) {
            this.allyset.add(ally)
        }
        this.allyset.delete(this.actor)
        return this
    }

    /**
     * 액터의 적 목록을 추가합니다. 이미 추가된 액터라면 추가되지 않습니다.
     * @param enemies 적 액터입니다.
     */
    addEnemy(...enemies: Actor[]): this {
        if (!this.actor) {
            return this
        }
        for (const enemy of enemies) {
            this.enemyset.add(enemy)
        }
        this.deleteAlly(...enemies)
        this.enemyset.delete(this.actor)
        return this
    }

    /**
     * 액터의 아군 목록을 추가합니다. 이미 추가된 액터라면 추가되지 않습니다.
     * @param allies 아군 액터입니다.
     */
    addAlly(...allies: Actor[]): this {
        if (!this.actor) {
            return this
        }
        for (const ally of allies) {
            this.allyset.add(ally)
        }
        this.deleteEnemy(...allies)
        this.allyset.delete(this.actor)
        return this
    }

    /**
     * 적 목록에서 해당 액터를 제거합니다.
     * @param enemies 목록에서 제거할 액터입니다.
     */
    deleteEnemy(...enemies: Actor[]): this {
        if (!this.actor) {
            return this
        }
        for (const enemy of enemies) {
            this.enemyset.delete(enemy)
        }
        return this
    }

    /**
     * 아군 목록에서 해당 액터를 제거합니다.
     * @param allies 목록에서 제거할 액터입니다.
     */
    deleteAlly(...allies: Actor[]): this {
        if (!this.actor) {
            return this
        }
        for (const ally of allies) {
            this.allyset.delete(ally)
        }
        return this
    }

    /**
     * 전투의 패배를 선언합니다. 자신을 공격하고 있던 액터들은 승리하게 될 것입니다.
     * 자신을 공격하던 액터의 적 목록에서 자신이 제거됩니다.
     */
    defeat(): this {
        if (!this.actor) {
            return this
        }
        for (const attacker of this.attackerset) {
            attacker.battle.emit('win', this.actor)
            attacker.battle.deleteEnemy(this.actor)
        }
        this.emit('defeat', [ ...this.attackerset ])
        this.attackerset.clear()
        return this
    }

    private destroy(): void {
        this.forgetMe()
        this.actor = null
    }
}