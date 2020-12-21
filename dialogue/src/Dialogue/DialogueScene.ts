import Phaser from 'phaser'
import { TypingText } from '../../../@common/Phaser/TypingText'
import { IntervalManager } from '../../../@common/Phaser/IntervalManager'

type Transition = 'slide'|'fade'|'none'
interface CharacterInitial {
    target: Phaser.GameObjects.Sprite
    x: number
    y: number
}

class DialogueScene extends Phaser.Scene {
    static readonly FRAME_TEXTURE_KEY = '__ERIENGINE_CORE_PLUGIN_DIALOGUE_DEFAULT_FRAME__'
    static readonly SCENE_KEY = '__ERIENGINE_CORE_PLUGIN_DIALOGUE_DEFAULT_SCENE_KEY__'

    private characters: Map<string, CharacterInitial> = new Map
    private texture: Phaser.Textures.Texture|string|null = null
    private frame: Phaser.GameObjects.Image|null = null
    private text: TypingText|null = null
    private stepper: IntervalManager|null = null
    private dialogues: string[] = []
    private dialogueIndex: number = 0
    private lastDialogue: string = ''
    private speed: number = 35

    private get currentLine(): string {
        if (this.dialogueIndex in this.dialogues) {
            return this.dialogues[this.dialogueIndex]
        }
        return this.lastDialogue
    }

    private get dialoguesLength(): number {
        return this.dialogues.reduce((acc: number, dialogue: string): number => acc + dialogue.length, 0)
    }

    private get defaultFrameTexture(): Phaser.Textures.Texture {
        if (this.textures.exists(DialogueScene.FRAME_TEXTURE_KEY)) {
            return this.textures.get(DialogueScene.FRAME_TEXTURE_KEY)
        }
        const data: string[] = ['3']
        const pixelWidth: number = this.game.canvas.width
        const pixelHeight: number = this.game.canvas.height / 4
        return this.textures.generate(DialogueScene.FRAME_TEXTURE_KEY, { data, pixelWidth, pixelHeight })
    }

    private ensureCharacter(key: string, x: number, y: number, texture: Phaser.Textures.Texture|string, frame?: string|number): CharacterInitial {
        if (!this.characters.has(key)) {
            const target: Phaser.GameObjects.Sprite = this.add.sprite(x, y, texture, frame).setAlpha(0)
            const character: CharacterInitial = { target, x, y }

            this.characters.set(key, character)
        }
        return this.characters.get(key)!
    }

    private fadeInObject(targets: Phaser.GameObjects.Sprite, duration: number): void {
        this.tweens.add({ targets, duration, alpha: 1 })
    }

    private fadeOutObject(targets: Phaser.GameObjects.Sprite, duration: number): void {
        this.tweens.add({ targets, duration, alpha: 0 })
    }

    private slideObject(targets: Phaser.GameObjects.Sprite, x: number, y: number, duration: number): void {
        this.tweens.add({ targets, x, y, duration })
    }

    addCharacter(key: string, x: number, y: number, texture: Phaser.Textures.Texture|string, frame?: string|number): this {
        this.ensureCharacter(key, x, y, texture, frame)
        return this
    }

    showCharacter(key: string, method: Transition = 'slide', duration: number = 600): this {
        if (!this.characters.has(key)) {
            return this
        }
        const { target, x, y } = this.characters.get(key)!
        target.setAlpha(0)
        
        switch(method) {
            case 'none':
                target.setAlpha(1)
                target.setPosition(x, y)
                break
            case 'fade':
                this.fadeInObject(target, duration)
                break
            case 'slide':
                target.setPosition(x, y + 10)
                this.fadeInObject(target, duration)
                this.slideObject(target, x, y, duration)
                break
        }
        return this
    }

    hideCharacter(key: string, method: Transition = 'slide'): this {
        if (!this.characters.has(key)) {
            return this
        }
        const { target, x, y } = this.characters.get(key)!

        switch(method) {
            case 'none':
                target.setAlpha(0)
                break
            case 'fade':
                this.fadeOutObject(target, 600)
                break
            case 'slide':
                this.fadeOutObject(target, 600)
                this.slideObject(target, x, y + 10, 600)
                break
        }
        return this
    }

    removeCharacter(key: string): this {
        if (!this.characters.has(key)) {
            return this
        }
        const { target } = this.characters.get(key)!
        this.characters.delete(key)
        target.destroy()
        return this
    }

    playCharacterAnimation(key: string, animation: string|Phaser.Animations.Animation|Phaser.Types.Animations.PlayAnimationConfig, ignoreIfPlaying: boolean = false): this {
        if (!this.characters.has(key)) {
            return this
        }
        const { target } = this.characters.get(key)!
        target.play(animation, ignoreIfPlaying)
        return this
    }

    stopCharacterAnimation(key: string): this {
        if (!this.characters.has(key)) {
            return this
        }
        const { target } = this.characters.get(key)!
        target.stop()
        return this
    }

    setDialogueTexture(texture: Phaser.Textures.Texture|string): this {
        this.texture = texture
        this.ensureFrame()
        return this
    }

    setDialoguePosition(x: number, y: number): this {
        this.frame?.setPosition(x, y)
        return this
    }

    setDialogueSize(width: number, height: number): this {
        this.frame?.setDisplaySize(width, height)
        return this
    }

    bringToTop(): this {
        this.game.scene.bringToTop(this)
        return this
    }

    private setText(text: string): void {
        this.text?.setText(text)
    }

    private ensureFrame(): void {
        if (!this.texture) {
            return
        }
        if (this.frame) {
            this.frame.destroy()
        }
        const { width, height } = this.game.canvas
        this.frame = this.add.image(0, 0, this.texture)
        this.frame.setScrollFactor(0)
        this.frame.setOrigin(0, 0)
        this.frame.setPosition((width/2) - (this.frame.displayWidth/2), height - this.frame.displayHeight)
    }

    print(dialogues: string|string[], speed: number = 35, sound?: string): this {
        if (!Array.isArray(dialogues)) {
            dialogues = [dialogues]
        }
        this.destroyStepper()
        this.generateStepper()
        this.dialogues = dialogues
        this.dialogueIndex = 0
        this.speed = speed
        return this
    }

    private generateStepper(): void {
        this.stepper = new IntervalManager(this)
        this.stepper
            .on('step', (currentStep: number, maxiumStep: number): void => {
                const dialogues: string[] = []
                let leftCount: number = maxiumStep
                for (const dialogue of this.dialogues) {
                    if (currentStep >= dialogue.length) {
                        dialogues.push(dialogue)
                        leftCount -= dialogue.length
                    }
                    else {
                        const current: string = dialogue.substr(leftCount)
                        dialogues.push(current)
                    }
                }
                this.text?.setText(dialogues)
            })
            .on('done', (currentStep: number): void => {
                this.destroyStepper()
                this.text?.setText(this.dialogues)
                //this.clearPrint()
            })
            .start(this.speed, this.dialoguesLength)
    }

    private destroyStepper(): void {
        if (!this.stepper) {
            return
        }
        this.stepper.destroy()
    }

    clearPrint(): this {
        this.text?.setText('')
        return this
    }

    skip(): this {
        this.destroyStepper()
        this.setText(this.currentLine)
        return this
    }

    next(): this {
        this.destroyStepper()
        this.clearPrint()
        return this
    }

    private destroyCharacter(): void {
        for (const character of this.characters.values()) {
            character.target.destroy()
        }
        this.characters.clear()
    }

    private destroyFrame(): void {
        if (!this.frame) {
            return
        }
        this.frame.destroy()
        this.frame = null
    }

    private ensureText(): void {
        //this.text = this.add.text(0, 0, '')
    }

    private destroyText(): void {
        if (!this.text) {
            return
        }
        this.text.destroy()
        this.text = null
    }

    create(): void {
        this.texture = this.defaultFrameTexture
        this.ensureFrame()
        this.ensureText()
        this.bringToTop()
    }

    destroy(): void {
        this.destroyStepper()
        this.destroyCharacter()
        this.destroyFrame()
        this.destroyText()
    }
}

export { DialogueScene, Transition }