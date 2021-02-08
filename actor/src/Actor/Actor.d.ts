/// <reference types="./matter" />
import Phaser from 'phaser';
import { GridObject } from "../../../@common/Math/MathUtil";
import { Plugin as ActorPlugin } from '../eriengine-core-plugin-actor';
import { ActorBattle } from './ActorBattle';
import { ActorRun } from './ActorRun';
import { ActorDot } from './ActorDot';
import { ActorBubble } from './ActorBubble';
import { ActorParticle } from './ActorParticle';
export declare abstract class Actor extends Phaser.Physics.Matter.Sprite implements GridObject {
    plugin: ActorPlugin;
    readonly battle: ActorBattle;
    readonly bubble: ActorBubble;
    readonly particle: ActorParticle;
    readonly run: ActorRun;
    readonly dot: ActorDot;
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string | Phaser.Textures.Texture, frame?: string | number, option?: Phaser.Types.Physics.Matter.MatterBodyConfig);
    private get isCameraFollowing();
    get matterBody(): MatterJS.BodyType;
    get side(): number;
    protected PROXY_SETTER(target: Actor, prop: keyof Actor, value: any): true;
    protected createVertices(): MatterJS.Vector[];
    protected initVertices(): void;
    __initPlugin(plugin: ActorPlugin): void;
    /**
     * 이 액터를 기준으로 주변에 다른 액터를 탐색하여, 찾은 모든 액터를 배열로 반환합니다.
     * 자신은 제외됩니다.
     * @param radius 검색할 반경입니다.
     * @param actors 검색할 리스트입니다. 기본값으로 씬의 모든 Actor 인스턴스가 포함됩니다.
     * @param sortByDistance 검색된 리스트를 액터의 좌표로부터 가까운 순서대로 정렬해서 반환할 것인지 여부를 지정합니다.
     */
    getAroundActors(radius: number, actors?: Actor[], sortByDistance?: boolean): Actor[];
    /** To be overridden by custom GameObjects. Allows base objects to be used in a Pool. */
    abstract start(): void;
    abstract update(time: number, delta: number): void;
    abstract end(): void;
    private sortDepth;
    private updateDefaultPlugins;
    private destroyDefaultPlugins;
    /**
     * Changes the physics body to be either static `true` or dynamic `false`.
     * @param value `true` to set the body as being static, or `false` to make it dynamic.
     */
    setStatic(value: boolean): this;
    followCamera(zoom?: number, duration?: number, lerpX?: number, lerpY?: number): this;
    stopFollowCamera(): this;
}
