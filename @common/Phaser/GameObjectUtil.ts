import Phaser from 'phaser'
import { createRectVertices, isInsideFromPolygon } from '../Math/MathUtil'

/**
 * 해당 카메라가 비치는 뷰포트에 주어진 오브젝트가 보이고 있는지 여부를 반환합니다.
 * 이는 오브젝트와 카메라의 좌표, 크기, 그리고 카메라의 줌 설정을 고려하여 여부를 반환합니다.
 * 객체가 active = false 상태이거나, displayList에서 제외되었다던가 하는 상황을 고려하지 않습니다.
 * @param camera 화면을 비추고 있는 카메라입니다.
 * @param gameObject 검사하고자 하는 게임 오브젝트입니다.
 * @returns `gameObject`가 `camera`의 뷰포트 안에 비추어지고 있는지 여부를 반환합니다.
 */
export function isDisplayingOnCamera(
  camera: Phaser.Cameras.Scene2D.BaseCamera,
  gameObject: Phaser.GameObjects.GameObject&Phaser.GameObjects.Components.Transform&Phaser.GameObjects.Components.Origin&Phaser.GameObjects.Components.Size
): boolean {
  const { worldView } = camera
  const viewport = createRectVertices(worldView.x, worldView.y, worldView.width, worldView.height)

  const { x, y, displayWidth, displayHeight, displayOriginX, displayOriginY } = gameObject
  const startX = x - displayOriginX
  const startY = y - displayOriginY
  const endX = x + (displayWidth - displayOriginX)
  const endY = y + (displayHeight - displayOriginY)

  return isInsideFromPolygon({ x: startX, y: startY }, viewport) ||
    isInsideFromPolygon({ x: startX, y: endY }, viewport) ||
    isInsideFromPolygon({ x: endX, y: startY }, viewport) ||
    isInsideFromPolygon({ x: endX, y: endY }, viewport)
}