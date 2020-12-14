import Phaser from 'phaser'

type Transition = 'slide'|'fade'|'default'
type Position = 'left'|'center'|'right'

class Plugin extends Phaser.Plugins.ScenePlugin {
    private charactermap: Map<string, Phaser.GameObjects.Sprite> = new Map
    private dialogueFrameObject: Phaser.GameObjects.Image|null = null
    private dialogueTexture: Phaser.Textures.Texture|string|null = null
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
        this.dialogueTexture = texture
        this.generateDialogueFrame()
        return this
    }

    private generateDialogueFrame(): void {
        if (!this.dialogueTexture) {
            return
        }
        if (this.dialogueFrameObject) {
            this.dialogueFrameObject.destroy()
        }
        else {
            this.dialogueFrameObject = this.scene.add.image(0, 0, this.dialogueTexture)
        }
        const { width, height } = this.game.canvas
        this.dialogueFrameObject.setDisplaySize(width, height)
    }

    print(dialogues: string|string[], speed: number = 35, sound?: string): this {
        if (!Array.isArray(dialogues)) {
            dialogues = [dialogues]
        }
        this.dialogues = dialogues
        this.speed = speed
        return this
    }

    skip(): this {  
        return this
    }

    next(): this {
        return this
    }

    private destroyCharacter(): void {
        for (const character of this.charactermap.values()) {
            character.destroy()
        }
        this.charactermap.clear()
    }

    private destroyDialogueFrame(): void {
        if (!this.dialogueFrameObject) {
            return
        }
        this.dialogueFrameObject.destroy()
        this.dialogueFrameObject = null
    }

    boot(): void {
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update.bind(this))
        this.scene.events.on(Phaser.Scenes.Events.DESTROY, this.destroy.bind(this))
    }

    update(time: number, delta: number): void {

    }

    destroy(): void {
        this.destroyCharacter()
        this.destroyDialogueFrame()
    }
}

export { Plugin }