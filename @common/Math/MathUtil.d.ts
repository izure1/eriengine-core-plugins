export interface Point2 {
    x: number;
    y: number;
}
export interface Vector2 extends Point2 {
}
export interface GridObject extends Point2 {
    side: number;
}
export declare const ISOMETRIC_ANGLE: number;
/**
 * 도를 라디안으로 치환하여 반환합니다.
 * @param angle 각도입니다.
 */
export declare function angleToRad(angle: number): number;
/**
 * 라디안을 각도로 치환하여 반환합니다.
 * @param rad 라디안입니다.
 */
export declare function radToAngle(rad: number): number;
export declare function getIsometricHeight(side: number): number;
export declare function getIsometricWidth(side: number): number;
export declare function getIsometricSide(width: number): number;
/**
 * 포인트로부터 극좌표의 위치를 반환합니다.
 * @param point 시작 포인트입니다.
 * @param angle 각도입니다.
 * @param radius 거리입니다.
 */
export declare function getCoordFromPoint(point: Point2, angle: number, radius: number): Point2;
/**
 * 사각형의 대각선의 길이를 반환합니다.
 * @param width 사각형의 가로 길이입니다.
 * @param height 사각형의 세로 길이입니다.
 */
export declare function getDiagonal(width: number, height: number): number;
/**
 * 두 포인트 사이의 거리를 반환합니다.
 * @param a 포인트a 입니다.
 * @param b 포인트b 입니다.
 */
export declare function getDistanceBetween(a: Point2, b: Point2): number;
/**
 * 값이 목표치에 근접했는지 여부를 반환합니다.
 * @param to 목표치 값입니다.
 * @param current 현재 값입니다.
 * @param r 오차범위입니다.
 */
export declare function isApproximated(to: number, current: number, r: number): boolean;
/**
 * 더 큰 수를 반환합니다.
 * @param a 값a 입니다.
 * @param b 값b 입니다.
 */
export declare function getBigger(a: number, b: number): number;
/**
 * 더 작은 수를 반환합니다.
 * @param a 값a 입니다.
 * @param b 값b 입니다.
 */
export declare function getSmaller(a: number, b: number): number;
/**
 * 특정 좌표를 기준으로 수색 반지름 내에 포인트가 존재하는지 여부를 반환합니다.
 * @param co 범위 내 포인트를 찾아내고자 하는 중심좌표입니다
 * @param po 포인트의 좌표입니다
 * @param radius 수색 반지름입니다
 */
export declare function isInsideFromCircle(co: Point2, po: Point2, radius: number): boolean;
/**
 * 특정 좌표가 폴리곤내에 존재하는지 여부를 반환합니다.
 * @param point 포인트의 좌표입니다.
 * @param vertices 폴리곤의 정보입니다. 폴리곤의 각 정점 좌표 [x, y]의 형태로 가지고 있는 2차원 배열입니다.
 */
export declare function isInsideFromPolygon(point: Point2, vertices: number[][]): boolean;
export declare function getMinCoord(points: Point2[]): Point2;
export declare function toIsometricPoint({ x, y }: Point2): Point2;
export declare function toCartesianPoint({ x, y }: Point2): Point2;
export declare function getMaxCoord(points: Point2[]): Point2;
export declare function create2DArray(x: number, y: number, fill: number): number[][];
export declare function fillItemInArray(array: number[][], { x, y }: Point2, fill: number): boolean;
export declare function createObjectMappingTo2DArray(center: Point2, gridSize: number, gridScale: number, objects: GridObject[], fill: number): number[][];
export declare function createIsometricDiamondPoints(width: number, point?: Point2): Point2[];
/**
 * 데카르트 좌표를 이 월드의 아이소메트릭 좌표 위치로 변환합니다.
 * @param x 변환할 데카르트 x축 좌표입니다.
 * @param y 변환할 데카르트 y축 좌표입니다.
 * @param isoX 아이소메트릭 월드의 (0,0) 좌표의 데카르트 좌표입니다. 기본값은 0입니다. 이상적인 값은 월드의 절반이여야 합니다.
 * @param isoY 아이소메트릭 월드의 (0,0) 좌표의 데카르트 좌표입니다. 기본값은 0입니다.
 * @param isoW 아이소메트릭 블록의 가로 크기입니다. 기본값은 1입니다.
 * @param isoH 아이소메트릭 블록의 세로 크기입니다. 기본값은 0.5입니다.
 */
export declare function toIsometricCoord({ x, y }: Point2, isoX?: number, isoY?: number, isoW?: number, isoH?: number): Point2;
/**
 * 아이소메트릭 좌표를 데라르트 좌표 위치로 변환합니다.
 * @param x 변환할 아이소메트릭 x축 좌표입니다.
 * @param y 변환할 아이소메트릭 y축 좌표입니다.
 * @param isoX 아이소메트릭 월드의 (0,0) 좌표의 데카르트 좌표입니다. 기본값은 0입니다. 이상적인 값은 월드의 절반이여야 합니다.
 * @param isoY 아이소메트릭 월드의 (0,0) 좌표의 데카르트 좌표입니다. 기본값은 0입니다.
 * @param isoW 아이소메트릭 블록의 가로 크기입니다. 기본값은 1입니다.
 * @param isoH 아이소메트릭 블록의 세로 크기입니다. 기본값은 0.5입니다.
 */
export declare function toCartesianCoord({ x, y }: Point2, isoX?: number, isoY?: number, isoW?: number, isoH?: number): Point2;
