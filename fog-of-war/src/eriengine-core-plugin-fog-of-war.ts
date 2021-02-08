import { getSmaller } from '@common/Math/MathUtil'
import Phaser from 'phaser'

type Target = Phaser.GameObjects.Sprite&Phaser.GameObjects.Image
type Revealer = Target&Phaser.GameObjects.Components.Transform
interface Constructor<T> {
    new (...args: any): T
}

class Plugin extends Phaser.Plugins.ScenePlugin {
    private revealer: Revealer|null = null
    private light: Phaser.GameObjects.Light|null = null
    private color: number = 0x000000
    private radius: number = 300
    private intensity: number = 3
    private __filter: (object: Phaser.GameObjects.GameObject) => boolean = () => false

    private get supportedTargets(): Phaser.GameObjects.GameObject[] {
        return this.scene.children.list.filter((object: Phaser.GameObjects.GameObject): boolean => {
            return  !(object instanceof Phaser.GameObjects.Shape) &&
                    !(object instanceof Phaser.GameObjects.Graphics) &&
                    !(object instanceof Phaser.GameObjects.Polygon)
        })
    }

    get targets(): Phaser.GameObjects.GameObject[] {
        return this.supportedTargets.filter(this.filter)
    }

    private onAdded(object: Phaser.GameObjects.GameObject): void {
        if (this.filter(object)) {
            this.setActive(object)
        }
    }

    private set filter(value: (object: Phaser.GameObjects.GameObject) => boolean) {
        this.__filter = value
        this.setInactive(...this.scene.children.list)
        this.setActive(...this.targets)
    }

    private get filter() {
        return this.__filter
    }

    private setActive(...targets: Phaser.GameObjects.GameObject[]): void {
        for (const target of targets) {
            if ( !('setPipeline' in target) ) {
                continue
            }
            const object: Target = target
            object.setPipeline(Phaser.Renderer.WebGL.Pipelines.LIGHT_PIPELINE)
        }
        if (this.revealer) {
            this.setInactive(this.revealer)
        }
    }

    private setInactive(...targets: Phaser.GameObjects.GameObject[]): void {
        for (const target of targets) {
            if ( !('setPipeline' in target) ) {
                continue
            }
            const object: Target = target
            object.resetPipeline()
        }
    }

    private generateLight(x: number = 0, y: number = 0): void {
        if (this.light) {
            return
        }
        this.light = this.scene.lights.addLight(x, y, this.radius, 0xffffff, this.intensity)
    }

    private destroyLight(): void {
        if (!this.light) {
            return
        }
        this.scene.lights.removeLight(this.light)
        this.light = null
    }

    private destroyRevealer(): void {
        this.revealer = null
    }

    private updateLightPosition(): void {
        if (!this.light || !this.revealer) {
            return
        }
        const { x, y } = this.revealer
        this.light.setPosition(x, y)
    }

    setRadius(radius: number): this {
        this.radius = radius
        if (this.light) {
            this.light.setRadius(radius)
        }
        return this
    }

    setIntensity(intensity: number): this {
        this.intensity = intensity
        if (this.light) {
            this.light.setIntensity(intensity)
        }
        return this
    }

    setRevealer(target: Revealer, color: number = 0x000000, filter: (object: Phaser.GameObjects.GameObject) => boolean = () => true): this {
        this.revealer = target
        this.color = color
        this.filter = filter

        const { x, y } = target
        this.destroyLight()
        this.generateLight(x, y)
        
        this.scene.lights.enable()
        this.scene.lights.setAmbientColor(this.color)
        return this
    }

    private onCreated(): void {
        this.setInactive(...this.scene.children.list)
        this.setActive(...this.targets)

        this.scene.lights.enable()
        this.scene.lights.setAmbientColor(this.color)
    }

    boot(): void {
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update.bind(this))
        this.scene.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, this.onAdded.bind(this))
        this.scene.events.on(Phaser.Scenes.Events.CREATE, this.onCreated.bind(this))
    }

    update(time: number, delta: number): void {
        this.updateLightPosition()
    }

    destroy(): void {
        this.destroyLight()
        this.destroyRevealer()
    }
}

export { Plugin }