import Phaser from 'phaser'
import { isInsideFromCircle, getDistanceBetween } from '@common/Math/MathUtil'
import { Actor } from './Actor/Actor'

class Plugin extends Phaser.Plugins.ScenePlugin {
    private actorset: Set<Actor> = new Set

    constructor(scene: Phaser.Scene, pluginManager: Phaser.Plugins.PluginManager) {
        super(scene, pluginManager)
    }

    get actors(): Actor[] {
        return [ ...this.actorset ]
    }

    boot(): void {
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update.bind(this))
        this.scene.events.on(Phaser.Scenes.Events.DESTROY, this.destroy.bind(this))
    }

    private update(time: number, delta: number): void {
        for (const actor of this.actorset) {
            actor.update(time, delta)
        }
    }

    destroy(): void {
        for (const actor of this.actorset) {
            actor.destroy(true)
        }
    }

    add<Child extends Actor>(CustomActor: { new (...args: any): Child }, ...args: ConstructorParameters<typeof CustomActor>): Child {
        const actor = new CustomActor(...Array.from(args))

        this.actorset.add(actor)
        this.scene.add.existing(actor)

        actor.__initPlugin(this)
        actor.start()

        return actor
    }

    drop(actor: Actor): void {
        this.actorset.delete(actor)
    }

    /**
     * 특정 좌표를 기준으로 주어진 반경 내에 액터의 목록을 찾습니다.
     * 탐색된 모든 액터를 배열로 반환합니다.
     * @param x 검색할 x좌표입니다.
     * @param y 검색할 y좌표입니다.
     * @param radius 검색할 반경입니다. 주어진 x, y 좌표로부터 이 수치만큼의 반지름을 가진 원 내부에 있는 액터를 찾습니다.
     * @param actors 검색할 액터 목록입니다. 기본값은 씬에 소속된 모든 액터입니다.
     * @param sortByDistance 검색할 x, y 좌표로부터 가까운 순서대로 정렬하여 반환할지 여부를 지정합니다. 기본값은 false입니다.
     */
    getActorsInArea(x: number, y: number, radius: number, actors: Actor[] = this.actors, sortByDistance: boolean = false): Actor[] {
        const list: Actor[] = []
        for (const actor of actors) {
            const searched: boolean = isInsideFromCircle({ x, y }, { x: actor.x, y: actor.y }, radius)
            if (searched) list.push(actor)
        }
        if (sortByDistance) {
            list.sort((a: Actor, b: Actor): number => getDistanceBetween({ x, y }, a) - getDistanceBetween({ x, y }, b))
        }
        return list
    }
}

export { Actor, Plugin }