import Phaser from 'phaser'
import { TypedEmitter } from 'tiny-typed-emitter'
import {
    Point2,
    ISOMETRIC_ANGLE,
    getIsometricWidth,
    getIsometricHeight,
    getBigger,
    getCoordFromPoint,
    toCartesianCoord,
    toIsometricCoord,
} from '@common/Math/MathUtil'

interface RGBA {
    red: number
    green: number
    blue: number
    alpha: number
}

interface Rect {
    a: Point2
    b: Point2
}

interface SelectPluginEvents {
    'drag-start': (e: Phaser.Input.Pointer, selection: Rect) => void
    'drag': (e: Phaser.Input.Pointer, selection: Rect) => void
    'drag-end': (e: Phaser.Input.Pointer, selection: Rect) => void
}

class SelectPlugin extends Phaser.Plugins.ScenePlugin {
    readonly events: TypedEmitter<SelectPluginEvents> = new TypedEmitter
    private activity: boolean = false
    private rectangle: Phaser.GameObjects.Rectangle|null = null
    private thickness: number = 0
    private strokeColor: number = Phaser.Display.Color.GetColor(0, 255, 0)
    private strokeAlpha: number = 1
    private fillColor: number = Phaser.Display.Color.GetColor(0, 255, 0)
    private fillAlpha: number = 0.05

    private dragStartOffset: Point2 = { x: 0, y: 0 }
    private dragEndOffset: Point2 = { x: 0, y: 0 }
    private __selects: Set<Phaser.GameObjects.GameObject> = new Set

    constructor(scene: Phaser.Scene, pluginManager: Phaser.Plugins.PluginManager) {
        super(scene, pluginManager)
    }

    boot(): void {
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update.bind(this))
        this.scene.events.on(Phaser.Scenes.Events.DESTROY, this.destroy.bind(this))

        this.scene.input.on(Phaser.Input.Events.POINTER_DOWN, (e: Phaser.Input.Pointer): void => {
            switch (e.button) {
                case 0:
                    this.onMouseLeftDown(e)
                    break
            }
        })

        this.scene.input.on(Phaser.Input.Events.POINTER_UP, (e: Phaser.Input.Pointer): void => {
            switch (e.button) {
                case 0:
                    this.onMouseLeftUp(e)
                    break
            }
        })

        this.scene.input.on(Phaser.Input.Events.POINTER_MOVE, (e: Phaser.Input.Pointer): void => {
            switch (e.buttons) {
                case 1:
                    this.onMouseLeftDrag(e)
                    break
            }
        })

        this.generateRectangle()
    }

    get isEnabled(): boolean {
        return this.activity
    }

    get selection(): Rect {
        const empty: Rect = {
            a: { x: 0, y: 0 },
            b: { x: 0, y: 0 }
        }

        if (!this.rectangle) {
            return empty
        }

        if (!this.activity) {
            return empty
        }

        const a: Point2 = this.rectangle.getTopLeft()
        const b: Point2 = this.rectangle.getBottomRight()

        return {
            a: { x: a.x, y: a.y },
            b: { x: b.x, y: b.y }
        }
    }

    get selects(): Phaser.GameObjects.GameObject[] {
        return [ ...this.__selects ]
    }

    enable(activity: boolean = true): this {
        this.activity = activity
        
        if (!this.activity) {
            this.unselect()
            this.activeRectangle(false)
            this.setRectanglePosition(this.scene.input.activePointer)
            this.updateRectangleSize(this.scene.input.activePointer)
        }
        return this
    }

    private generateRectangle(): void {
        if (this.rectangle) {
            return
        }
        this.rectangle = this.scene.add.rectangle(0, 0, 0, 0, this.fillColor, this.fillAlpha)
        this.rectangle.setStrokeStyle(this.thickness, this.strokeColor, this.strokeAlpha)
        this.rectangle.setDepth(Phaser.Math.MAX_SAFE_INTEGER)
    }

    private destroyObject(): void {
        if (!this.rectangle) {
            return
        }
        this.rectangle.destroy()
        this.rectangle = null
    }

    private updateDragStartOffset(e: Phaser.Input.Pointer): void {
        this.dragStartOffset = {
            x: e.worldX,
            y: e.worldY
        }
    }

    private updateDragEndOffset(e: Phaser.Input.Pointer): void {
        this.dragEndOffset = {
            x: e.worldX,
            y: e.worldY
        }
    }

    private setRectanglePosition({ worldX, worldY }: Phaser.Input.Pointer): void {
        if (!this.rectangle) {
            return
        }
        this.rectangle.setPosition(worldX, worldY)
    }

    private updateRectangleSize({ worldX, worldY }: Phaser.Input.Pointer): void {
        if (!this.rectangle) {
            return
        }

        const distanceX: number = worldX - this.rectangle.x
        const distanceY: number = worldY - this.rectangle.y
        const width: number     = Math.abs(distanceX)
        const height: number    = Math.abs(distanceY)

        const originX: number = distanceX > 0 ? 0 : 1
        const originY: number = distanceY > 0 ? 0 : 1

        this.rectangle.setSize(width, height)
        this.rectangle.setOrigin(originX, originY)
    }

    private activeRectangle(activity: boolean): void {
        if (!this.rectangle) {
            return
        }
        this.rectangle.setActive(activity)
        this.rectangle.setVisible(activity)
    }

    private getObjectInRect({ a, b }: Rect, objects: Phaser.GameObjects.GameObject[]): Phaser.GameObjects.GameObject[] {
        if (!this.rectangle) {
            return []
        }
        
        const list: Phaser.GameObjects.GameObject[] = []
        for (const object of objects) {
            if ( !('x' in object) ) continue
            if ( !('y' in object) ) continue

            const target = object as Phaser.GameObjects.GameObject&Phaser.GameObjects.Components.Transform
            const { x, y } = target
            if (
                x > a.x && x < b.x &&
                y > a.y && y < b.y
            ) {
                list.push(target)
            }
        }
        return list
    }

    unselect(): void {
        this.__selects.clear()
    }

    select(selection: Rect, objects: Phaser.GameObjects.GameObject[] = this.scene.children.list): Phaser.GameObjects.GameObject[] {
        let list: Phaser.GameObjects.GameObject[] = []
        this.getObjectInRect(selection, objects).forEach((object): void => {
            this.__selects.add(object)
            list.push(object)
        })
        return this.selects
    }

    private onMouseLeftDown(e: Phaser.Input.Pointer): void {
        if (!this.activity) {
            return
        }

        this.updateDragStartOffset(e)

        this.setRectanglePosition(e)
        this.updateRectangleSize(e)
        this.activeRectangle(true)

        this.events.emit('drag-start', e, this.selection)
    }

    private onMouseLeftDrag(e: Phaser.Input.Pointer): void {
        if (!this.activity) {
            return
        }

        this.updateRectangleSize(e)
        
        this.events.emit('drag', e, this.selection)
    }

    private onMouseLeftUp(e: Phaser.Input.Pointer): void {
        if (!this.activity) {
            return
        }

        this.updateDragEndOffset(e)
        this.activeRectangle(false)

        this.events.emit('drag-end', e, this.selection)
    }

    setStrokeThickness(thickness: number): this {
        this.thickness = thickness
        this.generateRectangle()
        return this
    }

    setStrokeColor({ red, green, blue, alpha = 1 }: RGBA): this {
        this.strokeColor = Phaser.Display.Color.GetColor(red, green, blue)
        this.strokeAlpha = alpha
        this.generateRectangle()
        return this
    }

    setFillColor({ red, green, blue, alpha = 1 }: RGBA): this {
        this.fillColor = Phaser.Display.Color.GetColor(red, green, blue)
        this.fillAlpha = alpha
        this.generateRectangle()
        return this
    }

    update(time: number, delta: number): void {

    }

    destroy(): void {
        this.destroyObject()
    }
}

class PointerPlugin extends Phaser.Plugins.ScenePlugin {
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

    private get isoW(): number {
        return getIsometricWidth(this.side)
    }

    private get isoH(): number {
        return getIsometricHeight(this.side)
    }

    private get isoOrigin(): Point2 {
        const x: number = 0
        const y: number = 0
        return { x, y }
    }

    get isEnabled(): boolean {
        return this.activity
    }

    get pointer(): Point2 {
        const { worldX, worldY } = this.scene.input.activePointer

        if (!this.activity) {
            const x: number = worldX
            const y: number = worldY
            return { x, y }
        }

        return this.calcCursorOffset({ x: worldX, y: worldY })
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

    calcCursorOffset(point: Point2): Point2 {
        const isoOffset: Point2 = toIsometricCoord({
            x: point.x,
            y: point.y,
        }, this.isoOrigin.x, this.isoOrigin.y, this.isoW, this.isoH)

        const sceneOffset: Point2 = toCartesianCoord({
            x: Math.round(isoOffset.x),
            y: Math.round(isoOffset.y),
        }, this.isoOrigin.x, this.isoOrigin.y, this.isoW, this.isoH)

        const x: number = sceneOffset.x
        const y: number = sceneOffset.y

        return { x, y }
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
        if (!this.activity) {
            return
        }

        let { x, y } = this.pointer

        this.text?.setText(`${~~x},${~~y}`)
        x += (this.isoW / 4) * 3
        y -= (this.isoH / 4) * 3

        this.text?.setPosition(~~x, ~~y)
    }

    private updateCursor(): void {
        if (!this.activity) {
            return
        }

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

export { PointerPlugin, SelectPlugin }