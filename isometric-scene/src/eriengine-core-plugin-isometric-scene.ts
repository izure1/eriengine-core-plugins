import Phaser from 'phaser'
import * as EasyStar from 'easystarjs'
import {
    Point2,
    getIsometricWidth,
    getIsometricHeight,
    getCoordFromPoint,
    toCartesianCoord,
    toIsometricCoord,
    GridObject,
    create2DArray,
    fillItemInArray
} from '@common/Math/MathUtil'
import { WallObstacle } from './Tiles/WallObstacle'

type IsometricObject = Phaser.GameObjects.GameObject&GridObject

class Plugin extends Phaser.Plugins.ScenePlugin {
    private readonly easystarset: Set<EasyStar.js> = new Set
    private readonly center: Point2 = { x: 0, y: 0 }
    private readonly gridScale: number = 30
    private readonly tiles: Map<string, Phaser.GameObjects.Sprite> = new Map
    private readonly walls: Map<string, Phaser.Physics.Matter.Sprite> = new Map
    private side: number = 3000
    private bounds: MatterJS.BodyType|null = null

    constructor(scene: Phaser.Scene, pluginManager: Phaser.Plugins.PluginManager) {
        super(scene, pluginManager)
    }

    boot(): void {
        this.scene.events.once(Phaser.Scenes.Events.CREATE, (): void => {
            this.setWorldSize(3000)
        })
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update.bind(this))
        this.scene.events.on(Phaser.Scenes.Events.DESTROY, this.destroy.bind(this))
    }

    update(time: number, delta: number): void {
        for (const easystar of this.easystarset.values()) {
            easystar.calculate()
        }
    }

    destroy(): void {
        this.destroyTiles()
        this.destroyWalls()
        this.easystarset.clear()
    }

    get obstacles(): IsometricObject[] {
        return this.scene.children.list.filter((children: Phaser.GameObjects.GameObject): boolean => {
            if (!children.active) {
                return false
            }
            if (!children.body) {
                return false
            }
            if ( !('side' in children) ) {
                return false
            }
            return true
        }) as IsometricObject[]
    }

    private get isoOrigin(): Point2 {
        const x: number = this.center.x
        const y: number = getIsometricHeight(this.side) * -1
        return { x, y }
    }

    private get isoW(): number {
        return getIsometricWidth(this.gridScale)
    }

    private get isoH(): number {
        return getIsometricHeight(this.gridScale)
    }

    private get gridSize(): number {
        return Math.floor(this.side / this.gridScale)
    }

    get size(): Point2 {
        const rad = Phaser.Math.DegToRad(26.57)
        const x: number = (Math.cos(rad) * this.side) * 2
        const y: number = (Math.sin(rad) * this.side) * 2
        return { x, y }
    }

    toCartesianCoord(coord: Point2): Point2 {
        return toCartesianCoord(coord, this.isoOrigin.x, this.isoOrigin.y, this.isoW, this.isoH)
    }
    
    toIsometricCoord(coord: Point2): Point2 {
        return toIsometricCoord(coord, this.isoOrigin.x, this.isoOrigin.y, this.isoW, this.isoH)
    }

    toSceneCoord({ x, y }: Point2): Point2 {
        const { main } = this.scene.cameras
        const zoom: number = main.zoom
        x /= zoom
        y /= zoom
        x += (main.midPoint.x - main.width / 2 / zoom)
        y += (main.midPoint.y - main.height / 2 / zoom)
        return { x, y }
    }

    toCanvasCoord({ x, y }: Point2): Point2 {
        const { main } = this.scene.cameras
        const zoom: number = main.zoom
        x -= (main.midPoint.x - main.width / 2 / zoom)
        y -= (main.midPoint.y - main.height / 2 / zoom)
        x *= zoom
        y *= zoom
        return { x, y }
    }

    private generateBounds(): void {
        const { x, y } = this.size
        const angle: number = 26.57
        const thickness: number = 500
        const p1 = { x: 0, y: 0 }
        const p2 = getCoordFromPoint(p1, angle, this.side)
        const p3 = getCoordFromPoint(p2, 180 - angle, this.side)
        const p4 = getCoordFromPoint(p3, 180 + angle, this.side)
        const p5 = p1
        const p6 = getCoordFromPoint(p5, -90, thickness)
        const p7 = getCoordFromPoint(p6, 180, (x / 2) + thickness)
        const p8 = getCoordFromPoint(p7, 90, y + thickness * 2 )
        const p9 = getCoordFromPoint(p8, 0, x + thickness * 2 )
        const p10 = getCoordFromPoint(p9, -90, y + thickness * 2 )
        const p11 = p6

        // isometric shape wall
        if (this.bounds) {
            this.scene.matter.world.remove(this.bounds)
        }
        this.bounds = this.scene.matter.add.fromVertices(this.center.x, this.center.y, [
            p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11
        ], { isStatic: true })

        // 카메라 장벽을 설정합니다. 이 장벽 너머로 카메라가 볼 수 없습니다.
        this.scene.cameras.main.setBounds(
            this.center.x - (x / 2),
            this.center.y - (y / 2),
            x, y
        )
    }

    setWorldSize(size: number): this {
        this.side = size
        this.generateBounds()
        return this
    }

    private getCoordKey(x: number, y: number): string {
        return `${x}:${y}`
    }

    setWalltile(x: number, y: number, side: number, texture: string, frame?: string|number, animation?: string|Phaser.Types.Animations.PlayAnimationConfig): this {
        const wall: WallObstacle = new WallObstacle(this.scene.matter.world, x, y, texture, frame)

        wall.addToScene()
        wall.setDepth(y)
        wall.setStatic(true)
        wall.displayWidth = getIsometricWidth(side) * 2

        if (animation) {
            wall.play(animation)
        }

        const key: string = this.getCoordKey(x, y)
        if (this.walls.has(key)) {
            this.walls.get(key)?.destroy()
        }
        this.walls.set(key, wall)
        return this
    }

    setFloortile(x: number, y: number, side: number, texture: Phaser.Textures.Texture|string, frame?: string|number, animation?: string|Phaser.Types.Animations.PlayAnimationConfig): this {
        const tile: Phaser.GameObjects.Sprite = this.scene.add.sprite(x, y, texture, frame)
        
        tile.setDepth(Phaser.Math.MIN_SAFE_INTEGER)
        tile.setDisplaySize(getIsometricWidth(side)*2, getIsometricHeight(side)*2)

        if (animation) {
            tile.play(animation, true)
        }

        const key: string = this.getCoordKey(x, y)
        if (this.tiles.has(key)) {
            this.tiles.get(key)?.destroy()
        }
        this.tiles.set(key, tile)
        return this
    }

    private destroyWalls(): void {
        for (const wall of this.walls.values()) {
            wall.destroy()
        }
        this.walls.clear()
    }

    private destroyTiles(): void {
        for (const tile of this.tiles.values()) {
            tile.destroy()
        }
        this.tiles.clear()
    }

    private addPathFinding(easystar: EasyStar.js): void {
        this.easystarset.add(easystar)
    }

    private dropPathFinding(easystar: EasyStar.js): void {
        this.easystarset.delete(easystar)
    }

    async getRoutes(target: IsometricObject, to: Point2): Promise<Point2[]> {
        return new Promise((resolve, reject) => {
            // 맵의 정보를 담을 그리드를 만듭니다.
            const grid: number[][]              = create2DArray(this.gridSize, this.gridSize, 0)
            const obstacles: IsometricObject[]  = this.obstacles.filter((obstacle: IsometricObject): boolean => obstacle !== target)

            // 그리드에서 장애물 블록을 배치합니다.
            for (const obstacle of obstacles) {
                const isoCoord: Point2          = this.toIsometricCoord(obstacle)
                const isoMarginRadius: number   = ((target.side + obstacle.side) / this.gridScale)/2

                let x1: number = Math.floor(isoCoord.x - isoMarginRadius)
                let x2: number = Math.ceil(isoCoord.x + isoMarginRadius)
                let y1: number = Math.floor(isoCoord.y - isoMarginRadius)
                let y2: number = Math.ceil(isoCoord.y + isoMarginRadius)

                if (x1 > this.gridSize) x1 = this.gridSize
                if (x2 > this.gridSize) x2 = this.gridSize
                if (y1 > this.gridSize) y1 = this.gridSize
                if (y2 > this.gridSize) y2 = this.gridSize
                if (x1 < 0) x1 = 0
                if (x2 < 0) x2 = 0
                if (y1 < 0) y1 = 0
                if (y2 < 0) y2 = 0

                for (let y: number = y1; y < y2; y++) {
                    for (let x: number = x1; x < x2; x++) {
                        fillItemInArray(grid, { x, y }, 1)
                    }
                }
            }

            // 시작과 도착 좌표를 아이소메트릭 좌표로 변환합니다.
            const fromIsoGrid: Point2   = this.toIsometricCoord({ x: target.x, y: target.y })
            const toIsoGrid: Point2     = this.toIsometricCoord({ x: to.x, y: to.y })

            const easystar: EasyStar.js = new EasyStar.js
            easystar.setGrid(grid)
            easystar.setAcceptableTiles(0)                          // '0'은 지나갈 수 있는 그리드 블록입니다.
            easystar.enableDiagonals()                              // 대각선 이동을 허용합니다.
            easystar.enableCornerCutting()                          // 코너 이동을 허용합니다.
            easystar.setIterationsPerCalculation(100)               // 계산 속도를 설정합니다.

            easystar.findPath(
                Math.round(fromIsoGrid.x),
                Math.round(fromIsoGrid.y),
                Math.round(toIsoGrid.x),
                Math.round(toIsoGrid.y),
                (paths: Point2[]): void => {
                    this.dropPathFinding(easystar)
                    // 경로를 찾기 못하였음
                    if (!paths) {
                        return reject()
                    }
                    const cartesian: Point2[] = paths.map((path: Point2): Point2 => this.toCartesianCoord(path))
                    cartesian.push(to)
                    resolve(cartesian)
                }
            )
            this.addPathFinding(easystar)
        })
    }
}

export { Plugin }