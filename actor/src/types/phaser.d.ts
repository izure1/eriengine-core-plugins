import Phaser from 'phaser'

declare module 'phaser' {
    namespace Cameras {
        namespace Scene2D {
            interface Camera {
                _follow: Phaser.GameObjects.GameObject|null
            }
        }
    }
}