import Phaser from 'phaser'
import { GridObject, getIsometricSide, createIsometricDiamondPoints } from '@common/Math/MathUtil'

export class WallObstacle extends Phaser.Physics.Matter.Sprite implements GridObject {
    name: string = 'eriengine-core-plugin-isometric-scene-walltile'

    constructor(world: Phaser.Physics.Matter.World, x: number, y: number, texture: Phaser.Textures.Texture|string, frame?: string|number, options?: Phaser.Types.Physics.Matter.MatterBodyConfig) {
        super(world, x, y, texture, frame, options)
        this.initVertices()
    }

    get side(): number {
        const xHalf: number = this.displayWidth / 2
        return getIsometricSide(xHalf)
    }

    private get matterBody(): MatterJS.BodyType {
        return this.body as MatterJS.BodyType
    }

    protected createVertices(): MatterJS.Vector[] {
        const points = createIsometricDiamondPoints(this.displayWidth)
        const vertices = this.scene.matter.vertices.create(points, this.matterBody)
        return vertices
    }

    initVertices(): void {
        this.scene.matter.body.setVertices(this.matterBody, this.createVertices())
        this.scene.matter.body.setInertia(this.matterBody, Infinity)
        this.setOrigin(0.5, (this.displayHeight - this.displayWidth / 4) / this.displayHeight)
    }

    addToScene(): this {
        this.scene.add.existing(this)
        return this
    }
}