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
                        }"
                    >
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
                }"
            >
                <div class="frame-text"
                    :style="{
                        fontSize: `${fontSize}px`,
                        fontFamily: `${fontFamily}`,
                        fontWeight: `${fontWeight}`,
                        color: `${color}`
                    }"
                >
                    <transition-group name="font-fade">
                        <span
                            class="frame-text-letter"
                            v-for="(letter, i) in currentText"
                            :key="`dialogue-letter-${i}`"
                        >{{ letter }}</span>
                    </transition-group>
                </div>
            </section>
        </transition>
    </section>
</template>

<script lang="ts">
import Phaser from 'phaser'
import { Vue, Component, Prop } from 'vue-property-decorator'
import { IntervalManager } from '@common/Phaser/IntervalManager'

const NON_REACTIVITY: WeakMap<Vue, Map<string, any>> = new WeakMap

function setNonReactivity(component: Vue, prop: string, value: any): void {
    if (NON_REACTIVITY.has(component)) {
        NON_REACTIVITY.set(component, new Map)
    }
    const nonReactivity = NON_REACTIVITY.get(component)!
    nonReactivity.set(prop, value)
}

function getNonReactivity(component: Vue, prop: string): any {
    if (!NON_REACTIVITY.has(component)) {
        return
    }
    const nonReactivity = NON_REACTIVITY.get(component)!
    return nonReactivity.get(prop)
}

interface Character {
    key: string
    x: number
    y: number
    width: number
    height: number
    visible: boolean
}

@Component({
    props: {
        scene: {
            type: Object as () => Phaser.Scene,
            required: true
        },
        frameWidth: {
            type: Number,
            required: true
        },
        frameHeight: {
            type: Number,
            required: true
        },
        frameTexture: {
            type: String,
            required: true
        },
        frameX: {
            type: Number,
            default(this: DialogueComponent): number {
                return (this.scene.scale.width/2) - (this.frameWidth/2)
            }
        },
        frameY: {
            type: Number,
            default(this: DialogueComponent): number {
                return this.scene.scale.height - this.frameHeight
            }
        },
        fontSize: {
            type: Number,
            default: 30
        },
        fontFamily: {
            type: String,
            default: '"Nanum Gothic", sans-serif'
        },
        fontWeight: {
            type: String,
            default: 'normal'
        },
        fontStyle: {
            type: String,
            default: 'normal'
        },
        color: {
            type: String,
            default: 'white'
        }
    }
})
export default class DialogueComponent extends Vue {
    private static stepper: IntervalManager|null = null

    // props
    private scene!: Phaser.Scene
    private frameWidth!: number
    private frameHeight!: number
    private frameTexture!: string
    private frameX!: number
    private frameY!: number
    private fontSize!: number
    private fontFamily!: string
    private fontWeight!: string
    private fontStyle!: string
    private color!: string

    // data
    private text: string = ''
    private currentText: string[] = []
    private frameVisible: boolean = false
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
        this.currentText = []
    }

    private skip(): void {
        if (!DialogueComponent.stepper) {
            return
        }
        DialogueComponent.stepper.finish()
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
        DialogueComponent.stepper = new IntervalManager(this.scene)
        DialogueComponent.stepper
        .on('step', (currentStep: number): void => {
            this.currentText = this.text.substr(0, currentStep).split('')
        })
        .on('done', (): void => {
            this.destroyStepper()
            this.currentText = this.text.split('')
            this.text = ''
            if (!this.scene) {
                return
            }
            if (autoClean < 0) {
                return
            }
            DialogueComponent.stepper = new IntervalManager(this.scene)
            DialogueComponent.stepper.on('done', (): void => {
                if (characterKey !== null) {
                    this.hideCharacter(characterKey)
                }
                this.clean()
            }).start(autoClean, 1)
        })
        .start(speed, this.text.length)
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
        if (!DialogueComponent.stepper) {
            return
        }
        DialogueComponent.stepper.destroy()
    }
}
</script>

<style lang="scss" scoped>
$fade-duration: 0.5s;
$font-fade-duration: 0.3s;
$font-fade-transform-duration: 1s;

@font-face {
    font-family: 'Nanum Gothic';
    src: url('@assets/nanum-gothic-v17-latin_korean-regular.woff2');
}

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
    background-size: 100% 100%;
    position: absolute;
    
    .frame-text {
        width: 100%;
        height: 100%;
        padding: 20px;
        box-sizing: border-box;

        .frame-text-letter {
            min-width: 10px;
            display: inline-block;
        }
    }
}

.fade-enter-active,
.fade-leave-active {
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

.font-fade-leave-active,
.font-fade-enter-active {
    transition: opacity $font-fade-duration linear, transform $font-fade-transform-duration cubic-bezier(0, 1, 0, 1);
}
.font-fade-enter {
    transform: translateX(-10px);
    opacity: 0;
}
.font-fade-enter-to {
    transform: translateX(0);
    opacity: 1;
}
</style>