import Phaser from 'phaser'
import { DialogueScene, Transition } from './Dialogue/DialogueScene'

class Plugin extends Phaser.Plugins.BasePlugin {
    constructor(pluginManager: Phaser.Plugins.PluginManager) {
        super(pluginManager)
    }

    init(): void {
        this.generateDialogueScene()
    }

    get scene(): DialogueScene {
        return this.game.scene.getScene(DialogueScene.SCENE_KEY) as DialogueScene
    } 

    private generateDialogueScene(): void {
        this.game.scene.add(DialogueScene.SCENE_KEY, DialogueScene, true) as DialogueScene
        return
    }

    private destroyDialogueScene(): void {
        if (this.scene) {
            this.scene.destroy()
            this.game.scene.remove(DialogueScene.SCENE_KEY)
        }
    }

    bringToTop(): this {
        this.scene.bringToTop()
        return this
    }

    addCharacter(key: string, x: number, y: number, texture: Phaser.Textures.Texture|string, frame?: string|number): this {
        if (!this.scene) {
            return this
        }
        this.scene.addCharacter(key, x, y, texture, frame)
        return this
    }

    showCharacter(key: string, method: Transition = 'slide'): this {
        if (!this.scene) {
            return this
        }
        this.scene.showCharacter(key, method)
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

    playCharacterAnimation(key: string, animation: string|Phaser.Animations.Animation|Phaser.Types.Animations.PlayAnimationConfig, ignoreIfPlaying: boolean = false): this {
        this.scene.playCharacterAnimation(key, animation, ignoreIfPlaying)
        return this
    }

    stopCharacterAnimation(key: string): this {
        this.scene.stopCharacterAnimation(key)
        return this
    }

    setDialogueTexture(texture: Phaser.Textures.Texture|string): this {
        if (!this.scene) {
            return this
        }
        this.scene.setDialogueTexture(texture)
        return this
    }

    setDialoguePosition(x: number, y: number): this {
        this.scene.setDialoguePosition(x, y)
        return this
    }

    setDialogueSize(width: number, height: number): this {
        this.scene.setDialogueSize(width, height)
        return this
    }

    print(dialogues: string|string[], speed: number = 35, sound?: string): this {
        if (!this.scene) {
            return this
        }
        this.scene.print(dialogues, speed, sound)
        return this
    }

    clearPrint(): this {
        if (!this.scene) {
            return this
        }
        this.scene.clearPrint()
        return this
    }

    skip(): this {
        if (!this.scene) {
            return this
        }
        this.scene.skip()
        return this
    }

    next(): this {
        if (!this.scene) {
            return this
        }
        this.scene.next()
        return this
    }

    // destroy(): void {
    //     this.destroyDialogueScene()
    // }
}

export { Plugin }