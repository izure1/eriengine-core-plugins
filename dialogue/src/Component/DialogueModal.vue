<template>
    <v-dialog
        v-model="modal.isShowing"
        :persistent="modal.persistent"
        :width="modal.width"
        :dark="modal.dark"
        @keydown.stop
        @click.stop
    >
        <v-card>
            <v-card-title v-html="modal.title" />
            <v-card-subtitle v-html="modal.subtitle" />
            <v-card-text v-html="modal.text" />
            <v-card-text>
                <div
                    v-for="(input, i) in modal.inputs"
                    :key="`dialogue-modal-input-${modal.id}-${i}`"
                >
                    <v-switch
                        v-if="input.type === 'boolean'"
                        v-model="response[input.key]"
                        :label="input.description"
                        dense
                        inset
                    />
                    <v-text-field
                        v-else
                        v-model="response[input.key]"
                        :label="input.description"
                        :type="input.type"
                        rounded
                        filled
                        dense
                    />
                </div>
            </v-card-text>
            <v-divider v-if="modal.buttons.length" />
            <v-card-actions>
                <v-spacer />
                <v-btn
                    v-for="btn in modal.buttons"
                    :key="`dialogue-modal-button-${modal.id}-${btn}`"
                    @click="btn.click(endResponse)"
                    text
                >
                {{ btn.text }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { DialogueModal, DialogueModalInput, DialogueModalInputResponse } from '../Dialogue/DialogueModal'

@Component({
    props: {
        modal: {
            type: Object as () => DialogueModal,
            required: true
        }
    }
})
export default class DialogueModalComponent extends Vue {
    private modal!: DialogueModal
    private inputs: DialogueModalInput[] = []
    private response: DialogueModalInputResponse = {}

    private get endResponse(): DialogueModalInputResponse {
        const answer: DialogueModalInputResponse = {}
        for (const i in this.inputs) {
            const { key, type } = this.inputs[i]
            switch (type) {
                case 'number':
                    answer[key] = Number(this.response[key] as number)
                    break
                case 'boolean':
                    answer[key] = this.response[key]
                    break
                case 'text':
                case 'password':
                    answer[key] = this.response[key].toString()
                    break
            }
        }
        return answer
    }

    private get initialResponse(): DialogueModalInputResponse {
        const answer: DialogueModalInputResponse = {}
        for (const i in this.inputs) {
            const { key, type } = this.inputs[i]
            switch (type) {
                case 'number':
                    answer[key] = 0
                    break
                case 'boolean':
                    answer[key] = false
                    break
                case 'text':
                case 'password':
                    answer[key] = ''
                    break
            }
        }
        return answer
    }

    @Watch('modal.isShowing', { immediate: true })
    private onChangeModalIsShowing(): void {
        this.inputs = JSON.parse(JSON.stringify(this.modal.inputs))
        this.response = this.initialResponse
    }
}
</script>