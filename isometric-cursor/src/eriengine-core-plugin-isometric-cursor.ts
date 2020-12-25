import Phaser from 'phaser'
import { ISOMETRIC_ANGLE, getBigger, getCoordFromPoint, toCartesianCoord, toIsometricCoord, Point2 } from '@common/Math/MathUtil'

interface RGBA {
    red: number
    green: number
    blue: number
    alpha: number
}

class Plugin extends Phaser.Plugins.ScenePlugin {
    private polygon: Phaser.GameObjects.Polygon|null = null
    private text: Phaser.GameObjects.Text|null = null
    private side: number = 100
    private activity: boolean = true
    private thickness: number = 2
    private strokeColor: number = Phaser.Display.Color.GetColor(0, 255, 0)

    constructor(scene: Phaser.Scene, pluginManager: Phaser.Plugins.PluginManager) {
        super(scene, pluginManager)
    }

    boot(): void {
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update.bind(this))
        this.scene.events.on(Phaser.Scenes.Events.DESTROY, this.destroy.bind(this))
    }

    private get isoRad(): number {
        return Math.PI / 180 * ISOMETRIC_ANGLE
    }

    private get isoW(): number {
        return Math.cos(this.isoRad) * this.side
    }

    private get isoH(): number {
        return Math.sin(this.isoRad) * this.side
    }

    private get isoOrigin(): Point2 {
        const x: number = 0
        const y: number = 0
        return { x, y }
    }

    get pointer(): Point2 {
        const { worldX, worldY } = this.scene.input.activePointer

        if (!this.activity) {
            const x: number = worldX
            const y: number = worldY
            return { x, y }
        }

        const isoOffset: Point2 = toIsometricCoord({
            x: worldX,
            y: worldY,
        }, this.isoOrigin.x, this.isoOrigin.y, this.isoW, this.isoH)

        const sceneOffset: Point2 = toCartesianCoord({
            x: Math.round(isoOffset.x),
            y: Math.round(isoOffset.y),
        }, this.isoOrigin.x, this.isoOrigin.y, this.isoW, this.isoH)

        const x: number = sceneOffset.x
        const y: number = sceneOffset.y

        return { x, y }
    }

    get pointerX(): number {
        return this.pointer.x
    }

    get pointerY(): number {
        return this.pointer.y
    }

    private destroyObject(): void {
        if (!this.polygon) {
            return
        }
        this.polygon.destroy()
        this.polygon = null
    }

    setGridSide(side: number): this {
        this.side = side
        this.generateGridObject()
        return this
    }

    setStrokeThickness(thickness: number): this {
        this.thickness = thickness
        this.generateGridObject()
        return this
    }

    setStrokeColor({ red, green, blue, alpha = 1 }: RGBA): this {
        this.strokeColor = Phaser.Display.Color.GetColor32(red, green, blue, alpha)
        this.generateGridObject()
        return this
    }

    enable(activity: boolean = true): this {
        this.activity = activity
        this.generateGridObject()
        return this
    }
    
    enableCoordinate(activity: boolean = true): this {
        this.text?.setVisible(activity)
        return this
    }

    private generateGridObject(): void {
        this.polygon?.destroy()
        this.text?.destroy()

        if (!this.activity) {
            return
        }
        const p1: Point2 = { x: this.isoW / 2, y: 0 }
        const p2: Point2 = getCoordFromPoint(p1, ISOMETRIC_ANGLE, this.side)
        const p3: Point2 = getCoordFromPoint(p2, 180 - ISOMETRIC_ANGLE, this.side)
        const p4: Point2 = getCoordFromPoint(p3, 180 + ISOMETRIC_ANGLE, this.side)

        this.polygon = this.scene.add.polygon(0, 0, [ p1, p2, p3, p4 ], 0, 0)
            .setStrokeStyle(this.thickness, this.strokeColor, 1)
            .setOrigin(0.25, 0.5)

        this.text = this.scene.add.text(0, 0, '', {
            fontSize: `${ getBigger(16, this.side/10) }px`,
            color: Phaser.Display.Color.ValueToColor(this.strokeColor).rgba
        }).setOrigin(0, 1).setVisible(false)
    }

    private updateText(): void {
        let { x, y } = this.pointer

        this.text?.setText(`${~~x},${~~y}`)
        x += (this.isoW / 4) * 3
        y -= (this.isoH / 4) * 3

        this.text?.setPosition(~~x, ~~y)
    }

    private updateCursor(): void {
        const { x, y } = this.pointer
        this.polygon?.setPosition(x, y)
    }

    update(): void {
        this.updateText()
        this.updateCursor()
    }

    destroy(): void {
        this.destroyObject()
    }
}

export { Plugin }