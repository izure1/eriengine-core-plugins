<template>
    <v-app>
        <v-main>
            <div ref="game"></div>
            <dialogue-modal-component
                v-for="(modal, i) in modals"
                :key="dialogue-app-modal-`${i}`"
                :modal="modal"
            />
        </v-main>
    </v-app>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { DialogueModal } from '../Dialogue/DialogueModal'
import DialogueModalComponent from './DialogueModal.vue'

@Component({
    components: {
        DialogueModalComponent
    },
    props: {
        modals: {
            type: Array,
            required: true
        }
    }
})
export default class AppComponent extends Vue {
    private modals: DialogueModal[] = []

    private attachEvents(): void {
        this.$on('add-modal', (modal: DialogueModal): void => {
            this.modals.push(modal)
        })
        this.$on('drop-modal', (modal: DialogueModal): void => {
            const i: number = this.modals.indexOf(modal)
            if (i === -1) {
                return
            }
            this.modals.splice(i, 1)
        })
    }

    created(): void {
        this.attachEvents()
    }
}
</script>

<style lang="scss">
@import 'vuetify/dist/vuetify.min.css';

.v-application--wrap {
    max-width: initial !important;
    min-height: initial !important;
}
</style>