import Phaser from 'phaser'

class Plugin extends Phaser.Plugins.ScenePlugin {
    constructor(scene: Phaser.Scene, pluginManager: Phaser.Plugins.PluginManager) {
        super(scene, pluginManager)
    }

    boot(): void {

    }

    update(): void {
        
    }

    destroy(): void {

    }
}

export { Plugin }