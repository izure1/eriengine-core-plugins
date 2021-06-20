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
    fillItemInArray,
    createIsometricDiamondPoints
} from '@common/Math/MathUtil'
import { IsometricWall } from './Tiles/Wall'
import { IsometricFloor } from './Tiles/Floor'

type IsometricObject = Phaser.GameObjects.GameObject&GridObject

class Plugin extends Phaser.Plugins.ScenePlugin {
  private readonly easystarset: Set<EasyStar.js> = new Set
  private readonly center: Point2 = { x: 0, y: 0 }
  private readonly gridScale: number = 30
  private readonly __floors: Map<string, IsometricFloor> = new Map
  private readonly __walls: Map<string, IsometricWall> = new Map
  private readonly __sensors: Map<string, MatterJS.BodyType> = new Map
  private side: number = 3000
  private bounds: MatterJS.BodyType|null = null

  boot(): void {
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update.bind(this))
    this.scene.events.on(Phaser.Scenes.Events.DESTROY, this.destroy.bind(this))
  }

  /**
   * 씬이 매 프레임 업데이트 될 때 마다 호출될 메서드입니다.
   * 씬이 일시중지되었거나,파괴되었다면 더 이상 호출되지 않습니다.  
   * *절대 직접 호출하지 마십시오.*
   * @param time 씬이 시작한 후 흐른 시간(ms)입니다.
   * @param delta 이전 프레임과 현재 프레임 사이에 흐른 시간(ms)입니다. 게임은 일반적으로 60프레임이므로, 1/60초인 0.016초입니다.
   */
  update(time: number, delta: number): void {
    for (const easystar of this.easystarset.values()) {
      easystar.calculate()
    }
  }

  destroy(): void {
    this.destroyFloors()
    this.destroyWalls()
    this.destroySensors()
    this.destroyBounds()

    this.easystarset.clear()
  }

  /** `setWalltile` 메서드로 씬에 설치된 벽 목록을 반환합니다. */
  get walls(): IsometricWall[] {
    return [ ...this.__walls.values() ]
  }
  
  /** `setFloortile` 메서드로 씬에 설치된 바닥 타일 목록을 반환합니다. */
  get floors(): IsometricFloor[] {
    return [ ...this.__floors.values() ]
  }

  /** `setSensortile` 메서드로 씬에 설치된 센서 목록을 반환합니다. */
  get sensors(): MatterJS.BodyType[] {
    return [ ...this.__sensors.values() ]
  }

  /**
   * 씬에 존재하는 장애물 게임 오브젝트 목록을 반환합니다.
   * 게임 오브젝트가 물리 충돌체 속성(`body`)을 가지고 있으면서 반경 속성(`side`)을 가지고 있으면, 이 목록에 포함됩니다.
   * 게임 오브젝트가 활성화(`active`)되어 있지 않다면 포함되지 않습니다.
   */
  get obstacles(): IsometricObject[] {
    return this.scene.children.list.filter((children) => {
      if (!children.active) {
        return false
      }

      if (!children.body) {
        return false
      }

      if (
        (children as any).isSensor &&
        (children as any).isSensor.call &&
        (children as any).isSensor()
      ) {
        return false
      }

      if ( !('side' in children) ) {
        return false
      }

      return true
    }) as IsometricObject[]
  }

  /** 아이소메트릭 씬의 중심 좌표(0, 0)에 대칭되는 월드 좌표를 가져옵니다. */
  private get isoOrigin(): Point2 {
    const x = this.center.x
    const y = getIsometricHeight(this.side) * -1
    return { x, y }
  }

  /** 아이소메트릭 그리드 한 칸의 가로 너비를 반환합니다. 이 값은 `this.gridScale` 속성에 영향을 받습니다. */
  private get isoW(): number {
    return getIsometricWidth(this.gridScale)
  }

  /** 아이소메트릭 그리드 한 칸의 세로 높이를 반환합니다. 이 값은 `this.gridScale` 속성에 영향을 받습니다. */
  private get isoH(): number {
    return getIsometricHeight(this.gridScale)
  }

  /** 아이소메트릭 씬의 한 변이 몇 개의 그리드로 이루어져있는지를 반환합니다. `this.side`, `this.gridScale`의 영향을 받습니다. */
  private get gridSize(): number {
    return Math.floor(this.side / this.gridScale)
  }

  /** 아이소메트릭 씬의 가로세로 크기를 반환합니다. */
  get size(): Point2 {
    const rad = Phaser.Math.DegToRad(26.57)
    const x = (Math.cos(rad) * this.side) * 2
    const y = (Math.sin(rad) * this.side) * 2
    return { x, y }
  }

  /**
   * 아이소메트릭 좌표를 씬의 월드 좌표로 변환하여 반환합니다.
   * @param coord 아이소메트릭 좌표입니다.
   */
  toCartesianCoord(coord: Point2): Point2 {
    return toCartesianCoord(coord, this.isoOrigin.x, this.isoOrigin.y, this.isoW, this.isoH)
  }
  
  /**
   * 씬의 월드좌표를 아이소메트릭 좌표로 변환하여 반환합니다.
   * @param coord 씬의 월드 좌표입니다.
   */
  toIsometricCoord(coord: Point2): Point2 {
    return toIsometricCoord(coord, this.isoOrigin.x, this.isoOrigin.y, this.isoW, this.isoH)
  }

  /** 씬에 아이소메트릭 월드 경계를 생성합니다. 자동으로 호출되며, *직접 호출하지 마십시오.* */
  private generateBounds(): void {
    const { x, y } = this.size
    const angle = 26.57
    const thickness = 500
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
    this.destroyBounds()

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

  /** 씬에 아이소메트릭 월드 경계를 파괴합니다. 자동으로 호출되며, *직접 호출하지 마십시오.* */
  private destroyBounds(): void {
    if (this.bounds) {
      this.scene?.matter?.world?.remove(this.bounds)
      this.scene?.cameras?.main?.removeBounds()
    }
  }

  /**
   * 씬의 아이소메트릭 월드 경계 크기를 지정합니다. 이 값은 아이소메트릭 한 변의 크기를 의미합니다.
   * @param side 경계의 변의 크기입니다.
   */
  setWorldSize(side: number): this {
    this.side = side

    this.generateBounds()

    return this
  }

  /**
   * 좌표를 고유키 문자열로 반환합니다. 플러그인 내부 시스템에서 사용합니다.
   * @param x x좌표입니다.
   * @param y y좌표입니다.
   */
  private getCoordKey(x: number, y: number): string {
    return `${x}:${y}`
  }

  /**
   * `getCoordKey` 메서드로 변환된 고유키 문자열을 다시 좌표로 변환합니다.
   * @param key 고유키 문자열입니다.
   */
  private getCoordFromKey(key: string): Point2|null {
    const [ x, y ] = key.split(':')
    if (x === undefined || y === undefined) {
      return null
    }

    return {
      x: Number(x),
      y: Number(y)
    }
  }

  /**
   * 씬에 아이소메트릭 물리 충돌체를 생성합니다. 이 충돌체는 고정(`static`)되어 있으며, 벽이나 장애물을 설치하는 용도로 사용됩니다.
   * @param x 충돌체가 생성될 x좌표입니다.
   * @param y 충돌체가 생성될 y좌표입니다.
   * @param texture 충돌체가 가질 텍스쳐입니다.
   * @param frame 충돌체가 가질 프레임 시작값입니다.
   * @param animation 충돌체가 가질 애니메이션 설정입니다.
   */
  setWalltile(x: number, y: number, texture: string, frame?: string|number, animation?: string|Phaser.Types.Animations.PlayAnimationConfig): IsometricWall {
    const wall = new IsometricWall(this.scene.matter.world, x, y, texture, frame)

    this.scene.add.existing(wall)

    if (animation) {
      wall.play(animation)
    }

    const key = this.getCoordKey(x, y)

    this.__walls.get(key)?.destroy()
    this.__walls.set(key, wall)

    wall.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.__walls.delete(key)
    })

    return wall
  }

  /**
   * 씬에 아이소메트릭 바닥타일 이미지를 생성합니다. 바닥 타일 이미지는 충돌체를 가지지 않은 단순한 이미지입니다.
   * @param x 바닥 타일이 생성될 x좌표입니다.
   * @param y 바닥 타일이 생성될 y좌표입니다.
   * @param texture 바닥 타일이 가질 텍스쳐입니다.
   * @param frame 바닥 타일이 가질 프레임 시작값입니다.
   * @param animation 바닥 타일이 가질 애니메이션 설정입니다.
   */
  setFloortile(x: number, y: number, texture: Phaser.Textures.Texture|string, frame?: string|number, animation?: string|Phaser.Types.Animations.PlayAnimationConfig): Phaser.GameObjects.Sprite {
    const floor = new IsometricFloor(this.scene, x, y, texture, frame)
    
    this.scene.add.existing(floor)

    if (animation) {
      floor.play(animation, true)
    }

    const key = this.getCoordKey(x, y)

    this.__floors.get(key)?.destroy()
    this.__floors.set(key, floor)

    floor.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.__floors.delete(key)
    })

    return floor
  }

  /**
   * 씬에 아이소메트릭 센서를 설치합니다. 센서는 물리 충돌체를 가지지 않지만, 물리 충돌 이벤트를 얻어낼 수 있습니다.
   * @param x 센서가 생성될 x좌표입니다.
   * @param y 센서가 생성될 y좌표입니다.
   * @param side 센서가 가질 한 변의 크기입니다.
   */
  setSensortile(x: number, y: number, side: number): MatterJS.BodyType {
    const width = getIsometricWidth(side) * 2
    const vertices = createIsometricDiamondPoints(width)
    const sensor = this.scene.matter.add.fromVertices(x, y, vertices, { isStatic: true, isSensor: true })

    const key = this.getCoordKey(x, y)

    if (this.__sensors.has(key)) {
      const before = this.__sensors.get(key)!
      
      this.scene.matter.world.remove(before)
    }
    this.__sensors.set(key, sensor)

    this.scene.matter.world.on(Phaser.Physics.Matter.Events.AFTER_REMOVE, () => {
      this.__sensors.delete(key)
    })

    return sensor
  }

  /**
   * `setWalltile` 메서드로 해당 좌표에 설치된 아이소메트릭 벽 타일을 제거합니다.
   * @param x 설치된 벽의 x좌표입니다.
   * @param y 설치된 벽의 y좌표입니다.
   */
  removeWalltile(x: number, y: number): this {
    const key = this.getCoordKey(x, y)
    this.__walls.get(key)?.destroy()

    return this
  }

  /**
   * `setFloortile` 메서드로 해당 좌표에 설치된 아이소메트릭 바닥 타일을 제거합니다.
   * @param x 설치된 바닥 타일의 x좌표입니다.
   * @param y 설치된 바닥 타일의 y좌표입니다.
   */
  removeFloortile(x: number, y: number): this {
    const key = this.getCoordKey(x, y)
    this.__floors.get(key)?.destroy()

    return this
  }

  /**
   * `setSensortile` 메서드로 해당 좌표에 설치된 아이소메트릭 센서를 제거합니다.
   * @param x 설치된 센서의 x좌표입니다.
   * @param y 설치된 센서의 y좌표입니다.
   */
  removeSensortile(x: number, y: number): this {
    const key = this.getCoordKey(x, y)
    if (this.__sensors.has(key)) {
      const sensor = this.__sensors.get(key)!

      this.scene.matter.world.remove(sensor)
    }

    return this
  }

  /** `setWalltile` 메서드로 설치된 모든 아이소메트릭 벽 타일을 제거합니다. */
  destroyWalls(): this {
    for (const key of this.__walls.keys()) {
      const coord = this.getCoordFromKey(key)
      if (!coord) {
        continue
      }

      this.removeWalltile(coord.x, coord.y)
    }
    
    this.__walls.clear()

    return this
  }

  /** `setFloortile` 메서드로 설치된 모든 아이소메트릭 벽 타일을 제거합니다. */
  destroyFloors(): this {
    for (const key of this.__floors.keys()) {
      const coord = this.getCoordFromKey(key)
      if (!coord) {
        continue
      }
      
      this.removeFloortile(coord.x, coord.y)
    }

    this.__floors.clear()

    return this
  }

  /** `setSensortile` 메서드로 설치된 모든 아이소메트릭 센서를 제거합니다. */
  destroySensors(): this {
    for (const key of this.__sensors.keys()) {
      const coord = this.getCoordFromKey(key)
      if (!coord) {
          continue
      }
      
      this.removeSensortile(coord.x, coord.y)
    }

    this.__sensors.clear()

    return this
  }

  /**
   * 경로 탐색 인스턴스를 계산 목록에 추가합니다.
   * 자동으로 호출되며, *직접 호출하지 마십시오.*
   * @param easystar 경로 탐색 인스턴스입니다.
   */
  private addPathFinding(easystar: EasyStar.js): void {
    this.easystarset.add(easystar)
  }

  /**
   * 경로 탐색 인스턴스를 계산 목록에서 제거합니다.
   * 자동으로 호출되며, *직접 호출하지 마십시오.*
   * @param easystar 경로 탐색 인스턴스입니다.
   */
  private dropPathFinding(easystar: EasyStar.js): void {
    this.easystarset.delete(easystar)
  }

  /**
   * 아이소메트릭 오브젝트가 현재 위치에서 목표 좌표까지 길을 찾아 이동할 수 있는 경로 목록을 반환합니다.
   * 장애물 목록(`this.obstacles`)을 피해갑니다. 만약 목표 좌표까지 갈 수 있는 길을 찾을 수 없다면 프로미스 에러를 발생시킵니다.
   * @param target 아이소메트릭 오브젝트입니다. `active: boolean`, `x: number`, `y: number`, `side: number` 속성을 가지고 있어야 합니다.
   * @param to 목표 좌표입니다.
   */
  async getRoutes(target: IsometricObject, to: Point2): Promise<Point2[]> {
    return new Promise((resolve, reject) => {
      // 맵의 정보를 담을 그리드를 만듭니다.
      const grid = create2DArray(this.gridSize, this.gridSize, 0)
      const obstacles = this.obstacles.filter((obstacle: IsometricObject): boolean => obstacle !== target)

      // 그리드에서 장애물 블록을 배치합니다.
      for (const obstacle of obstacles) {
        const isoCoord = this.toIsometricCoord(obstacle)
        const isoMarginRadius = ((target.side + obstacle.side) / this.gridScale)/2

        let x1 = Math.floor(isoCoord.x - isoMarginRadius)
        let x2 = Math.ceil(isoCoord.x + isoMarginRadius)
        let y1 = Math.floor(isoCoord.y - isoMarginRadius)
        let y2 = Math.ceil(isoCoord.y + isoMarginRadius)

        if (x1 > this.gridSize) x1 = this.gridSize
        if (x2 > this.gridSize) x2 = this.gridSize
        if (y1 > this.gridSize) y1 = this.gridSize
        if (y2 > this.gridSize) y2 = this.gridSize
        if (x1 < 0) x1 = 0
        if (x2 < 0) x2 = 0
        if (y1 < 0) y1 = 0
        if (y2 < 0) y2 = 0

        for (let y = y1; y < y2; y++) {
          for (let x = x1; x < x2; x++) {
            fillItemInArray(grid, { x, y }, 1)
          }
        }
      }

      // 시작과 도착 좌표를 아이소메트릭 좌표로 변환합니다.
      const fromIsoGrid = this.toIsometricCoord({ x: target.x, y: target.y })
      const toIsoGrid = this.toIsometricCoord({ x: to.x, y: to.y })

      const easystar = new EasyStar.js

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
        (paths) => {
          this.dropPathFinding(easystar)

          // 경로를 찾기 못하였음
          if (!paths) {
            return reject()
          }

          const cartesian = paths.map((path) => this.toCartesianCoord(path))
          cartesian.push(to)

          resolve(cartesian)
        }
      )
      this.addPathFinding(easystar)
    })
  }
}

export { Plugin }