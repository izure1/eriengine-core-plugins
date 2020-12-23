<template>
    <section class="layer">
        <section class="character">
            <div
                v-for="character in characters"
                :key="character.key">
                <transition name="fade">
                    <img
                        class="character-image"
                        v-if="character.visible"
                        :src="getBase64FromKey(character.key)"
                        :style="{
                            width: `${character.width}px`,
                            height: `${character.height}px`,
                            left: `${character.x}px`,
                            top: `${character.y}px`
                        }">
                </transition>
            </div>
        </section>
        <transition name="fade">
            <section class="frame"
                v-if="frameVisible"
                :style="{
                    width: `${frameWidth}px`,
                    height: `${frameHeight}px`,
                    backgroundImage: `url(${frameTexture})`,
                    left: `${frameX}px`,
                    top: `${frameY}px`
                }">
                <div class="frame-text"
                :style="{
                    fontSize: `${fontSize}px`,
                    fontFamily: `${fontFamily}`,
                    fontWeight: `${fontWeight}`,
                    color: `${color}`
                }">{{ currentText }}</div>
            </section>
        </transition>
    </section>
</template>

<script lang="ts">
import Phaser from 'phaser'
import { Vue, Component, Prop } from 'vue-property-decorator'
import { IntervalManager } from '@common/Phaser/IntervalManager'

interface Character {
    key: string
    x: number
    y: number
    width: number
    height: number
    visible: boolean
}

@Component
export default class DialogueComponent extends Vue {
    @Prop({ type: Phaser.Scene, required: true })
    private scene!: Phaser.Scene|null

    @Prop({ type: Number, required: true, default: 0 })
    private frameWidth!: number

    @Prop({ type: Number, required: true, default: 0 })
    private frameHeight!: number

    @Prop({ type: String, required: true, default: '' })
    private frameTexture!: string

    @Prop({ type: Number, default: function(this: DialogueComponent) {
        return (this.scene!.game.canvas.width/2) - (this.frameWidth/2)
    } })
    private frameX!: number

    @Prop({ type: Number, default: function(this: DialogueComponent) {
        return this.scene!.game.canvas.height - this.frameHeight
    } })
    private frameY!: number

    @Prop({ type: Number, default: 30 })
    private fontSize!: number

    @Prop({ type: String, default: '"Nanum Gothic", sans-serif' })
    private fontFamily!: string

    @Prop({ type: String, default: 'normal' })
    private fontWeight!: string

    @Prop({ type: String, default: 'normal' })
    private fontStyle!: string

    @Prop({ type: String, default: 'white' })
    private color!: string

    private text: string = ''
    private currentText: string = ''
    private frameVisible: boolean = false
    private stepper: IntervalManager|null = null

    private characters: Character[] = []

    mounted(): void {
        this.registEvents()
    }
    
    public getBase64FromKey(key: string): string {
        if (!this.scene) {
            return ''
        }
        return this.scene.textures.getBase64(key)
    }

    private registEvents(): void {
        this.$on('say', (characterKey: string|null, text: string, speed: number, autoClean: number): void => {
            this.say(characterKey, text, speed, autoClean)
        })
        this.$on('stop', (): void => {
            this.clean()
        })
        this.$on('skip', (): void => {
            this.skip()
        })
        this.$on('clean', (withCharacters?: boolean): void => {
            this.clean(withCharacters)
        })
        this.$on('add-character', (key: string, x: number, y: number, width: number, height: number): void => {
            this.addCharacter(key, x, y, width, height)
        })
        this.$on('remove-character', (key: string): void => {
            this.removeCharacter(key)
        })
        this.$on('set-character-position', (key: string, x: number, y: number): void => {
            this.setCharacterPosition(key, x, y)
        })
        this.$on('set-character-size', (key: string, width: number, height: number): void => {
            this.setCharacterSize(key, width, height)
        })
        this.$on('show-character', (key: string, x?: number, y?: number): void => {
            this.showCharacter(key, x, y)
        })
        this.$on('hide-character', (key: string): void => {
            this.hideCharacter(key)
        })
        this.$on('show-dialogue', (): void => {
            this.showDialogue()
        })
        this.$on('hide-dialogue', (): void => {
            this.hideDialogue()
        })
    }

    private clean(withCharacters: boolean = false): void {
        this.destroyStepper()
        this.hideDialogue()
        if (withCharacters) {
            this.hideAllCharacter()
        }
        this.text = ''
        this.currentText = ''
    }

    private skip(): void {
        if (!this.stepper) {
            return
        }
        this.stepper.finish()
    }

    private say(characterKey: string|null, text: string, speed: number = 15, autoClean: number = 2500): void {
        if (!this.scene) {
            return
        }

        this.destroyStepper()
        this.showDialogue()

        if (characterKey !== null) {
            this.showCharacter(characterKey)
        }

        this.text = text
        this.stepper = new IntervalManager(this.scene)
        this.stepper
        .on('step', (currentStep: number): void => {
            this.currentText = this.text.substr(0, currentStep)
        })
        .on('done', (): void => {
            this.destroyStepper()
            this.currentText = this.text
            this.text = ''
            if (!this.scene) {
                return
            }
            if (autoClean < 0) {
                return
            }
            this.scene.time.delayedCall(autoClean, (): void => {
                if (characterKey !== null) {
                    this.hideCharacter(characterKey)
                }
                this.clean()
            })
        })
        .start(speed, this.text.length)
        return
    }

    private hasCharacter(key: string): boolean {
        const i: number = this.getCharacterIndex(key)
        return i !== -1
    }

    private getCharacterIndex(key: string): number {
        return this.characters.findIndex((character): boolean => character.key === key)
    }

    private getCharacter(key: string): Character|null {
        if (!this.hasCharacter(key)) {
            return null
        }
        return this.characters[this.getCharacterIndex(key)]
    }

    private addCharacter(key: string, x: number, y: number, width: number, height: number): void {
        if (this.hasCharacter(key)) {
            return
        }
        const visible: boolean = false
        this.characters.push({ key, x, y, width, height, visible })
    }

    private removeCharacter(key: string): void {
        const i: number = this.getCharacterIndex(key)
        if (i !== -1) {
            this.characters.splice(i, 1)
        }
    }

    private setCharacterPosition(key: string, x: number, y: number): void {
        if (!this.hasCharacter(key)) {
            return
        }
        const character: Character = this.getCharacter(key)!
        character.x = x
        character.y = y
    }

    private setCharacterSize(key: string, width: number, height: number): void {
        if (!this.hasCharacter(key)) {
            return
        }
        const character: Character = this.getCharacter(key)!
        character.width = width
        character.height = height
    }

    private showCharacter(key: string, x?: number, y?: number): void {
        if (!this.hasCharacter(key)) {
            return
        }
        const character: Character = this.getCharacter(key)!
        if (x === undefined) x = character.x
        if (y === undefined) y = character.y
        character.visible = true
        character.x = x
        character.y = y
    }

    private hideCharacter(key: string): void {
        if (!this.hasCharacter(key)) {
            return
        }
        const character: Character = this.getCharacter(key)!
        character.visible = false
    }

    private hideAllCharacter(): void {
        for (const { key } of this.characters) {
            this.hideCharacter(key)
        }
    }

    private showDialogue(): void {
        this.frameVisible = true
    }

    private hideDialogue(): void {
        this.frameVisible = false
    }

    private destroyStepper(): void {
        if (!this.stepper) {
            return
        }
        this.stepper.destroy()
    }

    private beforeDestroy(): void {
        this.scene = null
    }
}
</script>

<style lang="scss" scoped>
@import url(//fonts.googleapis.com/earlyaccess/nanumgothic.css);

$fade-duration: 0.5s;

.layer {
    width: 100%;
    height: 100%;
    position: relative;
}
.character {
    width: 100%;
    height: 100%;
    position: relative;

    .character-image {
        position: absolute;
    }
}
.frame {
    background-repeat: no-repeat;
    position: absolute;
    
    .frame-text {
        width: 100%;
        height: 100%;
        padding: 20px;
        box-sizing: border-box;
    }
}
.fade-leave-active,
.fade-enter-active {
    transition: opacity $fade-duration linear;
}
.fade-enter,
.fade-leave-to {
    opacity: 0;
}
.fade-leave,
.fade-enter-to {
    opacity: 1;
}
</style>