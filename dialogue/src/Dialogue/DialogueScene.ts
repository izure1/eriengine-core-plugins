import Phaser from 'phaser'
import Vue from 'vue'
import DialogueComponent from '../Components/Dialogue.vue'
import frameTextureImage from '@assets/frame.png'

class DialogueScene extends Phaser.Scene {
    private wrapper: HTMLDivElement|null = null
    private component: DialogueComponent|null = null

    create(): void {
        this.wrapper = document.createElement('div')
        this.add.dom(0, 0, this.wrapper)

        const main = new Vue({
            render: h => h(DialogueComponent, {
                props: {
                    scene: this,
                    frameWidth: 1024,
                    frameHeight: 170,
                    frameTexture: frameTextureImage,
                }
            }),
        })
        main.$mount(this.wrapper)
        this.component = main.$children[0] as DialogueComponent
    }

    say(characterKey: string|null, text: string, speed?: number, autoClean?: number): this {
        if (!this.component) {
            return this
        }
        this.component.$emit('say', characterKey, text ,speed, autoClean)
        return this
    }

    stop(): this {
        if (!this.component) {
            return this
        }
        this.component.$emit('stop')
        return this
    }

    skip(): this {
        if (!this.component) {
            return this
        }
        this.component.$emit('skip')
        return this
    }

    clean(withCharacters?: boolean): this {
        if (!this.component) {
            return this
        }
        this.component.$emit('clean', withCharacters)
        return this
    }

    addCharacter(key: string, x: number, y: number, width: number, height: number): this {
        if (!this.component) {
            return this
        }
        this.component.$emit('add-character', key, x, y, width, height)
        return this
    }

    removeCharacter(key: string): this {
        if (!this.component) {
            return this
        }
        this.component.$emit('remove-character', key)
        return this
    }

    setCharacterPosition(key: string, x: number, y: number): this {
        if (!this.component) {
            return this
        }
        this.component.$emit('set-character-position', key, x, y)
        return this
    }

    setCharacterSize(key: string, width: number, height: number): this {
        if (!this.component) {
            return this
        }
        this.component.$emit('set-character-size', key, width, height)
        return this
    }

    showCharacter(key: string, x?: number, y?: number): this {
        if (!this.component) {
            return this
        }
        this.component.$emit('show-character', key, x, y)
        return this
    }

    hideCharacter(key: string): this {
        if (!this.component) {
            return this
        }
        this.component.$emit('hide-character', key)
        return this
    }

    showDialogue(): this {
        if (!this.component) {
            return this
        }
        this.component.$emit('show-dialogue')
        return this
    }

    hideDialogue(): this {
        if (!this.component) {
            return this
        }
        this.component.$emit('hide-dialogue')
        return this
    }

    destroy(): void {
        this.wrapper?.remove()
        this.wrapper = null
        this.component = null
    }
}

export { DialogueScene }