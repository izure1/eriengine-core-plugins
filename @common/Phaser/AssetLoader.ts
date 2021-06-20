import Phaser from 'phaser'

const BASE64_QUEUE: WeakMap<Phaser.Game, Set<string>> = new WeakMap

function isBase64Loading({ game }: Phaser.Scene, key: string): boolean {
  if (!BASE64_QUEUE.has(game)) {
    BASE64_QUEUE.set(game, new Set)
  }

  const queue = BASE64_QUEUE.get(game)!

  return queue.has(key)
}

export function base64Load(scene: Phaser.Scene, key: string, uri: string): void {
  if (isBase64Loading(scene, key)) {
    return
  }

  const queue = BASE64_QUEUE.get(scene.game)!
  queue.add(key)

  const check = (loadedKey: string): void => {
    if (loadedKey === key) {
      scene.textures.off(Phaser.Textures.Events.LOAD, check)
      scene.textures.off(Phaser.Textures.Events.ERROR, check)

      queue.delete(key)
    }
  }

  scene.textures.on(Phaser.Textures.Events.LOAD, check).on(Phaser.Textures.Events.ERROR, check)
  scene.textures.addBase64(key, uri)
}