import { nanoid } from 'nanoid'
import Phaser from 'phaser'
import DialogueModalComponent from '../Component/DialogueModal.vue'

export interface DialogueModalInputResponse {
    [key: string]: string|number|boolean
}

export interface DialogueModalButton {
    /** 버튼에 보여질 텍스트입니다. */
    text: string
    /**
     * 버튼을 클릭했을 시 호출될 함수입니다.
     * 매개변수로 모달의 `inputs`로 넘긴 데이터의 사용자 입력 결과값을 받습니다.
     * 아래 예제를 참고하십시오.
     * ```
     * addModal('your-modal', {
     *   inputs: [
     *     {
     *       key: 'userId',
     *       description: '이곳에 입력하십시오',
     *       type: 'text'
     *     }
     *   ],
     *   buttons: [
     *     {
     *       key: '입력값 확인하기',
     *       click: (inputAnswer) => {
     *         console.log(inputAnswer.userId)
     *       }
     *     }
     *   ]
     * })
     * ```
     */
    click: (inputAnswer: DialogueModalInputResponse) => void
}

export interface DialogueModalInput {
    key: string
    description: string
    type: 'text'|'password'|'number'|'boolean'
}

export interface DialogueModalOption {
    /** 어두운 분위기의 모달창을 만듭니다. 기본값은 `true`입니다. */
    dark?: boolean
    /** 모달창의 제목을 입력합니다. */
    title?: string
    /** 모달창의 부제목을 입력합니다. */
    subtitle?: string
    /** 모달창의 내용을 입력합니다. */
    text?: string
    /**
     * 모달창에 버튼을 생성합니다. 입력한 값 그대로 버튼이 생깁니다.
     * 버튼의 이름과 클릭했을 때 어떤 작업을 할 것인지를 지정할 수 있습니다.
     */
    buttons?: DialogueModalButton[],
    /**
     * 모달창에 값을 입력할 수 있는 폼을 생성합니다.
     * 텍스트, 비밀번호, 숫자, 그리고 참/거짓 값 등을 받아낼 수 있습니다.
     */
    inputs?: DialogueModalInput[]
    /** 모달창의 바깥 부분을 클릭하면 자동으로 모달창이 닫힐지 여부를 지정합니다.
     * 이 값을 `true`로 설정하면, 바깥 부분을 클릭해도 모달창이 닫히지 않습니다.
     * 기본값은 `true`입니다.
     * */
    persistent?: boolean
    /** 모달창의 가로 너비를 지정합니다. 기본값은 `800`입니다. */
    width?: number
}

export class DialogueModal implements DialogueModalOption {
    private readonly id: string = nanoid()

    readonly dark: boolean
    readonly title: string
    readonly subtitle: string
    readonly text: string
    readonly buttons: DialogueModalButton[]
    readonly inputs: DialogueModalInput[]
    readonly persistent: boolean
    readonly width: number

    private isShowing: boolean = false

    constructor(scene: Phaser.Scene, option: DialogueModalOption) {
        const {
            dark = true,
            title = '',
            subtitle = '',
            text = '',
            buttons = [],
            inputs = [],
            persistent = true,
            width = 800
        } = option

        this.dark = dark
        this.title = title
        this.subtitle = subtitle
        this.text = text
        this.buttons = buttons
        this.inputs = inputs
        this.persistent = persistent
        this.width = width
    }

    open(): this {
        this.isShowing = true
        return this
    }

    close(): this {
        this.isShowing = false
        return this
    }
}