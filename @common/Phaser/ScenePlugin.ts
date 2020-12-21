import Phaser from 'phaser'

class ScenePlugin extends Phaser.Plugins.ScenePlugin {
    private __createdCallbacks: (() => void)[] = []

    constructor(scene: Phaser.Scene, pluginManager: Phaser.Plugins.PluginManager) {
        super(scene, pluginManager)
        this.scene.events.once(Phaser.Scenes.Events.CREATE, () => {
            this.emitCreatedCallbacks()
        })
    }

    private emitCreatedCallbacks(): void {
        for (const callback of this.__createdCallbacks) {
            callback()
        }
        this.__createdCallbacks = []
    }

    onSceneCreated(callback: () => void): this {
        if (this.scene.scene.settings.status >= 5) {
            callback()
            return this
        }
        this.__createdCallbacks.push(callback)
        return this
    }
}

export { ScenePlugin }