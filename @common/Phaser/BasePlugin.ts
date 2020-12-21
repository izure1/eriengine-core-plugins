import Phaser from 'phaser'

class BasePlugin extends Phaser.Plugins.BasePlugin {
    private __readyCallbacks: (() => void)[] = []

    constructor(pluginManager: Phaser.Plugins.PluginManager) {
        super(pluginManager)
        this.game.events.once(Phaser.Core.Events.READY, () => {
            this.emitReadyCallbacks()
        })
    }

    private emitReadyCallbacks(): void {
        for (const callback of this.__readyCallbacks) {
            callback()
        }
        this.__readyCallbacks = []
    }

    onGameReady(callback: () => void): this {
        if (this.game.isBooted) {
            callback()
            return this
        }
        this.__readyCallbacks.push(callback)
        return this
    }
}

export { BasePlugin }