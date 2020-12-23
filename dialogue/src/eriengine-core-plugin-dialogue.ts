import Phaser from 'phaser'
import { DialogueScene } from './Dialogue/DialogueScene'

class Plugin extends Phaser.Plugins.BasePlugin {
    private scene: DialogueScene|null = null

    constructor(pluginManager: Phaser.Plugins.PluginManager) {
        super(pluginManager)
    }

    init(): void {
        this.game.events.once(Phaser.Core.Events.READY, (): void => {
            this.generateScene()
        })
    }

    private generateScene(): void {
        if (this.scene) {
            return
        }
        const sceneKey: string = '__ERIENGINE_CORE_PLUGIN_DIALOGUE_SCENE_KEY__'
        this.scene = this.game.scene.add(sceneKey, DialogueScene, true) as DialogueScene
    }

    say(characterKey: string|null, text: string, speed?: number, autoClean?: number): this {
        if (!this.scene) {
            return this
        }
        this.scene.say(characterKey, text, speed, autoClean)
        return this
    }

    stop(): this {
        if (!this.scene) {
            return this
        }
        this.scene.stop()
        return this
    }

    skip(): this {
        if (!this.scene) {
            return this
        }
        this.scene.skip()
        return this
    }

    clean(withCharacters?: boolean): this {
        if (!this.scene) {
            return this
        }
        this.scene.clean(withCharacters)
        return this
    }

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

    setCharacterPosition(key: string, x: number, y: number): this {
        if (!this.scene) {
            return this
        }
        this.scene.setCharacterPosition(key, x, y)
        return this
    }

    setCharacterSize(key: string, width: number, height: number): this {
        if (!this.scene) {
            return this
        }
        this.scene.setCharacterSize(key, width, height)
        return this
    }

    showCharacter(key: string, x?: number, y?: number): this {
        if (!this.scene) {
            return this
        }
        this.scene.showCharacter(key, x, y)
        return this
    }

    hideCharacter(key: string): this {
        if (!this.scene) {
            return this
        }
        this.scene.hideCharacter(key)
        return this
    }

    removeCharacter(key: string): this {
        if (!this.scene) {
            return this
        }
        this.scene.removeCharacter(key)
        return this
    }

    showDialogue(): this {
        if (!this.scene) {
            return this
        }
        this.scene.showDialogue()
        return this
    }

    hideDialogue(): this {
        if (!this.scene) {
            return this
        }
        this.scene.hideDialogue()
        return this
    }
}

export { Plugin }