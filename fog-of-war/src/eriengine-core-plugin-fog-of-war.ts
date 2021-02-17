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

    /** Phaser3의 lights pipeline을 지원하는 타입의 게임 오브젝트만을 반환합니다. */
    private get supportedTargets(): Phaser.GameObjects.GameObject[] {
        return this.scene.children.list.filter((object: Phaser.GameObjects.GameObject): boolean => {
            return  !(object instanceof Phaser.GameObjects.Shape) &&
                    !(object instanceof Phaser.GameObjects.Graphics) &&
                    !(object instanceof Phaser.GameObjects.Polygon)
        })
    }

    /** `setRevealer` 메서드로 지정한 필터의 영향을 받는 씬 게임 오브젝트 목록을 반환합니다. */
    get targets(): Phaser.GameObjects.GameObject[] {
        return this.supportedTargets.filter(this.filter)
    }

    /**
     * `setRevealer` 메서드로 지정한 필터를 통과한 게임 오브젝트를 lights pipeline을 활성화합니다.
     * @param object 게임 오브젝트입니다.
     */
    private onAdded(object: Phaser.GameObjects.GameObject): void {
        if (this.filter(object)) {
            this.setActive(object)
        }
    }

    /** lights pipeline 영향을 받을 게임 오브젝트 필터를 설정합니다. */
    private set filter(value: (object: Phaser.GameObjects.GameObject) => boolean) {
        this.__filter = value
        this.setInactive(...this.scene.children.list)
        this.setActive(...this.targets)
    }

    /** lights pipeline 영향을 받을 게임 오브젝트 필터를 반환합니다. */
    private get filter() {
        return this.__filter
    }

    /**
     * 게임 오브젝트의 lights pipeline을 활성화합니다.
     * 이 메서드는 `this.filter`의 영향을 받습니다.
     * lights pipeline을 지원하지 않는 게임 오브젝트는 활성화되지 않습니다.
     * 자동으로 호출되며, *직접 호출하지 마십시오.*
     * @param targets lights pipeline을 활성화할 게임 오브젝트입니다.
     */
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

    /**
     * 게임 오브젝트의 lights pipeline을 비활성화합니다.
     * lights pipeline을 지원하지 않는 게임 오브젝트는 활성화되지 않습니다.
     * 이는 `object.resetPipeline` 메서드를 호출하므로, 사용자가 정의한 pipeline이 있다면 주의하십시오.
     * 자동으로 호출되며, *직접 호출하지 마십시오.*
     * @param targets 
     */
    private setInactive(...targets: Phaser.GameObjects.GameObject[]): void {
        for (const target of targets) {
            if ( !('setPipeline' in target) ) {
                continue
            }
            const object: Target = target
            object.resetPipeline()
        }
    }

    /**
     * 씬에 라이트 게임 오브젝트를 생성합니다.
     * 자동으로 호출되며, *직접 호출하지 마십시오.*
     * @param x 라이트가 생성될 x좌표입니다. 기본값은 `0`입니다.
     * @param y 라이트가 생성될 y좌표입니다. 기본값은 `0`입니다.
     */
    private generateLight(x: number = 0, y: number = 0): void {
        if (this.light) {
            return
        }
        this.light = this.scene.lights.addLight(x, y, this.radius, 0xffffff, this.intensity)
    }

    /** 씬에 라이트 게임 오브젝트를 파괴합니다. */
    private destroyLight(): void {
        if (!this.light) {
            return
        }
        this.scene.lights.removeLight(this.light)
        this.light = null
    }

    /** `setRevealer` 메서드로 활성화된 리벌버를 제거합니다. 자동으로 호출되며, *직접 호출하지 마십시오.* */
    private destroyRevealer(): void {
        this.revealer = null
    }

    /**
     * 씬에 생성된 라이트 게임 오브젝트의 위치를 갱신합니다.
     * 위치는 `setRevealer`로 지정된 리벌버의 `x`, `y` 좌표의 영향을 받습니다.
     * 자동으로 호출되며, *직접 호출하지 마십시오.*
     */
    private updateLightPosition(): void {
        if (!this.light || !this.revealer) {
            return
        }
        const { x, y } = this.revealer
        this.light.setPosition(x, y)
    }

    /**
     * `setRevealer` 메서드로 지정된 리벌버 게임 오브젝트의 시야 반경 반지름 너비를 설정합니다.
     * @param radius 시야 반경 반지름 너비입니다.
     */
    setRadius(radius: number): this {
        this.radius = radius
        if (this.light) {
            this.light.setRadius(radius)
        }
        return this
    }

    /**
     * `setRevealer` 메서드로 지정된 리벌버 게임 오브젝트의 시야의 빛의 강도를 지정합니다.
     * 이 값이 크면 더 강렬한 빛이 비추어집니다. 약간 어두운 시야를 가지고 싶다면, 이 값을 약하게 하여 빛의 강도를 약하게 하십시오.
     * @param intensity 빛의 강도입니다.
     */
    setIntensity(intensity: number): this {
        this.intensity = intensity
        if (this.light) {
            this.light.setIntensity(intensity)
        }
        return this
    }

    /**
     * 지정된 게임 오브젝트 주변에 빛이 밝혀집니다. 씬에서 단 하나의 게임 오브젝트에만 빛을 밝힐 수 있습니다.
     * 이는 게임의 주인공의 시야를 구현하는 용도로 사용하기에 좋습니다.
     * @param target 빛을 밝힐 게임 오브젝트입니다.
     * @param color 빛의 색상입니다. 기본값은 `0x000000`입니다.
     * @param filter 전장의 안개의 영향을 받을 게임 오브젝트 필터 함수입니다. 이 함수는 매개변수로 게임 오브젝트를 받습니다.
     * 필터 함수는 씬의 모든 게임 오브젝트를 대상으로 작동하며, 이 함수가 `false`를 반환하면 해당 오브젝트는 전장의 안개의 영향을 받지 않습니다.
     * 가령 텍스트 게임 오브젝트를 전장의 안개의 효과에서 제외하고 싶다면, 아래처럼 사용할 수 있습니다.
     * ```
     * setRevealer(yourTarget, 0x000000, (object): boolean => {
     *   if (object instanceof Phaser.GameObjects.Text) {
     *     return false
     *   }
     *   return true
     * })
     * ```
     * 기본값은 `() => true` 입니다. 이는 씬에 있는 모든 게임 오브젝트를 대상으로 전장의 안개를 활성화하겠다는 의미입니다.
     */
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

    /** 씬이 생성되었을 때 호출될 함수입니다. 자동으로 호출되며, *직접 호출하지 마십시오.* */
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

    /**
     * 씬이 매 프레임 업데이트 될 때 마다 호출될 메서드입니다.
     * 씬이 일시중지되었거나,파괴되었다면 더 이상 호출되지 않습니다.  
     * *절대 직접 호출하지 마십시오.*
     * @param time 씬이 시작한 후 흐른 시간(ms)입니다.
     * @param delta 이전 프레임과 현재 프레임 사이에 흐른 시간(ms)입니다. 게임은 일반적으로 60프레임이므로, 1/60초인 0.016초입니다.
     */
    update(time: number, delta: number): void {
        this.updateLightPosition()
    }

    destroy(): void {
        this.destroyLight()
        this.destroyRevealer()
    }
}

export { Plugin }