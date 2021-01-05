import Phaser from 'phaser'
import { createIsometricDiamondPoints, getIsometricSide, GridObject } from '@common/Math/MathUtil'
import { Plugin as ActorPlugin } from '../eriengine-core-plugin-actor'
import { ActorBattle } from './ActorBattle'
import { ActorRun } from './ActorRun'
import { ActorDot } from './ActorDot'
import { ActorBubble } from './ActorBubble'
import { ActorParticle } from './ActorParticle'

export abstract class Actor extends Phaser.Physics.Matter.Sprite implements GridObject {
    plugin!: ActorPlugin
    readonly battle: ActorBattle        = new ActorBattle(this)
    readonly bubble: ActorBubble        = new ActorBubble(this)
    readonly particle: ActorParticle    = new ActorParticle(this)
    readonly run: ActorRun              = new ActorRun(this)
    readonly dot: ActorDot              = new ActorDot(this)

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string|Phaser.Textures.Texture, frame?: string|number, option?: Phaser.Types.Physics.Matter.MatterBodyConfig) {
        super(scene.matter.world, x, y, texture, frame, option)
        this.initVertices()

        return new Proxy(this, {
            set: this.PROXY_SETTER.bind(this)
        })
    }

    private get isCameraFollowing(): boolean {
        return this.scene.cameras.main._follow === this
    }

    get matterBody(): MatterJS.BodyType {
        return this.body as MatterJS.BodyType
    }

    get side(): number {
        const xHalf: number = this.displayWidth / 2
        return getIsometricSide(xHalf) * 2
    }

    protected PROXY_SETTER(target: Actor, prop: keyof Actor, value: any): true {
        (target as any)[prop] = value
        switch(prop) {
            case 'scale':
            case 'scaleX':
            case 'scaleY':
            case 'width':
            case 'height':
            case 'displayWidth':
            case 'displayHeight':
                this.initVertices()
                break
        }
        return true
    }

    protected createVertices(): MatterJS.Vector[] {
        const points = createIsometricDiamondPoints(this.displayWidth)
        const vertices = this.scene.matter.vertices.create(points, this.matterBody)
        return vertices
    }

    protected initVertices(): void {
        this.scene.matter.body.setVertices(this.matterBody, this.createVertices())
        this.scene.matter.body.setInertia(this.matterBody, Infinity)
        this.setOrigin(0.5, (this.displayHeight - this.displayWidth / 4) / this.displayHeight)
    }

    __initPlugin(plugin: ActorPlugin): void {
        this.plugin = plugin

        const updateBound = (time: number, delta: number): void => {
            if (this.active) {
                this.update(time, delta)
                this.updateDefaultPlugins(time, delta)
                this.sortDepth()
            }
        }
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, updateBound)

        this.on(Phaser.GameObjects.Events.DESTROY, () => {
            this.scene.events.off(Phaser.Scenes.Events.UPDATE, updateBound)
            this.end()
            this.stopFollowCamera()
            this.destroyDefaultPlugins()
            this.plugin.dropActor(this)
        })
    }

    /**
     * 이 액터를 기준으로 주변에 다른 액터를 탐색하여, 찾은 모든 액터를 배열로 반환합니다.
     * 자신은 제외됩니다.
     * @param radius 검색할 반경입니다.
     * @param actors 검색할 리스트입니다. 기본값으로 씬의 모든 Actor 인스턴스가 포함됩니다.
     * @param sortByDistance 검색된 리스트를 액터의 좌표로부터 가까운 순서대로 정렬해서 반환할 것인지 여부를 지정합니다.
     */
    getAroundActors(radius: number, actors: Actor[] = this.plugin.actors, sortByDistance: boolean = false): Actor[] {
        const { x, y } = this
        const list: Actor[] = this.plugin.getActorsInArea(x, y, radius, actors, sortByDistance)
        list.splice(list.indexOf(this), 1)
        return list
    }

    /** To be overridden by custom GameObjects. Allows base objects to be used in a Pool. */
    abstract start(): void
    abstract update(time: number, delta: number): void
    abstract end(): void

    private sortDepth(): void {
        this.setDepth(this.y)
    }

    private updateDefaultPlugins(time: number, delta: number): void {
        ActorDot.update(this.dot, time, delta)
        ActorRun.update(this.run, time, delta)
        ActorBubble.update(this.bubble, time, delta)
        ActorParticle.update(this.particle, time, delta)
    }

    private destroyDefaultPlugins(): void {
        ActorDot.destroy(this.dot)
        ActorRun.destroy(this.run)
        ActorBattle.destroy(this.battle)
        ActorBubble.destroy(this.bubble)
        ActorParticle.destroy(this.particle)
    }

    // Fix bug matter.js setStatic removes body issue (#https://github.com/liabru/matter-js/issues/641)
    /**
     * Changes the physics body to be either static `true` or dynamic `false`.
     * @param value `true` to set the body as being static, or `false` to make it dynamic.
     */
    setStatic(value: boolean): this {
        if (value === this.isStatic()) {
            return this
        }
        super.setStatic(value)
        return this
    }

    followCamera(zoom: number = 1, duration: number = 300, lerpX: number = 1, lerpY: number = lerpX): this {
        this.scene.cameras.main.zoomTo(zoom, duration, Phaser.Math.Easing.Expo.Out).startFollow(this, undefined, lerpX, lerpY)
        return this
    }

    stopFollowCamera(): this {
        if (this.isCameraFollowing) {
            this.scene.cameras.main.stopFollow()
        }
        return this
    }
}