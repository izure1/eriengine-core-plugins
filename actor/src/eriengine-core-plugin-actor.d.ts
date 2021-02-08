import Phaser from 'phaser';
import { Actor } from './Actor/Actor';
declare enum BubbleEmotion {
    '?' = "__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_QUESTION__",
    '!' = "__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_EXCLAMATION__",
    'AHA' = "__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_AHA__",
    'ANGRY' = "__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_ANGRY__",
    'ANNOY' = "__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_ANNOY__",
    'DEPRESS' = "__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_DEPRESS__",
    'DOYA' = "__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_DOYA__",
    'ELLIPSIS' = "__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_ELLIPSIS__",
    'EMBARRASS' = "__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_EMBARRASS__",
    'HAPPY' = "__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_HAPPY__",
    'LIKE' = "__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_LIKE__",
    'LOVE' = "__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_LOVE__",
    'SHAME' = "__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_SHAME__",
    'SLEEP' = "__ERIENGINE_CORE_PLUGIN_ACTOR_BUBBLE_EMOTION_KEY_SLEEP__"
}
declare class Plugin extends Phaser.Plugins.ScenePlugin {
    private actorset;
    private static generateTexture;
    constructor(scene: Phaser.Scene, pluginManager: Phaser.Plugins.PluginManager);
    get actors(): Actor[];
    private update;
    boot(): void;
    destroy(): void;
    addActor<Child extends Actor>(CustomActor: {
        new (...args: any): Child;
    }, ...args: ConstructorParameters<typeof CustomActor>): Child;
    dropActor(actor: Actor): void;
    /**
     * 특정 좌표를 기준으로 주어진 반경 내에 액터의 목록을 찾습니다.
     * 탐색된 모든 액터를 배열로 반환합니다.
     * @param x 검색할 x좌표입니다.
     * @param y 검색할 y좌표입니다.
     * @param radius 검색할 반경입니다. 주어진 x, y 좌표로부터 이 수치만큼의 반지름을 가진 원 내부에 있는 액터를 찾습니다.
     * @param actors 검색할 액터 목록입니다. 기본값은 씬에 소속된 모든 액터입니다.
     * @param sortByDistance 검색할 x, y 좌표로부터 가까운 순서대로 정렬하여 반환할지 여부를 지정합니다. 기본값은 false입니다.
     */
    getActorsInArea(x: number, y: number, radius: number, actors?: Actor[], sortByDistance?: boolean): Actor[];
}
export { Actor, Plugin, BubbleEmotion };
