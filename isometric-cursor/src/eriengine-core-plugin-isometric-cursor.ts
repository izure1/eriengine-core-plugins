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

    private __selects: Set<Phaser.GameObjects.GameObject> = new Set

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
      
      this.scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, (e: Phaser.Input.Pointer): void => {
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

    /** `enable` 메서드를 이용해 해당 기능이 활성화 되어 있는지 여부를 반환합니다. */
    get isEnabled(): boolean {
        return this.activity
    }

    /** 마지막으로 드래그하여 선택했던 사각형 범위를 반환합니다. */
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

    /** `select` 메서드를 이용하여 선택된 게임 오브젝트 목록을 반환합니다. */
    get selects(): Phaser.GameObjects.GameObject[] {
        return [ ...this.__selects ]
    }

    /**
     * 플러그인 활성화 여부를 설정합니다. 기본값은 `true`입니다.
     * 이 값을 `true`로 설정하면, 좌클릭 - 드래그로 드래그 박스를 활성화할 수 있습니다.
     * @param activity 활성화 여부입니다. 기본값은 `true`입니다.
     */
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

    /** 드래그 박스를 위한 게임 오브젝트를 생성합니다. 자동으로 호출되며, *직접 호출하지 마십시오.* */
    private generateRectangle(): void {
        if (this.rectangle) {
            return
        }
        this.rectangle = this.scene.add.rectangle(0, 0, 0, 0, this.fillColor, this.fillAlpha)
        this.rectangle.setStrokeStyle(this.thickness, this.strokeColor, this.strokeAlpha)
        this.rectangle.setDepth(Phaser.Math.MAX_SAFE_INTEGER)
    }

    /** 드래그 박스를 파괴합니다. 자동으로 호출되며, *직접 호출하지 마십시오.* */
    private destroyObject(): void {
        if (!this.rectangle) {
            return
        }
        this.rectangle.destroy()
        this.rectangle = null
    }

    /**
     * 드래그 박스의 위치를 갱신합니다. 자동으로 호출되며, *직접 호출하지 마십시오.*
     * @param param0 마우스 위치입니다.
     */
    private setRectanglePosition({ worldX, worldY }: Phaser.Input.Pointer): void {
        if (!this.rectangle) {
            return
        }
        this.rectangle.setPosition(worldX, worldY)
    }

    /**
     * 드래그 박스의 크기를 조절합니다. 자동으로 호출되며, *직접 호출하지 마십시오.*
     * @param param0 마우스 위치입니다.
     */
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

    /**
     * 드래그 박스의 활성화 여부를 결정합니다. 이 값에 따라 드래그 박스가 화면에 보일 것인지, 보이지 않을 것인지가 결정됩니다.
     * 자동으로 호출되며, *직접 호출하지 마십시오.*
     * @param activity 활성화 여부입니다.
     */
    private activeRectangle(activity: boolean): void {
        if (!this.rectangle) {
            return
        }
        this.rectangle.setActive(activity)
        this.rectangle.setVisible(activity)
    }

    /**
     * 사각형 정보 안에 있는 게임 오브젝트 목록을 반환합니다.
     * 이는 드래그 박스 내에 게임 오브젝트 목록을 얻어내는 용도로 사용됩니다.
     * 자동으로 호출되며, *직접 호출하지 마십시오.*
     * @param param0 사각형 정보입니다.
     * @param objects 검색할 게임 오브젝트 목록입니다.
     */
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

    /**
     * 선택된 게임 오브젝트 목록을 제거합니다.
     * 이 메서드를 사용하면 `this.selects` 목록이 초기화됩니다.
     */
    unselect(): void {
        this.__selects.clear()
    }

    /**
     * 사각형 내에 있는 게임 오브젝트 목록을 선택하여 지정합니다.
     * 이 메서드로 선택된 게임 오브젝트은 `this.selects` 속성을 이용하여 얻어낼 수 있습니다.
     * 간단하게 사용하는 방법은 아래와 같습니다.
     * @example
     * ```
     * scene.selectPlugin.events.on('drag-end', (e: Phaser.Input.Pointer, selection: Rect): void => {
     *   const selects = this.select(selection)
     *   console.log(selects)
     * })
     * ```
     * @param selection 사각형 정보입니다.
     * @param objects 게임 오브젝트 목록입니다. 기본값은 씬에 있는 모든 게임 오브젝트입니다.
     */
    select(selection: Rect, objects: Phaser.GameObjects.GameObject[] = this.scene.children.list): Phaser.GameObjects.GameObject[] {
        let list: Phaser.GameObjects.GameObject[] = []
        this.getObjectInRect(selection, objects).forEach((object): void => {
            this.__selects.add(object)
            list.push(object)
        })
        return this.selects
    }

    /**
     * 마우스 좌클릭을 시작했을 때 호출될 메서드입니다. 자동으로 호출되며, *직접 호출하지 마십시오.*
     * @param e 마우스 포인터 정보입니다.
     */
    private onMouseLeftDown(e: Phaser.Input.Pointer): void {
        if (!this.activity) {
            return
        }

        this.setRectanglePosition(e)
        this.updateRectangleSize(e)
        this.activeRectangle(true)

        this.events.emit('drag-start', e, this.selection)
    }

    /**
     * 마우스 좌클릭을 누른 상태로 움직임, 즉 드래그를 할 때 마다 호출될 메서드입니다.
     * 자동으로 호출되며, *직접 호출하지 마십시오.*
     * @param e 마우스 포인터 정보입니다.
     */
    private onMouseLeftDrag(e: Phaser.Input.Pointer): void {
        if (!this.activity) {
            return
        }

        this.updateRectangleSize(e)
        
        this.events.emit('drag', e, this.selection)
    }

    /**
     * 마우스 좌클릭을 땠을 때 호출될 메서드입니다. 자동으로 호출되며, *직접 호출하지 마십시오.*
     * @param e 마우스 포인터 정보입니다.
     */
    private onMouseLeftUp(e: Phaser.Input.Pointer): void {
        if (!this.activity) {
            return
        }

        this.activeRectangle(false)

        this.events.emit('drag-end', e, this.selection)
    }

    /**
     * 드래그 박스의 테두리 두께를 설정합니다. `0`으로 지정하면 테두리가 사라집니다.
     * @param thickness 테두리 두께입니다.
     */
    setStrokeThickness(thickness: number): this {
        this.thickness = thickness
        this.generateRectangle()
        return this
    }

    /**
     * 드래그 박스의 테두리 색상을 설정합니다.
     * @param param0 rgba 값 정보입니다.
     */
    setStrokeColor({ red, green, blue, alpha = 1 }: RGBA): this {
        this.strokeColor = Phaser.Display.Color.GetColor(red, green, blue)
        this.strokeAlpha = alpha
        this.generateRectangle()
        return this
    }

    /**
     * 드래그 박스의 색상을 설정합니다.
     * @param param0 rgba 값 정보입니다.
     */
    setFillColor({ red, green, blue, alpha = 1 }: RGBA): this {
        this.fillColor = Phaser.Display.Color.GetColor(red, green, blue)
        this.fillAlpha = alpha
        this.generateRectangle()
        return this
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

    boot(): void {
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update.bind(this))
        this.scene.events.on(Phaser.Scenes.Events.DESTROY, this.destroy.bind(this))
    }

    /** 커서 포인터의 가로 너비를 반환합니다. */
    private get isoW(): number {
        return getIsometricWidth(this.side)
    }

    /** 커서 포인터의 세로 높이를 반환합니다. */
    private get isoH(): number {
        return getIsometricHeight(this.side)
    }

    private get isoOrigin(): Point2 {
        const x: number = 0
        const y: number = 0
        return { x, y }
    }

    /** `enable` 메서드를 이용해 해당 기능이 활성화 되어 있는지 여부를 반환합니다. */
    get isEnabled(): boolean {
        return this.activity
    }

    /** 아이소메트릭 커서 포인터의 좌표를 반환합니다. */
    get pointer(): Point2 {
        const { worldX, worldY } = this.scene.input.activePointer

        if (!this.activity) {
            const x: number = worldX
            const y: number = worldY
            return { x, y }
        }

        return this.calcCursorOffset({ x: worldX, y: worldY })
    }

    /** 아이소메트릭 커서 포인터의 x좌표를 반환합니다. `this.pointer.x`와 같습니다. */
    get pointerX(): number {
        return this.pointer.x
    }
    
    /** 아이소메트릭 커서 포인터의 y좌표를 반환합니다. `this.pointer.y`와 같습니다. */
    get pointerY(): number {
        return this.pointer.y
    }

    /** 커서 포인터 게임 오브젝트를 파괴합니다. 자동으로 호출되며, *직접 호출하지 마십시오.* */
    private destroyObject(): void {
        if (!this.polygon) {
            return
        }
        this.polygon.destroy()
        this.polygon = null
    }

    /**
     * 씬의 좌표를 아이소메트릭 커서 포인터 좌표로 변환합니다.
     * 커서 포인터의 좌표는 실제 마우스 포인터의 위치와 동일하지 않습니다. 커서 포인터 크기에 따라 달라지기 때문입니다.
     * 이 메서드는 커서 포인터 크기를 이용하여 특정 씬의 좌표 위치를 커서 포인터의 위치로 변환할 수 있습니다.
     * @param point 씬의 좌표입니다.
     * @param side 아이소메트릭 커서의 한 변의 길이입니다. 기본값은 `this.side` 입니다.
     * @param isoOrigin 아이소메트릭 xy좌표 `0,0`가 데카르트 좌표로 어느 위치인지 기준점을 지정합니다. 기본값은 `0,0` 입니다.
     */
    calcCursorOffset(point: Point2, side: number = this.side, isoOrigin: Point2 = this.isoOrigin): Point2 {
      const isoW = getIsometricWidth(side)
      const isoH = getIsometricHeight(side)
      const isoOffset: Point2 = toIsometricCoord({
        x: point.x,
        y: point.y,
      }, isoOrigin.x, isoOrigin.y, isoW, isoH)

      const sceneOffset: Point2 = toCartesianCoord({
        x: Math.round(isoOffset.x),
        y: Math.round(isoOffset.y),
      }, isoOrigin.x, isoOrigin.y, isoW, isoH)

      const x: number = sceneOffset.x
      const y: number = sceneOffset.y

      return { x, y }
    }

    /**
     * 커서 포인터의 크기를 지정합니다.
     * @param side 커서 포인터 그리드의 한 변의 크기입니다.
     */
    setGridSide(side: number): this {
        this.side = side
        this.generateGridObject()
        return this
    }

    /**
     * 커서 포인터 테두리 두께를 설정합니다. `0`으로 지정하면 테두리가 사라집니다.
     * @param thickness 테두리 두께입니다.
     */
    setStrokeThickness(thickness: number): this {
        this.thickness = thickness
        this.generateGridObject()
        return this
    }

    /**
     * 커서 포인터 테두리 색상을 설정합니다.
     * @param param0 rgba 값 정보입니다.
     */
    setStrokeColor({ red, green, blue, alpha = 1 }: RGBA): this {
        this.strokeColor = Phaser.Display.Color.GetColor32(red, green, blue, alpha)
        this.generateGridObject()
        return this
    }

    /**
     * 플러그인 활성화 여부를 설정합니다. 기본값은 `true`입니다.
     * 이 값을 `true`로 설정하면, 커서 포인터를 활성화할 수 있습니다.
     * @param activity 활성화 여부입니다. 기본값은 `true`입니다.
     */
    enable(activity: boolean = true): this {
        this.activity = activity
        this.generateGridObject()
        return this
    }
    
    /**
     * 커서 옆에 좌표를 표시할지 여부를 지정합니다.
     * @param activity 좌표 표시 여부입니다. 기본값은 `true`입니다.
     */
    enableCoordinate(activity: boolean = true): this {
        this.text?.setVisible(activity)
        return this
    }

    /** 커서 포인터 게임 오브젝트를 생성합니다. 자동으로 호출되며, *직접 호출하지 마십시오.* */
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

    /**
     * `enableCoordinate` 메서드를 사용했을 때, 커서 포인터 텍스트의 좌표 텍스트를 갱신합니다.
     * 자동으로 호출되며, *직접 호출하지 마십시오.*
     */
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

    /**
     * 현재 마우스 포인터 위치를 기반으로 커서 포인터의 위치를 갱신합니다.
     * 자동으로 호출되며, *직접 호출하지 마십시오.*
     */
    private updateCursor(): void {
        if (!this.activity) {
            return
        }

        const { x, y } = this.pointer
        this.polygon?.setPosition(x, y)
    }

    /**
     * 씬이 매 프레임 업데이트 될 때 마다 호출될 메서드입니다.
     * 씬이 일시중지되었거나,파괴되었다면 더 이상 호출되지 않습니다.  
     * *절대 직접 호출하지 마십시오.*
     */
    update(): void {
        this.updateText()
        this.updateCursor()
    }

    destroy(): void {
        this.destroyObject()
    }
}

export { PointerPlugin, SelectPlugin }