import Phaser from 'phaser'
import { TypedEmitter } from 'tiny-typed-emitter'
import { DialogueScene } from './Dialogue/DialogueScene'
import { Point2 } from '@common/Math/MathUtil'

interface PluginEvent {
    'say-typing-start': () => void
    'say-typing':       (text: string) => void
    'say-typing-done':  (text: string) => void
    'say-finish':       () => void
}

class Plugin extends Phaser.Plugins.BasePlugin {
    private scene: DialogueScene|null = null
    readonly events: TypedEmitter<PluginEvent> = new TypedEmitter

    constructor(pluginManager: Phaser.Plugins.PluginManager) {
        super(pluginManager)
    }

    init(): void {
        this.game.events.once(Phaser.Core.Events.READY, (): void => {
            this.generateScene()
        })
    }

    /** 대사창을 위한 새로운 씬을 생성합니다. 자동으로 호출되며, *절대 직접 호출하지 마십시오.* */
    private generateScene(): void {
        if (this.scene) {
            return
        }
        const sceneKey: string = '__ERIENGINE_CORE_PLUGIN_DIALOGUE_SCENE_KEY__'
        this.scene = this.game.scene.add(sceneKey, DialogueScene, true) as DialogueScene
    }

    /**
     * 대사창에 대사를 출력합니다. 대사는 타이핑으로 출력됩니다. 생성한 캐릭터 키를 사용하여 화면에 캐릭터 이미지를 보여줄 수 있습니다.
     * @param characterKey 캐릭터 키입니다. 이 값을 `null`로 선택하면 캐릭터 이미지를 보여주지 않습니다.
     * @param text 보여줄 텍스트입니다.
     * @param speed 대사 한 글자가 타이핑되는데 걸리는 시간(ms)입니다. 기본값은 `15`입니다.
     * @param autoClean 대사가 모두 출력되면 자동으로 사라지는데까지 걸리는 시간(ms)입니다. 이 값을 음수로 설정하면 대사가 전부 출력된 사라지지 않습니다. 기본값은 `2500`입니다.
     */
    say(characterKey: string|null, text: string, speed?: number, autoClean?: number): this {
        if (!this.scene) {
            return this
        }
        this.scene.say(characterKey, text, speed, autoClean)
        return this
    }

    /**
     * `say` 메서드로 출력 중인 대사를 중단합니다.
     * 보여지는 캐릭터와 대사 모두 화면에서 사라집니다.
     */
    stop(): this {
        if (!this.scene) {
            return this
        }
        this.scene.stop()
        return this
    }

    /** `say` 메서드로 출력 중인 대사의 타이핑 효과를 종료하고, 즉시 모든 텍스트를 보여줍니다. */
    skip(): this {
        if (!this.scene) {
            return this
        }
        this.scene.skip()
        return this
    }

    /**
     * `say` 메서드로 출력 중인 대사와 캐릭터를 정리합니다.
     * 이는 `say` 메서드의 `autoClean` 매개변수를 음수로 사용하여, 수동으로 정리해야할 경우 사용됩니다.
     * 만약 대사가 출력 도중이었다면, 즉시 대사가 종료됩니다.
     * @param withCharacters 캐릭터 이미지도 함께 사라질지 여부를 지정합니다. 기본값은 `false`입니다.
     */
    clean(withCharacters?: boolean): this {
        if (!this.scene) {
            return this
        }
        this.scene.clean(withCharacters)
        return this
    }

    /**
     * 대사창에 보여줄 캐릭터를 등록합니다.
     * 이후에 `say` 메서드에서 `characterKey` 매개변수에 등록한 키를 사용하여 손쉽게 이미지를 보여줄 수 있습니다.
     * 캐릭터의 고유키는 아무 값이나 사용할 수 없으며, `scene.textures`에 등록된 텍스쳐 이미지 키만 사용할 수 있습니다.
     * 즉, 보여질 이미지는 이전에 씬에서 로드해야 합니다.
     * @example
     * ```
     * class Scene extends Phaser.Scene {
     * 
     *   preload() {
     *     this.load.image('my-character-key', myCharacterKeyURI)
     *   }
     * 
     *   create() {
     *     this.dialoguePlugin.addCharacter('my-character-key', 100, 100)
     *     this.dialoguePlugin.showCharacter('my-character-key')
     *   }
     * 
     * }
     * ```
     * @param key 캐릭터 고유키입니다.
     * @param x 캐릭터를 보여줄 화면의 x좌표입니다.
     * @param y 캐릭터를 보여줄 화면의 y좌표입니다.
     * @param width 캐릭터 이미지의 가로 너비입니다. 기본값은 이미지의 가로 너비입니다.
     * @param height 캐릭터 이미지의 세로 높이입니다. 기본값은 이미지의 세로 높이입니다.
     */
    addCharacter(key: string, x: number, y: number, width?: number, height?: number): this {
        if (!this.scene) {
            return this
        }

        const texture: Phaser.Textures.Texture = this.scene.textures.get(key)
        const source: Phaser.Textures.TextureSource = texture.source[0]
        if (!source) {
            return this
        }
        if (width === undefined) {
            width = source.width
        }
        if (height === undefined) {
            height = source.height
        }
        this.scene.addCharacter(key, x, y, width, height)
        return this
    }

    /**
     * `addCharacter` 메서드로 등록한 캐릭터의 위치 좌표를 수정합니다.
     * @param key 캐릭터 고유키입니다.
     * @param x 캐릭터를 보여줄 화면의 x좌표입니다.
     * @param y 캐릭터를 보여줄 화면의 y좌표입니다.
     */
    setCharacterPosition(key: string, x: number, y: number): this {
        if (!this.scene) {
            return this
        }
        this.scene.setCharacterPosition(key, x, y)
        return this
    }

    /**
     * `addCharacter` 메서드로 등록한 캐릭터의 크기를 수정합니다.
     * @param key 캐릭터 고유키입니다.
     * @param width 캐릭터 이미지의 가로 너비입니다.
     * @param height 캐릭터 이미지의 세로 높이입니다.
     */
    setCharacterSize(key: string, width: number, height: number): this {
        if (!this.scene) {
            return this
        }
        this.scene.setCharacterSize(key, width, height)
        return this
    }

    /**
     * `addCharacter` 메서드로 등록한 캐릭터를 화면에 보여줍니다.
     * 원한다면 캐릭터가 보여질 위치 좌표를 수정할 수 있습니다.
     * @param key 캐릭터 고유키입니다.
     * @param x 캐릭터를 보여줄 화면의 x좌표입니다. 기본값은 캐릭터 이미지의 `x`좌표입니다.
     * @param y 캐릭터를 보여줄 화면의 y좌표입니다. 기본값은 캐릭터 이미지의 `y`좌표입니다.
     */
    showCharacter(key: string, x?: number, y?: number): this {
        if (!this.scene) {
            return this
        }
        this.scene.showCharacter(key, x, y)
        return this
    }

    /**
     * `addCharacter` 메서드로 등록한 캐릭터를 화면에서 숨깁니다.
     * 이는 `say` 메서드, 또는 `showCharacter` 메서드로 화면에 출력된 캐릭터 이미지를 수동으로 숨기는데 사용됩니다.
     * @param key 캐릭터 고유키입니다.
     */
    hideCharacter(key: string): this {
        if (!this.scene) {
            return this
        }
        this.scene.hideCharacter(key)
        return this
    }

    /**
     * `addCharacter` 메서드로 등록한 캐릭터를 삭제합니다.
     * 만약 화면에 출력 중이라면 즉시 제거합니다.
     * @param key 캐릭터 고유키입니다.
     */
    removeCharacter(key: string): this {
        if (!this.scene) {
            return this
        }
        this.scene.removeCharacter(key)
        return this
    }

    /**
     * 대사창을 수동으로 보여줍니다.
     * 일반적으로 대사를 보여주기 위해선 `say` 메서드를 이용하며, 이 메서드를 사용하지 않습니다.
     */
    showDialogue(): this {
        if (!this.scene) {
            return this
        }
        this.scene.showDialogue()
        return this
    }

    /**
     * 대사창을 수동으로 숨깁니다.
     */
    hideDialogue(): this {
        if (!this.scene) {
            return this
        }
        this.scene.hideDialogue()
        return this
    }
}

export { Plugin }