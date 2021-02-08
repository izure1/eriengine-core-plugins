import { TypedEmitter } from 'tiny-typed-emitter';
import { Actor } from './Actor';
import { ActorDot } from './ActorDot';
import { Vector2 } from "../../../@common/Math/MathUtil";
export declare type ActorForce = 'all' | 'all-except-me' | 'allies' | 'enemies' | 'both' | 'neutral';
export interface HitInformation {
    name?: string;
    isMiss?: boolean;
    isImmunity?: boolean;
    isDot?: boolean;
    damage?: number;
    heal?: number;
    duration?: number;
    [key: string]: any;
}
export declare type HitCallback = (targets: Actor, dot: ActorDot) => HitInformation;
export interface EventParameter {
    'hit': (target: Actor, information: HitInformation) => void;
    'get-hit': (from: Actor, information: HitInformation) => void;
    'win': (from: Actor) => void;
    'defeat': (froms: Actor[]) => void;
}
export declare class ActorBattle extends TypedEmitter<EventParameter> {
    private actor;
    private readonly skillmap;
    private readonly enemyset;
    private readonly allyset;
    private readonly attackerset;
    static destroy(battle: ActorBattle): void;
    constructor(actor: Actor);
    private get scene();
    private get actors();
    get all(): Actor[];
    get except(): Actor[];
    get enemies(): Actor[];
    get allies(): Actor[];
    get both(): Actor[];
    get neutral(): Actor[];
    get skills(): string[];
    private getAffiliatedActors;
    private getActorInArea;
    private getHit;
    private hit;
    private forgetMe;
    /**
     * 액터에 새로운 스킬을 지정합니다.
     * @param key
     * @param callback
     */
    addSkill(key: string, callback: HitCallback): this;
    deleteSkill(key: string): this;
    /** @alias useSkill for onlyAllies */
    useBuff(key: string, point: Vector2, radius?: number): this;
    /** @alias useSkill for onlyEnemies */
    useDebuff(key: string, point: Vector2, radius?: number): this;
    /**
     *
     * @param key
     * @param point
     * @param radius
     * @param force
     */
    useSkill(key: string, point: Vector2, radius?: number, force?: ActorForce): this;
    /** 액터의 적 목록을 모두 제거합니다. */
    clearEnemy(): this;
    /** 액터의 아군 목록을 모두 제거합니다. */
    clearAlly(): this;
    /**
     * 액터의 적 목록을 지정합니다. 기존에 지정된 적 목록은 초기화됩니다.
     * @param enemies 적 액터입니다.
     */
    setEnemy(...enemies: Actor[]): this;
    /**
     * 액터의 아군 목록을 지정합니다. 기존에 지정된 아군 목록은 초기화됩니다.
     * @param allies 아군 액터입니다.
     */
    setAlly(...allies: Actor[]): this;
    /**
     * 액터의 적 목록을 추가합니다. 이미 추가된 액터라면 추가되지 않습니다.
     * @param enemies 적 액터입니다.
     */
    addEnemy(...enemies: Actor[]): this;
    /**
     * 액터의 아군 목록을 추가합니다. 이미 추가된 액터라면 추가되지 않습니다.
     * @param allies 아군 액터입니다.
     */
    addAlly(...allies: Actor[]): this;
    /**
     * 적 목록에서 해당 액터를 제거합니다.
     * @param enemies 목록에서 제거할 액터입니다.
     */
    deleteEnemy(...enemies: Actor[]): this;
    /**
     * 아군 목록에서 해당 액터를 제거합니다.
     * @param allies 목록에서 제거할 액터입니다.
     */
    deleteAlly(...allies: Actor[]): this;
    /**
     * 전투의 패배를 선언합니다. 자신을 공격하고 있던 액터들은 승리하게 될 것입니다.
     * 자신을 공격하던 액터의 적 목록에서 자신이 제거됩니다.
     */
    defeat(): this;
    private destroy;
}
