import Phaser from 'phaser'
import { isInsideFromCircle, getDistanceBetween } from '@common/Math/MathUtil'
import { Actor } from './Actor/Actor'
import bubbleTexture from '@assets/bg-bubble.png'
import bubbleExclamation from '@assets/ico-bubble-exclamation.png'

enum BubbleEmotion {
    BUBBLE          = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_BUBBLE__',
    EXCLAMATION     = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_EXCLAMATION__', // 느낌표
    QUESTION        = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_QUESTION__', // 의문
    ELLIPSIS        = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_ELLIPSIS__', // 말줄임
    LIKE            = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_LIKE__', // 좋아함
    AHA             = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_AHA__', // 깨달음 (전구)
    EMBARRASSED     = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_EMBARRASSED__', // 당황함 (땀)
    ANNOY           = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_ANNOY__', // 속상함 (골머리)
    ANGRY           = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_ANGRY__', // 화남 (빡친표시)
    HAPPY           = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_HAPPY__', // 즐거움 (음표)
    SLEEP           = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_SLEEP__', // 졸림
    SHAME           = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_SHAME__', // 부끄러움
    DEPRESS         = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_DEPRESS__', // 우울 (동숲)
}

class Plugin extends Phaser.Plugins.ScenePlugin {
    private actorset: Set<Actor> = new Set

    private static isTextureGenerated: boolean = false
    private static generateTexture(scene: Phaser.Scene): void {
        if (Plugin.isTextureGenerated) {
            return
        }

        Plugin.isTextureGenerated = true

        scene.textures.addBase64(BubbleEmotion.BUBBLE, bubbleTexture)
        scene.textures.addBase64(BubbleEmotion.EXCLAMATION, bubbleExclamation)

        scene.textures.on(Phaser.Textures.Events.LOAD, (key: string): void => {
            switch(key) {
                case BubbleEmotion.EXCLAMATION:
                    Plugin.generateAnimation(scene, key, 0, 6, 7, 1)
                    break
            }
        })
    }

    private static generateAnimation(scene: Phaser.Scene, key: string, start: number, end: number, frameRate: number, repeat: number): void {
        if (scene.anims.exists(key)) {
            return
        }
        const frames = scene.anims.generateFrameNumbers(key, { start, end })
        scene.anims.create({ key, frames, frameRate, repeat })
    }

    constructor(scene: Phaser.Scene, pluginManager: Phaser.Plugins.PluginManager) {
        super(scene, pluginManager)
    }

    get actors(): Actor[] {
        return [ ...this.actorset ]
    }

    private update(time: number, delta: number): void {
    }

    boot(): void {
        Plugin.generateTexture(this.scene)
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update.bind(this))
        this.scene.events.on(Phaser.Scenes.Events.DESTROY, this.destroy.bind(this))
        //this.scene.events.once(Phaser.Scenes.Events.CREATE, this.generateTexture.bind(this))
    }

    destroy(): void {
        for (const actor of this.actorset) {
            actor.destroy()
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

export { Actor, Plugin, BubbleEmotion }