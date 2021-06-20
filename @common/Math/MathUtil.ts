export interface Point2 {
    x: number
    y: number
}
export interface Vector2 extends Point2 {}
export interface GridObject extends Point2 { side: number }

export const ISOMETRIC_ANGLE: number = 26.57

/**
 * 도를 라디안으로 치환하여 반환합니다.
 * @param angle 각도입니다.
 */
export function angleToRad(angle: number): number {
    return (Math.PI / 180) * angle
}

/**
 * 라디안을 각도로 치환하여 반환합니다.
 * @param rad 라디안입니다.
 */
export function radToAngle(rad: number): number {
    return (180 / Math.PI) * rad
}

export function getIsometricHeight(side: number): number {
    return Math.sin(angleToRad(ISOMETRIC_ANGLE)) * side
}

export function getIsometricWidth(side: number): number {
    return Math.cos(angleToRad(ISOMETRIC_ANGLE)) * side
}

export function getIsometricSide(width: number): number {
    const height: number = width / 2
    return getDiagonal(width, height)
}

/**
 * 포인트로부터 극좌표의 위치를 반환합니다.
 * @param point 시작 포인트입니다.
 * @param angle 각도입니다.
 * @param radius 거리입니다.
 */
export function getCoordFromPoint(point: Point2, angle: number, radius: number): Point2 {
    const rad: number = angleToRad(angle)
    const x: number = Math.round(Math.cos(rad) * radius + point.x)
    const y: number = Math.round(Math.sin(rad) * radius + point.y)
    return { x, y }
}

/**
 * 사각형의 대각선의 길이를 반환합니다.
 * @param width 사각형의 가로 길이입니다.
 * @param height 사각형의 세로 길이입니다.
 */
export function getDiagonal(width: number, height: number): number {
    return Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2))
}

/**
 * 두 포인트 사이의 거리를 반환합니다.
 * @param a 포인트a 입니다.
 * @param b 포인트b 입니다.
 */
export function getDistanceBetween(a: Point2, b: Point2): number {
    const x: number = Math.abs(a.x - b.x)
    const y: number = Math.abs(a.y - b.y)
    return getDiagonal(x, y)
}

/**
 * 값이 목표치에 근접했는지 여부를 반환합니다.
 * @param to 목표치 값입니다.
 * @param current 현재 값입니다.
 * @param r 오차범위입니다.
 */
export function isApproximated(to: number, current: number, r: number): boolean {
    if (to > current) return to - current < r
    else return current - to < r
}

/**
 * 더 큰 수를 반환합니다.
 * @param a 값a 입니다.
 * @param b 값b 입니다.
 */
export function getBigger(a: number, b: number): number {
    if (a > b) return a
    else return b
}

/**
 * 더 작은 수를 반환합니다.
 * @param a 값a 입니다.
 * @param b 값b 입니다.
 */
export function getSmaller(a: number, b: number): number {
    if (a > b) return b
    else return a
}

/**
 * 두 점 사이의 각도를 구합니다.
 * @param from 기준점의 위치입니다.
 * @param to 대상의 위치입니다.
 * @returns 기준점을 기준으로 대상을 향하는 각도를 반환합니다.
 */
export function getAngleBetweenPoints(from: Point2, to: Point2): number {
  return radToAngle(Math.atan2(to.y - from.y, to.x - from.x))
}

/**
 * 특정 좌표를 기준으로 수색 반지름 내에 포인트가 존재하는지 여부를 반환합니다.
 * @param co 범위 내 포인트를 찾아내고자 하는 중심좌표입니다
 * @param po 포인트의 좌표입니다
 * @param radius 수색 반지름입니다
 */
export function isInsideFromCircle(co: Point2, po: Point2, radius: number): boolean {
    return getDistanceBetween(co, po) < radius
}

/**
 * 특정 좌표가 폴리곤내에 존재하는지 여부를 반환합니다.
 * @param point 포인트의 좌표입니다.
 * @param vertices 폴리곤의 정보입니다. 폴리곤의 각 정점 좌표 [x, y]의 형태로 가지고 있는 2차원 배열입니다.
 */
export function isInsideFromPolygon(point: Point2, vertices: number[][]) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    const { x, y } = point

    let inside = false
    for (let i: number = 0, j: number = vertices.length - 1; i < vertices.length; j = i++) {
        const xi = vertices[i][0]
        const xj = vertices[j][0]
        const yi = vertices[i][1]
        const yj = vertices[j][1]

        const intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
        if (intersect) inside = !inside
    }

    return inside
}

export function getMinCoord(points: Point2[]): Point2 {
    let minX: number = 0
    let minY: number = 0
    for (const point of points) {
        if (minX > point.x) minX = point.x
        if (minY > point.y) minY = point.y
    }
    return { x: minX, y: minY }
}

export function toIsometricPoint({ x, y }: Point2): Point2 {
    const ix: number = x - y
    const iy: number = (x + y) / 2
    return { x: ix, y: iy }
}

export function toCartesianPoint({ x, y }: Point2): Point2 {
    const cx: number = (x + y * 2) / 2
    const cy: number = (y * 2 - x) / 2
    return { x: cx, y: cy }
}

export function getMaxCoord(points: Point2[]): Point2 {
    let maxX: number = 0
    let maxY: number = 0
    for (const point of points) {
        if (maxX < point.x) maxX = point.x
        if (maxY < point.y) maxY = point.y
    }
    return { x: maxX, y: maxY }
}

export function create2DArray(x: number, y: number, fill: number): number[][] {
    const array: number[][] = []
    for (let i: number = 0; i < y; i++) {
        const row: number[] = []
        row.length = ~~x
        row.fill(fill)
        array.push(row)
    }
    return array
}

export function fillItemInArray(array: number[][], { x, y }: Point2, fill: number): boolean {
    if (array[y] === undefined)     return false
    if (array[y][x] === undefined)  return false
    array[y][x] = fill
    return true
}

export function createObjectMappingTo2DArray(center: Point2, gridSize: number, gridScale: number, objects: GridObject[], fill: number): number[][] {
    const grid: number[][] = create2DArray(gridSize, gridSize, 0)
    const centerOffset: number = gridSize / 2

    // 기준점 좌표를 기준으로 상대 좌표를 생성
    objects = objects.map(({ x, y, side }: GridObject): GridObject => {
        x -= center.x
        y -= center.y
        return { x, y, side }
    })

    const getBaseIndex = (index: number) => index > 0 ? Math.ceil(index) : Math.floor(index)

    for (const { x, y, side } of objects) {
        const xOffset: number = x / gridScale
        const yOffset: number = y / gridScale
        const marginRadius: number = (side / 2) / gridScale

        for (let i: number = -marginRadius; i < marginRadius; i++) {
            for (let j: number = -marginRadius; j < marginRadius; j++) {
                const xRelative: number = (xOffset + i)
                const yRelative: number = (yOffset + j)
                const x: number = getBaseIndex(centerOffset + xRelative)
                const y: number = getBaseIndex(centerOffset + yRelative)
                fillItemInArray(grid, { x, y }, fill)
            }
        }
    }
    return grid
}

export function createIsometricDiamondPoints(width: number, point: Point2 = { x: 0, y: 0 }): Point2[] {
    const xHalf: number = width / 2
    const yHalf: number = width / 4
    const { x, y } = point
    return [ { x, y }, { x: x + xHalf, y: y + yHalf }, { x, y: yHalf * 2 }, { x: x - xHalf, y: yHalf } ]
}

/**
 * 데카르트 좌표를 이 월드의 아이소메트릭 좌표 위치로 변환합니다.
 * @param x 변환할 데카르트 x축 좌표입니다.
 * @param y 변환할 데카르트 y축 좌표입니다.
 * @param isoX 아이소메트릭 월드의 (0,0) 좌표의 데카르트 좌표입니다. 기본값은 0입니다. 이상적인 값은 월드의 절반이여야 합니다.
 * @param isoY 아이소메트릭 월드의 (0,0) 좌표의 데카르트 좌표입니다. 기본값은 0입니다.
 * @param isoW 아이소메트릭 블록의 가로 크기입니다. 기본값은 1입니다.
 * @param isoH 아이소메트릭 블록의 세로 크기입니다. 기본값은 0.5입니다.
 */
export function toIsometricCoord({ x, y }: Point2, isoX: number = 0, isoY: number = 0, isoW: number = 1, isoH: number = 0.5): Point2 {
    const localX: number = ((y - isoY) / isoH + (x - isoX) / isoW) / 2
    const localY: number = ((y - isoY) / isoH - (x - isoX) / isoW) / 2
    return { x: localX, y: localY }
}

/**
 * 아이소메트릭 좌표를 데라르트 좌표 위치로 변환합니다.
 * @param x 변환할 아이소메트릭 x축 좌표입니다.
 * @param y 변환할 아이소메트릭 y축 좌표입니다.
 * @param isoX 아이소메트릭 월드의 (0,0) 좌표의 데카르트 좌표입니다. 기본값은 0입니다. 이상적인 값은 월드의 절반이여야 합니다.
 * @param isoY 아이소메트릭 월드의 (0,0) 좌표의 데카르트 좌표입니다. 기본값은 0입니다.
 * @param isoW 아이소메트릭 블록의 가로 크기입니다. 기본값은 1입니다.
 * @param isoH 아이소메트릭 블록의 세로 크기입니다. 기본값은 0.5입니다.
 */
export function toCartesianCoord({ x, y }: Point2, isoX: number = 0, isoY: number = 0, isoW: number = 1, isoH: number = 0.5): Point2 {
    const globalX: number = isoX + (x - y) * isoW
    const globalY: number = isoY + (x + y) * isoH
    return { x: globalX, y: globalY }
}