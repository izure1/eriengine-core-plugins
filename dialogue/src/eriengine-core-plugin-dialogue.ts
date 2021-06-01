import Phaser from 'phaser'
import Vue from 'vue'
import { DialogueText } from './Dialogue/DialogueText'
import { DialogueModal, DialogueModalOption } from './Dialogue/DialogueModal'
import DialogueModalAppComponent from './Component/App.vue'
import vuetify from './Plugin/vuetify'
import { Point2 } from '@common/Math/MathUtil'

class Plugin extends Phaser.Plugins.ScenePlugin {
  protected static Scene: Phaser.Scene|null = null
  protected static readonly ENOSCENEEXISTS: string = 'You must first initialize using the setUsingScene method.'

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
}

class DialoguePlugin extends Plugin {
  private static readonly Dialogues: Map<string, DialogueText> = new Map

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
    if (!DialoguePlugin.Scene) {
      throw DialoguePlugin.ENOSCENEEXISTS
    }

    if (DialoguePlugin.Dialogues.has(key)) {
      return this
    }

    const { width, height } = this.scene.scale.canvas

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

    const dialogue: DialogueText = new DialogueText(DialoguePlugin.Scene, x, y, '', {
      fontSize,
      fixedWidth,
      fixedHeight,
      align,
      padding,
      lineHeight
    })

    dialogue.once(Phaser.GameObjects.Events.DESTROY, (): void => {
      DialoguePlugin.Dialogues.delete(key)
    })

    DialoguePlugin.Scene.add.existing(dialogue)
    DialoguePlugin.Dialogues.set(key, dialogue)

    return this
  }

  /**
   * `addDialogue` 메서드로 추가한 대사창을 가져옵니다. 이 메서드를 사용하기 전에 반드시 `setUsingScene` 메서드로 대사창이 생성될 씬을 지정해야 합니다.
   * @param key 대사창의 고유키입니다.
   */
  get(key: string): DialogueText|null {
    if (!DialoguePlugin.Scene) {
      throw DialoguePlugin.ENOSCENEEXISTS
    }
    if (!DialoguePlugin.Dialogues.has(key)) {
      return null
    }
    return DialoguePlugin.Dialogues.get(key)!
  }

  /**
   * `addDialogue` 메서드로 추가한 대사창을 제거합니다.
   * @param key 대사창의 고유키입니다.
   */
  drop(key: string): this {
    if (!Plugin.Scene) {
      throw DialoguePlugin.ENOSCENEEXISTS
    }
    DialoguePlugin.Dialogues.get(key)?.destroy()
    return this
  }
}

class ModalPlugin extends Phaser.Plugins.ScenePlugin {
  static readonly Modals: Map<string, DialogueModal> = new Map
  private static AppWrapper: HTMLDivElement|null
  private static App: Vue|null

  boot(): void {
    this.generateApp()
    this.scene.game.events.once(Phaser.Core.Events.DESTROY, (): void => {
      this.destroyApp()
    })
  }

  private get parent(): Element {
    return this.scene.scale.parent
  }

  private get app(): DialogueModalAppComponent|null {
    if (!ModalPlugin.App) {
      return null
    }
    return ModalPlugin.App.$children[0] as DialogueModalAppComponent
  }

  private generateApp(): void {
    // 이미 초기화되어 있다면 래퍼를 다시 추가하지 않음
    // 씬 플러그인은 씬이 시작될 때 마다 실행되기 때문에, 여러 씬이 있으면 새로운 dom이 추가되기 때문임.
    if (ModalPlugin.AppWrapper || ModalPlugin.App) {
      return
    }

    ModalPlugin.App = new Vue({
      vuetify,
      render: h => h(DialogueModalAppComponent, {
        props: {
          modals: []
        }
      })
    })

    const wrapper: HTMLDivElement = document.createElement('div')
    this.parent.append(wrapper)
    
    ModalPlugin.AppWrapper = wrapper
    ModalPlugin.App.$mount(wrapper)
  }

  private destroyApp(): void {
    if (ModalPlugin.AppWrapper) {
      this.parent.removeChild(ModalPlugin.AppWrapper!)
    }
    ModalPlugin.App?.$destroy()
    ModalPlugin.App = null
  }

  /**
   * 새로운 모달창을 추가합니다.
   * @param key 모달창의 고유키입니다. 다른 모달창과 중복되어선 안됩니다.
   * @param option 모달창의 생성 옵션입니다.
   */
  addModal(key: string, option: DialogueModalOption = {}): this {
    if (!ModalPlugin.App) {
      return this
    }
    if (ModalPlugin.Modals.has(key)) {
      return this
    }

    const modal: DialogueModal = new DialogueModal(this.scene, option)
    ModalPlugin.Modals.set(key, modal)

    this.app?.$emit('add-modal', modal)
    return this
  }

  /**
   * `addModal` 메서드로 추가한 모달창을 제거합니다.
   * @param key 모달창의 고유키입니다.
   */
  dropModal(key: string): this {
    if (!ModalPlugin.App) {
      return this
    }
    if (!ModalPlugin.Modals.has(key)) {
      return this
    }
    const modal: DialogueModal = ModalPlugin.Modals.get(key)!
    this.app?.$emit('drop-modal', modal)

    ModalPlugin.Modals.delete(key)
    return this
  }

  /**
   * `addModal` 메서드로 추가한 모달창을 가져옵니다.
   * @param key 모달창의 고유키입니다.
   */
  get(key: string): DialogueModal|null {
    if (!ModalPlugin.App) {
      return null
    }
    if (!ModalPlugin.Modals.has(key)) {
      return null
    }
    return ModalPlugin.Modals.get(key)!
  }

  /**
   * `addModal` 메서드로 추가한 모달창이 존재하는지 여부를 반환합니다.
   * @param key 모달창의 고유키입니다.
   */
  has(key: string): boolean {
    if (!ModalPlugin.App) {
      return false
    }
    return ModalPlugin.Modals.has(key)
  }
}

export { DialoguePlugin, ModalPlugin }