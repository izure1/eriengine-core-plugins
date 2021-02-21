import Phaser from 'phaser'
import { Point2 } from '@common/Math/MathUtil'
import { IntervalManager } from '@common/Phaser/IntervalManager'


interface DialogueTextStyle extends Phaser.Types.GameObjects.Text.TextStyle {
    lineHeight?: number
}

class Dialogue extends Phaser.GameObjects.Text {
    private stepper: IntervalManager|null = null
    private fadeTween: Phaser.Tweens.Tween|null = null
    private disposableTextStyle: DialogueTextStyle|null = null

    constructor(scene: Phaser.Scene, x: number, y: number, text: string, style: DialogueTextStyle) {
        super(scene, x, y, text, style)

        this.applyDialogueStyle(this.createMergedDialogueStyle(style))
        
        this.once(Phaser.GameObjects.Events.DESTROY, this.onDestroy.bind(this))
        this.hide(0)
    }

    private get defaultDialogueStyle(): DialogueTextStyle {
        const { width, height } = this.scene.scale
        return {
            fontSize: '20px',
            color: 'white',
            align: 'left',
            stroke: 'black',
            strokeThickness: 1,
            lineHeight: 1.5,
            fixedWidth: width,
            fixedHeight: height,
            padding: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            },
            wordWrap: {
                width,
                useAdvancedWrap: true
            }
        }
    }

    private createMergedDialogueStyle(...mergedStyles: DialogueTextStyle[]): DialogueTextStyle {
        let merged: DialogueTextStyle = this.defaultDialogueStyle
        for (const style of mergedStyles)  {
            merged = {
                ...merged,
                ...style
            }
        }
        return merged
    }

    private applyDialogueStyle(style: DialogueTextStyle): void {
        const merged: DialogueTextStyle = {
            ...this.defaultDialogueStyle,
            ...style
        }
        const fontSize: number = parseFloat(merged.fontSize!)
        const lineHeight: number = merged.lineHeight || 1

        this.setStyle(merged)
        this.setLineSpacing((fontSize * lineHeight) - fontSize)
        this.updateText()
    }

    private generateStepper(): void {
        this.destroyStepper()
        this.stepper = new IntervalManager(this.scene)
    }
    
    private destroyStepper(): void {
        this.stepper?.destroy()
        this.stepper = null
    }

    onDestroy(): void {
        this.destroyStepper()
    }

    private get textWrapWidth(): number {
        const { left = 0, right = 0 } = this.padding
        return this.style.fixedWidth - (left + right)
    }

    /**
     * 대사창에 텍스트를 출력합니다. 텍스트의 길이가 대사창의 가로 크기를 넘어가면 줄바꿈됩니다.
     * 줄바꿈을 위해선 `setFixedSize` 메서드를 이용하여 가로 크기를 지정하십시오.  
     * 텍스트는 기본적으로 타이핑 효과로 출력되며, 원할 경우 즉시 출력할 수 있도록 설정할 수 있습니다.
     * 타이핑 효과를 그만두고 즉시 모든 텍스트를 출력하게 하고 싶다면, `skip` 메서드를 이용하십시오.  
     * 출력이 끝나면, 기본적으로 자동으로 페이드아웃되어 사라지지만, 원할 경우 사라지지 않게 설정할 수 있습니다.
     * 이 경우 텍스트를 수동으로 사라지게 하기 위해서는 `hide` 메서드를 이용하십시오.
     * @param text 출력될 텍스트입니다.
     * @param speed 한 글자가 타이핑될 때 걸리는 시간(ms)입니다. 기본값은 `15`입니다. 이 값을 음수로 설정할 경우, 타이핑 효과 없이 텍스트가 즉시 출력됩니다.
     * @param autoClean 텍스트가 모두 출력된 후, 자동으로 사라지는데까지 대기하는 시간(ms)입니다. 기본값은 `2500`입니다. 이 값을 음수로 설정할 경우, 텍스트가 자동으로 사라지지 않습니다.
     */
    say(text: string, speed: number = 15, autoClean: number = 2500): Promise<string> {
        return new Promise((resolve): void => {
            this.setText('')
            this.show(undefined, (): void => {
                const onDone = (): void => {
                    const wrapped: string = this.advancedWordWrap(text, this.context, this.textWrapWidth)
                    this.destroyStepper()
                    this.setText(wrapped)

                    resolve(text)

                    if (autoClean < 0) {
                        return
                    }
                    this.generateStepper()
                    this.stepper?.on('done', (): void => {
                        this.destroyStepper()
                        this.hide()
                    })
                    this.stepper?.start(autoClean, 1)
                }

                // 출력 속도가 0보다 작을 경우, 즉시 모든 텍스트 출력
                if (speed < 0) {
                    onDone()
                    return
                }

                // 그렇지 않다면 타이핑 효과 사용
                this.generateStepper()
                this.stepper
                ?.on('step', (currentStep: number): void => {
                    const wrapped: string = this.advancedWordWrap(text.substr(0, currentStep), this.context, this.textWrapWidth)
                    this.setText(wrapped)
                })
                ?.on('done', onDone)
                this.stepper?.start(speed, text.length)
            })
        })
    }

    private generateFadeTween(option: object|Phaser.Types.Tweens.TweenBuilderConfig): void {
        this.destroyFadeTween()
        this.fadeTween = this.scene.tweens.add({
            targets: this,
            ...option
        })
    }

    private destroyFadeTween(): void {
        this.fadeTween?.stop()
        this.fadeTween = null
    }
    
    /**
     * 숨겨진 텍스트를 보여줍니다. 이는 `hide` 메서드로 투명화된 텍스트를 보여줍니다.
     * 이 메서드를 사용하면 텍스트 게임 오브젝트가 `active: true`가 됩니다.
     * @param duration 텍스트가 페이드인되는데 걸리는 시간(ms)입니다. 기본값은 `200`입니다.
     * @param onComplete 페이드인이 끝나고 호출될 함수입니다.
     */
    show(duration: number = 200, onComplete?: () => void): this {
        this.destroyFadeTween()
        this.generateFadeTween({ alpha: 1, duration, onComplete })
        return this
    }

    /**
     * 텍스트를 숨기고 비활성화합니다.
     * 이 메서드를 사용하면 텍스트 게임 오브젝트가 투명해지고, `active: false`가 됩니다.
     * @param duration 텍스트가 페이드아웃되는데 걸리는 시간(ms)입니다. 기본값은 `600`입니다.
     * @param onComplete 페이드아웃이 끝나고 호출될 함수입니다.
     */
    hide(duration: number = 600, onComplete?: () => void): this {
        this.destroyFadeTween()
        this.generateFadeTween({ alpha: 0, duration, onComplete })
        return this
    }

    /**
     * `say` 메서드로 출력 중인 텍스트의 타이핑 효과를 즉시 종료합니다.
     */
    skip(): this {
        if (!this.stepper) {
            return this
        }
        this.stepper.finish()
        return this
    }
}

class Plugin extends Phaser.Plugins.ScenePlugin {
    private static Scene: Phaser.Scene|null = null
    private static Dialogues: Map<string, Dialogue> = new Map

    private static ENOSCENEEXISTS: string = 'You must first initialize using the setUsingScene method.'

    boot(): void {
        this.scene.events.on(Phaser.Scenes.Events.CREATE, this.create.bind(this))
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update.bind(this))
    }

    create(): void {
    }

    /**
     * 씬이 매 프레임 업데이트 될 때 마다 호출될 메서드입니다.
     * 씬이 일시중지되었거나,파괴되었다면 더 이상 호출되지 않습니다.  
     * *절대 직접 호출하지 마십시오.*
     * @param time 씬이 시작한 후 흐른 시간(ms)입니다.
     * @param delta 이전 프레임과 현재 프레임 사이에 흐른 시간(ms)입니다. 게임은 일반적으로 60프레임이므로, 1/60초인 0.016초입니다.
     */
    update(time: number, delta: number): void {
    }

    destroy(): void {
    }

    /**
     * 대사창이 출력될 gui씬을 지정합니다.
     * 이는 대사창에 사용될 게임 오브젝트 요소들이 생성될 씬을 지정하는 메서드입니다.
     * 대사 출력에 관련된 메서드는 이 메서드를 호출하기 전에 사용하면 무시됩니다.
     * 이 메서드는 한 번 설정하면 다시는 설정할 수 없습니다.
     * @param scene 출력 씬입니다.
     */
    setUsingScene(key: string): this {
        if (Plugin.Scene) {
            return this
        }
        Plugin.Scene = this.scene.scene.get(key)
        return this
    }

    /**
     * 새로운 대사창을 추가합니다. 이 메서드를 사용하기 전에 반드시 `setUsingScene` 메서드로 대사창이 생성될 씬을 지정해야 합니다.  
     * 생성된 대사창은 `get` 메서드로 불러올 수 있습니다. 불러온 대사창을 `say` 메서드로 대사를 출력하십시오.
     * ```
     * dialoguePlugin
     *  .setUsingScene('your-scene-key')
     *  .addDialogue('your-dialogue-key')
     *  .say('Hello, world!')
     * ```
     * 대사창은 기본적으로 씬의 { x: 0, y: 0 } 위치에 생성됩니다.
     * 만일 원한다면 템플릿 매개변수를 이용하여 이 위치와 텍스트 크기를 수정할 수 있습니다. 템플릿 매개변수는 원하는 디자인의 대사창을 구현하는데 도움을 줍니다.
     * @param key 대사창의 고유키입니다. 다른 대사창과 중복되어선 안됩니다.
     * @param template 대사창의 템플릿입니다. 기본값은 `null`입니다. `bottom-fullwidth`, `bottom-dense`, `middle-singleline`, `middle-twoline`, `monologue`를 매개변수로 사용할 수 있습니다.
     */
    addDialogue(key: string, template: null|'bottom-fullwidth'|'bottom-dense'|'middle-singleline'|'middle-twoline'|'monologue' = null): this {
        if (!Plugin.Scene) {
            throw Plugin.ENOSCENEEXISTS
        }

        if (Plugin.Dialogues.has(key)) {
            return this
        }

        const { width, height } = this.scene.scale

        let x: number = 0
        let y: number = 0
        let fixedWidth: number  = width
        let fixedHeight: number = height
        let lineHeight: number = 1.5
        let padding: Phaser.Types.GameObjects.Text.TextPadding = {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50
        }
        let fontSize: string = '20px'
        let align: 'left'|'center'|'right' = 'left'


        switch (template) {
            case 'bottom-fullwidth':
                y = height / 4 * 3
                fixedHeight = height / 4
                padding.top = 10
                break

            case 'bottom-dense':
                x = width / 6 * 1
                y = height / 4 * 3
                fixedWidth  = width / 6 * 4
                fixedHeight = height / 4
                padding.top = 10
                break

            case 'middle-singleline':
                padding.top = 10
                padding.bottom = 0
                fixedHeight = (30 * lineHeight)
                y = (height / 2) - (fixedHeight / 2)
                fontSize = '30px'
                align = 'center'
                break

            case 'middle-twoline':
                padding.top = 10
                padding.bottom = 0
                fixedHeight = (40 * lineHeight)
                y = (height / 2) - (fixedHeight / 2)
                fontSize = '20px'
                align = 'center'
                break

            case 'monologue':
                fontSize = '50px'
                lineHeight = 1.7
                break
        }

        const dialogue: Dialogue = new Dialogue(Plugin.Scene, x, y, '', {
            fontSize,
            fixedWidth,
            fixedHeight,
            align,
            padding,
            lineHeight
        })

        Plugin.Scene.add.existing(dialogue)
        Plugin.Dialogues.set(key, dialogue)

        return this
    }

    /**
     * `addDialogue` 메서드로 추가한 대사창을 가져옵니다. 이 메서드를 사용하기 전에 반드시 `setUsingScene` 메서드로 대사창이 생성될 씬을 지정해야 합니다.
     * @param key 대사창의 고유키입니다.
     */
    get(key: string): Dialogue|null {
        if (!Plugin.Scene) {
            throw Plugin.ENOSCENEEXISTS
        }
        if (!Plugin.Dialogues.has(key)) {
            return null
        }
        return Plugin.Dialogues.get(key)!
    }
}

export { Plugin, Dialogue }