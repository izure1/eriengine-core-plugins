import { Vector2, Point2, isApproximated, getSmaller } from '@common/Math/MathUtil'
import { Actor } from './Actor'

export class ActorRun {
    private upKey:    Phaser.Input.Keyboard.Key|null = null
    private downKey:  Phaser.Input.Keyboard.Key|null = null
    private leftKey:  Phaser.Input.Keyboard.Key|null = null
    private rightKey: Phaser.Input.Keyboard.Key|null = null
    private isStopWhenDepress: boolean = true
    private actor: Actor|null
    private speed: number = 10
    private routes: Point2[] = []
    private checkKeepGoing: () => boolean = () => true

    static update(run: ActorRun, time: number, delta: number): void {
        run.update(time, delta)
    }

    static destroy(run: ActorRun): void {
        run.destroy()
    }

    constructor(actor: Actor) {
        this.actor = actor
    }

    get velocity(): Vector2 {
        if (!this.actor)                return { x: 0, y: 0 }
        if (!this.actor.matterBody)     return { x: 0, y: 0 }
        return this.actor.matterBody.velocity
    }

    get velocityX(): number {
        return this.velocity.x
    }

    get velocityY(): number {
        return this.velocity.y
    }

    get isMoving(): boolean {
        return !!(this.velocityX || this.velocityY)
    }

    get isMovingLeft(): boolean {
        return this.velocityX < 0
    }

    get isMovingRight(): boolean {
        return this.velocityX > 0
    }

    get isMovingUp(): boolean {
        return this.velocityY < 0
    }

    get isMovingDown(): boolean {
        return this.velocityY > 0
    }

    get isRouting(): boolean {
        return this.routes.length > 0
    }

    private get currentSign(): Point2|null {
        if (!this.isRouting) return null
        return this.routes[0]
    }

    private get scene(): Phaser.Scene|null {
        if (!this.actor) return null
        return this.actor.world.scene
    }

    setSpeed(speed: number): this {
        this.speed = speed
        return this
    }

    getSpeed(): number {
        return this.speed
    }

    left(): this {
        this.actor?.setVelocityX(-this.speed)
        return this
    }

    right(): this {
        this.actor?.setVelocityX(this.speed)
        return this
    }

    up(): this {
        this.actor?.setVelocityY(-this.speed)
        return this
    }

    down(): this {
        this.actor?.setVelocityY(this.speed)
        return this
    }

    to(routes: Point2[], checkKeepGoing: () => boolean = () => true): this {
        this.routes = routes
        this.checkKeepGoing = checkKeepGoing
        this.routingAutomatic()
        return this
    }

    stop(): this {
        this.actor?.setVelocity(0, 0)
        this.routes.length = 0
        return this
    }

    private arriveCurrentSign(): void {
        if (!this.isRouting) {
            return
        }
        const { x, y } = this.routes.shift()!
        this.actor?.setPosition(x, y)
    }

    private routingAutomatic(): void {
        if (!this.actor)                return
        if (!this.isRouting)            return

        if (!this.checkKeepGoing()) {
            this.actor.setVelocity(0, 0)
            return
        }

        const current: Point2   = this.actor!
        const sign: Point2      = this.currentSign!

        const xDistance: number = sign.x - current.x
        const yDistance: number = sign.y - current.y
        let xSpeed: number = getSmaller(Math.abs(xDistance), Math.abs(this.speed))
        let ySpeed: number = getSmaller(Math.abs(yDistance), Math.abs(this.speed))
        if (xDistance < 0) xSpeed *= -1
        if (yDistance < 0) ySpeed *= -1

        this.actor.setVelocityX(xSpeed)
        this.actor.setVelocityY(ySpeed)

        if (
            isApproximated(sign.x, current.x, this.speed) &&
            isApproximated(sign.y, current.y, this.speed)
        ) {
            this.arriveCurrentSign()
            if (!this.isRouting) {
                this.actor.setVelocity(0, 0)
            }
        }
    }

    private moveAutomatic(): void {
        if (!this.actor)    return
        if (this.isRouting) return

        if (this.isStopWhenDepress)     this.stop()
        if (this.upKey?.isDown)         this.up()
        if (this.downKey?.isDown)       this.down()
        if (this.leftKey?.isDown)       this.left()
        if (this.rightKey?.isDown)      this.right()
    }

    useMoveKey(method: 'arrow'|'wasd', isStopWhenDepress: boolean = true, reverse: boolean = false): this {
        if (!this.scene) {
            return this
        }
        let up:     Phaser.Input.Keyboard.Key|null
        let down:   Phaser.Input.Keyboard.Key|null
        let left:   Phaser.Input.Keyboard.Key|null
        let right:  Phaser.Input.Keyboard.Key|null
        switch(method) {
            case 'arrow':
                up      = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP)
                down    = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)
                left    = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)
                right   = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)
                break
            case 'wasd':
                up      = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
                down    = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
                left    = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
                right   = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
                break
        }
        if (!reverse) {
            this.upKey    = up
            this.downKey  = down
            this.leftKey  = left
            this.rightKey = right
        }
        else {
            this.upKey    = down
            this.downKey  = up
            this.leftKey  = right
            this.rightKey = left
        }
        this.isStopWhenDepress = isStopWhenDepress
        return this
    }

    stopUsingMoveKey(): this {
        this.upKey      = null
        this.downKey    = null
        this.leftKey    = null
        this.rightKey   = null
        return this
    }

    private update(time: number, delta: number): void {
        this.routingAutomatic()
        this.moveAutomatic()
    }

    private destroy(): void {
        this.actor = null
    }
}