import Phaser from 'phaser'
import { isInsideFromCircle, getDistanceBetween } from '@common/Math/MathUtil'
import { base64Load } from '@common/Phaser/AssetLoader'
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
    'EMBARRASS'     = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_EMBARRASS__',
    'HAPPY'         = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_HAPPY__',
    'LIKE'          = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_LIKE__',
    'LOVE'          = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_LOVE__',
    'SHAME'         = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_SHAME__',
    'SLEEP'         = '__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_SLEEP__',
}

// type ArgumentTypes<T> = T extends new (...a: infer A) => any? A : [] 

class Plugin extends Phaser.Plugins.ScenePlugin {
    private actorset: Set<Actor> = new Set

    private static generateTexture(scene: Phaser.Scene): void {
        base64Load(scene, BubbleEmotion['?'], bubbleQuestion)
        base64Load(scene, BubbleEmotion['!'], bubbleExclamation)
        base64Load(scene, BubbleEmotion['AHA'], bubbleAha)
        base64Load(scene, BubbleEmotion['ANGRY'], bubbleAngry)
        base64Load(scene, BubbleEmotion['ANNOY'], bubbleAnnoy)
        base64Load(scene, BubbleEmotion['DEPRESS'], bubbleDepress)
        base64Load(scene, BubbleEmotion['DOYA'], bubbleDoya)
        base64Load(scene, BubbleEmotion['ELLIPSIS'], bubbleEllipsis)
        base64Load(scene, BubbleEmotion['EMBARRASS'], bubbleEmbarrass)
        base64Load(scene, BubbleEmotion['HAPPY'], bubbleHappy)
        base64Load(scene, BubbleEmotion['LIKE'], bubbleLike)
        base64Load(scene, BubbleEmotion['LOVE'], bubbleLove)
        base64Load(scene, BubbleEmotion['SHAME'], bubbleShame)
        base64Load(scene, BubbleEmotion['SLEEP'], bubbleSleep)
    }

    get actors(): Actor[] {
        return [ ...this.actorset ]
    }

    private update(_time: number, _delta: number): void {
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

    /**
     * 씬에 액터를 추가합니다.
     * @param ActorClass 추가할 액터 클래스입니다. Actor 추상클래스를 상속받은 클래스입니다.
     * @param args `ActorClass`의 생성자 매개변수입니다.
     */
    addActor<T extends Actor, U extends { new (...args: any): T } = { new (...args: any): T }>(ActorClass: U, ...args: ConstructorParameters<U>) {
        const actor = new ActorClass(...Array.from(args))

        this.actorset.add(actor)
        this.scene.add.existing(actor)

        actor.__initPlugin(this)
        actor.start()

        return actor
    }

    /**
     * 씬에 추가된 액터를 플러그인에서 제거합니다.  
     * 액터는 플러그인에서 제거되며, 업데이트가 중단되지만 여전히 씬에는 존재합니다.
     * 만약 씬에서도 완전히 제거하고 싶다면, dropActor 메서드를 사용하지말고, 액터 인스턴스를 직접 파괴하십시오. `actor.destroy()`
     * @param actor 
     */
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