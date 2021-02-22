import Phaser from 'phaser'
import { nanoid } from 'nanoid'
import { Point2 } from '@common/Math/MathUtil'
import { IntervalManager } from '@common/Phaser/IntervalManager'


interface DialogueTextStyle extends Phaser.Types.GameObjects.Text.TextStyle {
    lineHeight?: number
}

class Dialogue extends Phaser.GameObjects.Text {
    private steppers: Map<string, IntervalManager> = new Map
    private fadeTween: Phaser.Tweens.Tween|null = null
    private disposableTextStyle: DialogueTextStyle|null = null
    private beforeDefaultRule: ((e: Phaser.Input.Pointer) => void) = (): void => {}

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

    private get randomId(): string {
        return nanoid()
    }

    /**
     * 대사가 타이핑 도중인지 여부를 반환합니다.
     */
    get isTyping(): boolean {
        return this.steppers.has('say-typing')
    }

    /**
     * 대사창이 대기 모드인지 여부를 반환합니다.
     */
    get isSleeping(): boolean {
        return !this.isTyping
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

    private generateStepper(id: string): IntervalManager {
        this.destroyStepper(id)
        const stepper: IntervalManager = new IntervalManager(this.scene)
        this.steppers.set(id, stepper)
        return stepper
    }

    private getStepper(id: string): IntervalManager|null {
        if (!this.steppers.has(id)) {
            return null
        }
        return this.steppers.get(id)!
    }
    
    private destroyStepper(id?: string): void {
        const steppers: Map<string, IntervalManager> = new Map
        if (id === undefined) {
            for (const [ id, stepper ] of this.steppers) {
                steppers.set(id, stepper)
            }
        }
        else {
            if (this.steppers.has(id)) {
                steppers.set(id, this.steppers.get(id)!)
            }
        }
        for (const [ id, stepper ] of steppers) {
            stepper.destroy()
            this.steppers.delete(id)
        }
    }

    private onDestroy(): void {
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
     * 출력이 끝나면, 대기 모드로 전환됩니다.  
     * `autoClean` 매개변수를 이용하면 대기 모드로 전환 후, 자동으로 페이드아웃되어 사라지게 할 수 있습니다.
     * 이 경우 텍스트를 수동으로 사라지게 하기 위해서는 `hide` 메서드를 이용하십시오.
     * @param text 출력될 텍스트입니다.
     * @param speed 한 글자가 타이핑될 때 걸리는 시간(ms)입니다. 기본값은 `15`입니다. 이 값을 음수로 설정할 경우, 타이핑 효과 없이 텍스트가 즉시 출력됩니다.
     * @param autoClean 텍스트가 모두 출력된 후, 자동으로 사라지는데까지 대기하는 시간(ms)입니다. 기본값은 `2500`입니다. 이 값을 음수로 설정할 경우, 텍스트가 자동으로 사라지지 않습니다.
     * @param customStyle 추가로 적용될 텍스트 스타일입니다. 이 스타일은 1회용으로만 적용됩니다. 기본값은 `{}`입니다.
     */
    say(text: string, speed: number = 15, autoClean: number = 2500, customStyle: DialogueTextStyle = {}): Promise<string> {
        return new Promise((resolve): void => {
            this.destroyStepper('say-autoclean')
            this.generateStepper('say-typing')

            this.setText('')
            this.show(undefined, (): void => {
                let maxiumStep: number
                // 출력 속도가 0보다 작을 경우, 즉시 모든 텍스트 출력
                if (speed < 0) {
                    maxiumStep = 0
                }
                else {
                    maxiumStep = text.length
                }

                // 스타일 적용
                this.applyDialogueStyle(this.createMergedDialogueStyle(customStyle))

                // 타이핑 시작
                this.getStepper('say-typing')
                ?.on('step', (currentStep: number): void => {
                    this.setWrappedText(text.substr(0, currentStep))
                })
                .on('done', (): void => {
                    resolve(text)
                    this.sleep(text, autoClean)
                })
                .start(speed, maxiumStep)
            })
        })
    }

    /**
     * 대사를 출력하고, 대기 모드로 전환됩니다. 대기 모드로 전환되었을 때, 
     * 만약 대사가 타이핑 도중이었다면, 즉시 타이핑을 종료합니다.
     * @param text 출력할 텍스트입니다.
     * @param autoClean 텍스트가 자동으로 사라지는데까지 대기하는 시간(ms)입니다. 이 값을 음수로 설정할 경우, 텍스트가 자동으로 사라지지 않습니다.
     */
    sleep(text: string, autoClean: number): void {
        this.destroyStepper('say-typing')
        this.setWrappedText(text)

        if (autoClean < 0) {
            return
        }
        this.generateStepper('say-autoclean')
        .on('done', (): void => {
            this.destroyStepper('say-autoclean')
            this.hide()
        })
        .start(autoClean, 1)
    }

    /**
     * 대사창의 크기에 맞는, 줄바꿈이 적용된 대사를 출력합니다.
     * 이는 `padding`, `fixedWidth` 속성의 영향을 받습니다.
     * @param text 출력할 텍스트입니다.
     */
    setWrappedText(text: string): this {
        const wrapped: string = this.advancedWordWrap(text, this.context, this.textWrapWidth)
        this.setText(wrapped)
        return this
    }

    /**
     * 일정 시간 대기합니다. 이는 비동기 처리를 위해 사용합니다.
     * `setUsingScene` 메서드로 설정한 씬이 비활성화상태거나, 업데이트가 중지되었다면 그 시간동안 대기합니다.
     * @param delay 대기할 시간입니다.
     */
    wait(delay: number): Promise<void> {
        return new Promise((resolve): void => {
            this.generateStepper(this.randomId)
            .on('done', () => resolve())
            .start(delay, 1)
        })
    }

    /**
     * 연속된 대사를 출력합니다. 이는 몇 개의 `say` 메서드를 연달아서 호출하는 것보다 권장됩니다.
     * `skipRule` 메서드를 이용하여 출력된 대사를 넘기는 방법을 지정할 수 있습니다.
     * @param texts 출력될 대사 모음입니다.
     * @param speed 한 글자가 타이핑될 때 걸리는 시간(ms)입니다. 기본값은 `15`입니다. 이 값을 음수로 설정할 경우, 타이핑 효과 없이 텍스트가 즉시 출력됩니다.
     * @param autoClean 텍스트가 모두 출력된 후, 자동으로 사라지는데까지 대기하는 시간(ms)입니다. 기본값은 `2500`입니다. 이 값을 음수로 설정할 경우, 텍스트가 자동으로 사라지지 않습니다.
     * @param customStyle 추가로 적용될 텍스트 스타일입니다. 이 스타일은 1회용으로만 적용됩니다. 기본값은 `{}`입니다.
     * @param rule 대사의 출력을 제어하는 방법을 설정합니다. 기본값은 마우스 좌클릭 시, 타이핑 도중이라면 스킵하고, 대기 모드라면 다음 대사로 넘어가는 함수입니다.  
     * 이 함수는 대사가 타이핑될 때 마다 호출됩니다.
     * 함수의 매개변수로는 `next` 함수와, `text` 문자열, `usingScene` 씬 인스턴스를 받습니다.
     * `next` 함수를 호출하면 현재 출력 중인 대사를 즉시 종료하고, 다음 대사로 넘어갑니다.
     * ```
     * dialoguePlugin.speech([ 'hello', 'world' ], 15, (next, text): void => {
     *      // 3초후 자동으로 대사를 넘깁니다.
     *      setTimeout(next, 3000)
     * })
     * ```
     * `text` 매개변수는 지금 출력 중인 대사의 전문입니다.  
     * `usingScene` 매개변수는 현재 플러그인이 `setUsingScene`으로 지정한 씬 인스턴스를 의미합니다.
     */
    speech(
        texts: string[],
        speed: number = 15,
        autoClean: number = 2500,
        customStyle: DialogueTextStyle = {},
        rule: ((next: () => void, text: string, usingScene: Phaser.Scene) => void) = (next, text, usingScene) => {
            usingScene.input.off(Phaser.Input.Events.POINTER_DOWN, this.beforeDefaultRule)

            this.beforeDefaultRule = (e: Phaser.Input.Pointer): void => {
                // 좌클릭 했을 경우 타이핑 중이라면 스킵을, 대기 모드라면 다음으로 넘어갑니다.
                if (this.isTyping) {
                    this.skip()
                }
                else if (this.isSleeping) {
                    next()
                }
            }
            usingScene.input.once(Phaser.Input.Events.POINTER_DOWN, this.beforeDefaultRule)
        }
    ): Promise<void> {
        return new Promise(async (resolve): Promise<void> => {
            // 모든 텍스트를 순회하면서 대사를 출력합니다.
            for (const text of texts) {
                await new Promise((resolve: (value?: unknown) => void): void => {
                    this.say(text, speed, -1, customStyle)
                    this.getStepper('say-typing')
                    ?.on('step', (): void => rule(resolve, text, this.scene))
                    ?.on('done', (): void => rule(resolve, text, this.scene))
                })
            }

            resolve()
            
            const lastText: string = texts[texts.length-1]
            this.sleep(lastText, autoClean)
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
        this.getStepper('say-typing')?.finish()
        return this
    }
}

class Plugin extends Phaser.Plugins.ScenePlugin {
    static Scene: Phaser.Scene|null = null
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