import { TypedEmitter } from 'tiny-typed-emitter'
import { Actor } from './Actor'
import { ActorDot } from './ActorDot'
import { Vector2 } from '@common/Math/MathUtil'

export type ActorForce = 'all'|'me'|'all-except-me'|'allies'|'enemies'|'both'|'neutral'
export interface HitInformation {
  name?: string
  isMiss?: boolean
  isImmunity?: boolean
  isDot?: boolean
  damage?: number
  heal?: number
  duration?: number
  [key: string]: any
}
export type HitCallback = (targets: Actor, dot: ActorDot) => HitInformation

interface ActorBattleEvent {
  'hit':      (target: Actor, information: HitInformation) => void
  'get-hit':  (from: Actor, information: HitInformation) => void
  'win':      (from: Actor) => void
  'defeat':   (froms: Actor[]) => void
}

export class ActorBattle extends TypedEmitter<ActorBattleEvent> {
  private readonly actor: Actor
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

  /** 해당 액터 인스턴스가 속한 씬의 모든 액터를 반환합니다. */
  private get actors(): Actor[] {
    return this.actor.plugin.actors
  }

  /** 씬에 추가된 모든 액터를 반환합니다. */
  get all(): Actor[] {
    return this.actors
  }

  get me(): Actor[] {
    return [ this.actor ]
  }

  /** 해당 인스턴스를 제외한 씬에 추가된 모든 액터를 반환합니다. */
  get except(): Actor[] {
    return this.all.filter((actor: Actor): boolean => actor.battle !== this.actor?.battle)
  }

  /** 해당 인스턴스가 `setEnemy` 메서드로 적으로 설정한 모든 액터를 반환합니다. */
  get enemies(): Actor[] {
    return [ ...this.enemyset.values() ]
  }

  /** 해당 인스턴스가 `setAlly` 메서드로 아군으로 설정한 모든 액터를 반환합니다. */
  get allies(): Actor[] {
    return [ ...this.allyset.values() ]
  }

  /** 해당 인스턴스가 `setAlly`, `setEnemy` 메서드로 설정한 모든 아군, 또는 적 액터를 반환합니다. */
  get both(): Actor[] {
    return [ ...this.enemies, ...this.allies ]
  }

  /** 해당 인스턴스가 `setAlly`, `setEnemy` 메서드로 설정하지 않은 씬에 추가된 모든 중립 액터를 반환합니다. */
  get neutral(): Actor[] {
    return this.all.filter((actor: Actor): boolean => !this.both.includes(actor))
  }

  /** 해당 인스턴스에 추가된 모든 스킬 키 목록을 반환합니다. */
  get skills(): string[] {
    return [ ...this.skillmap.keys() ]
  }

  /**
   * 해당 액터 인스턴스가 속한 씬에 추가된 액터 중, 세력에 속한 액터 목록을 반환합니다.
   * @param force 세력 정보입니다.
   */
  private getAffiliatedActors(force: ActorForce): Actor[] {
    switch(force) {
      case 'all':             return this.all
      case 'me':              return this.me
      case 'all-except-me':   return this.except
      case 'allies':          return this.allies
      case 'enemies':         return this.enemies
      case 'both':            return this.both
      case 'neutral':         return this.neutral
      default:                return []
    }
  }

  /**
   * 해당 좌표를 중심으로 반지름 내에 있는 모든 액터를 찾아 반환합니다.
   * @param x 검색할 x좌표입니다.
   * @param y 검색할 y좌표입니다.
   * @param radius 검색할 반지름 반경입니다. 주어진 `x`, `y` 좌표로부터 이 수치만큼의 반지름을 가진 원 내부에 있는 액터를 찾습니다.
   * @param actors 검색할 액터 목록입니다. 기본값은 해당 액터 인스턴스가 속한 씬의 모든 액터 목록입니다.
   * @param sortByDistance 검색 결과를 주어진 `x`, `y` 좌표를 기준으로 가까운 순서로 정렬할지 여부를 결정합니다. 기본값은 `false`입니다.
   */
  private getActorInArea(x: number, y: number, radius: number, actors?: Actor[], sortByDistance?: boolean): Actor[] {
    return this.actor.plugin.getActorsInArea(x, y, radius, actors, sortByDistance)
  }

  /**
   * 액터가 스킬에 적중했을 때 호출될 메서드입니다. 자동으로 호출되며, *직접 호출하지 마십시오.*
   * @param from 스킬을 사용한 액터 인스턴스입니다.
   * @param information 사용한 스킬의 정보입니다.
   */
  private getHit(from: Actor, information: HitInformation): void {
    if (this.actor !== from) {
      this.attackerset.add(from)
    }

    this.emit('get-hit', from, information)
  }

  /**
   * 액터가 스킬을 적중시켰을 때 호출될 메서드입니다. 자동으로 호출되며, *직접 호출하지 마십시오.*
   * @param skillKey 사용한 스킬 키입니다.
   * @param targets 스킬에 적중한 액터 목록입니다.
   */
  private hit(skillKey: string, targets: Actor[]): void {
    if (!this.skillmap.has(skillKey)) {
      return
    }

    const getInformation = this.skillmap.get(skillKey)!
    for (const target of targets) {
      const information = getInformation(target, this.actor.dot)

      this.emit('hit', target, information)

      target.battle.getHit(this.actor, information)
    }
  }

  /**
   * 해당 액터 인스턴스가 아군, 또는 적으로 설정한 모든 액터를 제거합니다.
   */
  private forgetAll(): void {
    this.attackerset.clear()
    this.enemyset.clear()
    this.allyset.clear()
  }

  /**
   * 해당 액터 인스턴스를 아군, 또는 적으로 설정한 모든 액터들로부터 자신을 제거합니다.
   * 교전 도중에 이 메서드를 호출하면 해당 액터 인스턴스와 교전 중이던 액터들은 공격자 목록에서 자신을 제거합니다.
   */
  private forgetMe(): void {
    for (const actor of this.actor.plugin.actors) {
      actor.battle.attackerset.delete(this.actor)
      actor.battle.enemyset.delete(this.actor)
      actor.battle.allyset.delete(this.actor)
    }
  }

  /**
   * 액터에 새로운 스킬을 지정합니다.
   * @param key 스킬 키입니다. 다른 스킬과 중복되어선 안됩니다.
   * @param callback 스킬을 사용했을 때 호출될 함수입니다.
   */
  addSkill(key: string, callback: HitCallback): this {
    this.skillmap.set(key, callback)

    return this
  }

  /**
   * 액터에 추가된 스킬을 제거합니다.
   * @param key 제거할 스킬 키입니다.
   */
  deleteSkill(key: string): this {
    this.skillmap.delete(key)
    
    return this
  }

  /** @alias useSkill for me */
  useBuffForMe(key: string, point: Vector2, radius: number = 1): this {
    this.useSkill(key, point, radius, 'me')
    
    return this
  }

  /** @alias useSkill for allies */
  useBuff(key: string, point: Vector2, radius: number = 1): this {
    this.useSkill(key, point, radius, 'allies')

    return this
  }

  /** @alias useSkill for enemies */
  useDebuff(key: string, point: Vector2, radius: number = 1): this {
    this.useSkill(key, point, radius, 'enemies')

    return this
  }

  /**
   * 해당 위치에 스킬을 사용합니다.
   * @param key 사용할 스킬 키입니다.
   * @param point 스킬을 사용할 좌표입니다.
   * @param radius 스킬의 효과를 받을 반경 반지름입니다. `point` 좌표를 기준으로 이 반경 내에 있는 모든 액터는 스킬의 효과를 받습니다. 기본값은 `1`입니다.
   * @param force 이 스킬이 적중할 대상 세력입니다. 만약 스킬이 적 액터에게만 적중하게 하고 싶다면, `enemies`로 설정하십시오. 기본값은 `all`입니다. 
   */
  useSkill(key: string, point: Vector2, radius: number = 1, force: ActorForce = 'all'): this {
    const { x, y }      = point
    const targets       = this.getAffiliatedActors(force)
    const validTargets  = this.getActorInArea(x, y, radius, targets, true)

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
    for (const ally of allies) {
      this.allyset.delete(ally)
    }
    
    return this
  }

  /**
   * 전투의 패배를 선언합니다. 자신을 공격하고 있던 액터들은 승리하게 될 것입니다.
   * 자신을 공격하던 액터의 적 목록에서 자신이 제거됩니다.
   * 그러나 `setEnemy` 메서드로 자신을 적으로 등록한 모든 상대 액터가 승리하는 것은 아니며, `useSkill` 메서드로 공격한 액터만이 승리합니다.
   */
  defeat(): this {
    for (const attacker of this.attackerset) {
      attacker.battle.emit('win', this.actor)
      attacker.battle.deleteEnemy(this.actor)
    }

    this.emit('defeat', [ ...this.attackerset ])

    this.attackerset.clear()

    return this
  }

  private destroy(): void {
    this.forgetAll()
    this.forgetMe()
  }
}