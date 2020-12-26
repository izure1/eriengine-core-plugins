import Phaser from 'phaser'
import { isInsideFromCircle, getDistanceBetween } from '@common/Math/MathUtil'
import { Actor } from './Actor/Actor'
import bubbleAha from '@assets/bubble-aha.png'
import bubbleAngry from '@assets/bubble-angry.png'
import bubbleAnnoy from '@assets/bubble-annoy.png'
import bubbleDepress from '@assets/bubble-depress.png'
import bubbleDoya from '@assets/bubble-doya.png'
import bubbleEllipsis from '@assets/bubble-ellipsis.png'
import bubbleEmbarrass from '@assets/bubble-embarrass.png'
import bubbleExclamation from '@assets/bubble-exclamation.png'
import bubbleHappy from '@assets/bubble-happy.png'
import bubbleLike from '@assets/bubble-like.png'
import bubbleLove from '@assets/bubble-love.png'
import bubbleQuestion from '@assets/bubble-question.png'
import bubbleShame from '@assets/bubble-shame.png'
import bubbleSleep from '@assets/bubble-sleep.png'

enum BubbleEmotion {
    '?'             = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_QUESTION__',
    '!'             = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_EXCLAMATION__',
    'AHA'           = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_AHA__',
    'ANGRY'         = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_ANGRY__',
    'ANNOY'         = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_ANNOY__',
    'DEPRESS'       = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_DEPRESS__',
    'DOYA'          = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_DOYA__',
    'ELLIPSIS'      = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_ELLIPSIS__',
    'EMBARRASS'     = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_EMBARRASSED__',
    'HAPPY'         = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_HAPPY__',
    'LIKE'          = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_LIKE__',
    'LOVE'          = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_LOVE__',
    'SHAME'         = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_SHAME__',
    'SLEEP'         = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_SLEEP__',
}

class Plugin extends Phaser.Plugins.ScenePlugin {
    private actorset: Set<Actor> = new Set

    private static isTextureGenerated: boolean = false

    private static generateTexture(scene: Phaser.Scene): void {
        if (Plugin.isTextureGenerated) {
            return
        }

        Plugin.isTextureGenerated = true
            
        // 이미지 로드
        scene.textures.addBase64(BubbleEmotion['?'], bubbleQuestion)
        scene.textures.addBase64(BubbleEmotion['!'], bubbleExclamation)
        scene.textures.addBase64(BubbleEmotion.AHA, bubbleAha)
        scene.textures.addBase64(BubbleEmotion.ANGRY, bubbleAngry)
        scene.textures.addBase64(BubbleEmotion.ANNOY, bubbleAnnoy)
        scene.textures.addBase64(BubbleEmotion.DEPRESS, bubbleDepress)
        scene.textures.addBase64(BubbleEmotion.DOYA, bubbleDoya)
        scene.textures.addBase64(BubbleEmotion.ELLIPSIS, bubbleEllipsis)
        scene.textures.addBase64(BubbleEmotion.EMBARRASS, bubbleEmbarrass)
        scene.textures.addBase64(BubbleEmotion.HAPPY, bubbleHappy)
        scene.textures.addBase64(BubbleEmotion.LIKE, bubbleLike)
        scene.textures.addBase64(BubbleEmotion.LOVE, bubbleLove)
        scene.textures.addBase64(BubbleEmotion.SHAME, bubbleShame)
        scene.textures.addBase64(BubbleEmotion.SLEEP, bubbleSleep)
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
    }

    destroy(): void {
        for (const actor of this.actorset) {
            actor.destroy()
        }
    }

    addActor<Child extends Actor>(CustomActor: { new (...args: any): Child }, ...args: ConstructorParameters<typeof CustomActor>): Child {
        const actor = new CustomActor(...Array.from(args))

        this.actorset.add(actor)
        this.scene.add.existing(actor)

        actor.__initPlugin(this)
        actor.start()

        return actor
    }

    dropActor(actor: Actor): void {
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