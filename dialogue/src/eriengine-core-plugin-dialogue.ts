import Phaser from 'phaser'
import { TypingText } from '@common/Phaser/TypingText'
import { IntervalManager } from '@common/Phaser/IntervalManager'

type Transition = 'slide'|'fade'|'default'
type Position = 'left'|'center'|'right'

class Plugin extends Phaser.Plugins.ScenePlugin {
    private charactermap: Map<string, Phaser.GameObjects.Sprite> = new Map
    private frameObject: Phaser.GameObjects.Image|null = null
    private textObject: TypingText|null = null
    private texture: Phaser.Textures.Texture|string|null = null
    private stepper: IntervalManager|null = null
    private dialogues: string[] = []
    private speed: number = 35

    constructor(scene: Phaser.Scene, pluginManager: Phaser.Plugins.PluginManager) {
        super(scene, pluginManager)
    }

    showCharacter(key: string, texture: Phaser.Textures.Texture|string, frame?: string|number, position: Position = 'left', method: Transition = 'slide'): this {
        if (!this.charactermap.has(key)) {
            const character: Phaser.GameObjects.Sprite = this.scene.add.sprite(0, 0, texture, frame)
            this.charactermap.set(key, character)
        }
        return this
    }

    hideCharacter(key: string): this {
        if (!this.charactermap.has(key)) {
            return this
        }
        const character: Phaser.GameObjects.Sprite = this.charactermap.get(key)!
        return this
    }

    setDialogueTexture(texture: Phaser.Textures.Texture|string): this {
        this.texture = texture
        this.generateFrame()
        return this
    }

    private generateFrame(): void {
        if (!this.texture) {
            return
        }
        if (this.frameObject) {
            this.frameObject.destroy()
        }
        else {
            this.frameObject = this.scene.add.image(0, 0, this.texture)
        }
        const { width, height } = this.game.canvas
        this.frameObject.setDisplaySize(width, height)
    }

    print(dialogues: string|string[], speed: number = 35, sound?: string): this {
        if (!Array.isArray(dialogues)) {
            dialogues = [dialogues]
        }
        this.destroyStepper()
        this.generateStepper(dialogues)
        this.dialogues = dialogues
        this.speed = speed
        return this
    }

    private generateStepper(dialogues: string[]): void {
        this.stepper = new IntervalManager(this.scene)
        this.stepper
            .on('step', (currentStep: number): void => {
                //t
            })
            .on('done', (currentStep: number): void => {

            })
    }

    private destroyStepper(): void {
        if (!this.stepper) {
            return
        }
        this.stepper.destroy()
    }

    skip(): this {
        this.destroyStepper()
        return this
    }

    next(): this {
        this.destroyStepper()
        return this
    }

    private destroyCharacter(): void {
        for (const character of this.charactermap.values()) {
            character.destroy()
        }
        this.charactermap.clear()
    }

    private destroyFrame(): void {
        if (!this.frameObject) {
            return
        }
        this.frameObject.destroy()
        this.frameObject = null
    }

    boot(): void {
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update.bind(this))
        this.scene.events.on(Phaser.Scenes.Events.DESTROY, this.destroy.bind(this))
    }

    update(time: number, delta: number): void {
    }

    destroy(): void {
        this.destroyStepper()
        this.destroyCharacter()
        this.destroyFrame()
    }
}

export { Plugin }