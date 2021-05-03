import { TypedEmitter } from 'tiny-typed-emitter'
import { Vector2, Point2, isApproximated, getSmaller } from '@common/Math/MathUtil'
import { Actor } from './Actor'

interface ActorRunEvent {
    'route-start':  (routes: Point2[]) => void
    'route-turn':   (route: Point2) => void
    'route-end':    () => void
    'route-stop':   () => void
}

export class ActorRun extends TypedEmitter<ActorRunEvent> {
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
        super()
        this.actor = actor
    }

    /** 현재 액터 인스턴스의 물리 속도를 벡터로 반환합니다. */
    get velocity(): Vector2 {
        if (!this.actor)                return { x: 0, y: 0 }
        if (!this.actor.matterBody)     return { x: 0, y: 0 }
        return this.actor.matterBody.velocity
    }

    /** 현재 액터 인스턴스의 x좌표 물리 속도를 반환합니다. `velocity.x`와 같습니다. */
    get velocityX(): number {
        return this.velocity.x
    }

    /** 현재 액터 인스턴스의 y좌표 물리 속도를 반환합니다. `velocity.y`와 같습니다. */
    get velocityY(): number {
        return this.velocity.y
    }

    /** 현재 액터 인스턴스가 물리 효과로 움직이고 있는지 여부를 반환합니다. */
    get isMoving(): boolean {
        return !!(this.velocityX || this.velocityY)
    }

    /** 현재 액터 인스턴스가 물리 효과로 좌측으로 움직이고 있는지 여부를 반환합니다. `velocity.x < 0` 과 같습니다. */
    get isMovingLeft(): boolean {
        return this.velocityX < 0
    }

    /** 현재 액터 인스턴스가 물리 효과로 우측으로 움직이고 있는지 여부를 반환합니다. `velocity.x > 0` 과 같습니다. */
    get isMovingRight(): boolean {
        return this.velocityX > 0
    }

    /** 현재 액터 인스턴스가 물리 효과로 상단으로 움직이고 있는지 여부를 반환합니다. `velocity.y < 0` 과 같습니다. */
    get isMovingUp(): boolean {
        return this.velocityY < 0
    }

    /** 현재 액터 인스턴스가 물리 효과로 하단으로 움직이고 있는지 여부를 반환합니다. `velocity.y > 0` 과 같습니다. */
    get isMovingDown(): boolean {
        return this.velocityY > 0
    }

    /** 현재 액터 인스턴스가 `to` 메서드를 이용해 길을 찾아 움직이고 있는지 여부를 반환합니다. */
    get isRouting(): boolean {
        return this.routes.length > 0
    }

    /** 현재 액터 인스턴스가 길을 찾아 이동 중이라면, 이번의 방향 전환점 좌표를 반환합니다. 이동 중이 아니라면 `null`을 반환합니다. */
    private get currentSign(): Point2|null {
        if (!this.isRouting) return null
        return this.routes[0]
    }

    /** 해당 액터 인스턴스가 속한 씬을 반환합니다. 씬에 추가되어있지 않다면 `null`을 반환합니다. */
    private get scene(): Phaser.Scene|null {
        if (!this.actor) return null
        return this.actor.world.scene
    }

    /**
     * 액터 인스턴스의 이동 속도를 설정합니다. 이는 `left`, `right`, `up`, `down` 메서드의 이동속도를 결정합니다.
     * @param speed 매 프레임에 이동할 속도입니다.
     */
    setSpeed(speed: number): this {
        this.speed = speed
        return this
    }

    /** 액터 인스턴스의 `setSpeed` 메서드로 지정된 이동 속도를 반환합니다. */
    getSpeed(): number {
        return this.speed
    }

    /** 액터를 좌측으로 이동하는 물리 효과를 적용합니다. `setSpeed` 메서드를 이용하여 이동 속도를 설정할 수 있습니다. */
    left(): this {
        this.actor?.setVelocityX(-this.speed)
        return this
    }

    /** 액터를 우측으로 이동하는 물리 효과를 적용합니다. `setSpeed` 메서드를 이용하여 이동 속도를 설정할 수 있습니다. */
    right(): this {
        this.actor?.setVelocityX(this.speed)
        return this
    }

    /** 액터를 상단으로 이동하는 물리 효과를 적용합니다. `setSpeed` 메서드를 이용하여 이동 속도를 설정할 수 있습니다. */
    up(): this {
        this.actor?.setVelocityY(-this.speed)
        return this
    }

    /** 액터를 하단으로 이동하는 물리 효과를 적용합니다. `setSpeed` 메서드를 이용하여 이동 속도를 설정할 수 있습니다. */
    down(): this {
        this.actor?.setVelocityY(this.speed)
        return this
    }

    /**
     * 액터 인스턴스가 지정된 좌표 목록을 따라 움직이게 합니다. 특정 조건을 달아 움직임을 멈추게 할 수 있습니다.
     * 이는 해당 좌표까지 이동 도중 적을 만났을 때, 교전을 위해 잠시 멈추게 만드는 기능을 구현하기 유용합니다.
     * @param routes 지정된 좌표 목록입니다. 이 좌표 목록을 따라 액터가 움직입니다.
     * @param checkKeepGoing 액터가 움직이는 도중, 특정 조건을 만족하면 잠시 움직임을 멈추게 하는 함수입니다. 이 함수는 매 프레임 호출되며, `true`를 반환하면 액터가 움직이고, `false`를 반환하면 일시중지합니다.
     */
    to(routes: Point2[], checkKeepGoing: () => boolean = () => true): this {
        this.routes = routes
        this.checkKeepGoing = checkKeepGoing
        this.routingAutomatic()

        this.emit('route-start', routes)
        return this
    }

    /** 액터가 `left`, `right`, `up`, `down`, `to` 메서드로 움직이는 움직임을 멈춥니다. */
    stop(): this {
        this.actor?.setVelocity(0, 0)
        if (this.routes.length) {
            this.routes.length = 0
            this.emit('route-stop')
        } 
        return this
    }

    /** 액터가 `to` 메서드로 움직이는 도중, 지정된 방향전환점에 도착했을 때 호출될 메서드입니다. 자동으로 호출되며, *절대 직접 호출하지 마십시오.* */
    private arriveCurrentSign(): void {
        if (!this.isRouting) {
            return
        }
        const { x, y } = this.routes.shift()!
        this.actor?.setPosition(x, y)
        this.emit('route-turn', { x, y })
    }

    /** 액터가 `to` 메서드로 움직이는 도중, 매 프레임마다 호출될 메서드입니다. 자동으로 호출되며 *직접 호출하지 마십시오.* */
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
                this.emit('route-end')
            }
        }
    }

    /** 액터가 `useMovingKey` 메서드를 사용했을 때, 키 캡쳐를 감지하는 메서드입니다. 자동으로 호출되며, *직접 호출하지 마십시오.* */
    private moveAutomatic(): void {
        if (!this.actor)    return
        if (this.isRouting) return

        if (this.isStopWhenDepress)     this.stop()
        if (this.upKey?.isDown)         this.up()
        if (this.downKey?.isDown)       this.down()
        if (this.leftKey?.isDown)       this.left()
        if (this.rightKey?.isDown)      this.right()
    }

    /**
     * 액터가 키보드 키를 이용하여 원하는 방향으로 움직일 수 있도록 도와주는 메서드입니다.
     * 가령 키보드 방향키로 액터를 움직이게 하고 싶을 때, 이 메서드를 사용합니다.
     * @param method 방향키를 지정합니다. `w` `a` `s` `d`를 방향키로 사용하고 싶다면 `wasd`, 키보드 방향키 `↑`, `←`, `↓`, `→`를 방향키로 사용하고 싶다면 `arrow`를 입력하십시오.
     * @param isStopWhenDepress 방향키를 누르고 있지 않다면 자동으로 캐릭터를 멈추게 할지 여부를 지정합니다. 이 값을 `false`로 지정하면 방향키에서 손을 땠을 때, 액터가 즉시 제자리에 멈추지 않고 남아있는 속도로 인해 미끄러집니다. 얼음판 위를 달리는 효과를 줄 때 유용합니다. 기본값은 `true`입니다.
     * @param reverse 누른 방향키와 반대로 움직이도록 합니다. 이는 액터가 혼란한 상태에 빠졌을 때 효과를 주기에 좋습니다.
     */
    useMovingKey(method: 'arrow'|'wasd', isStopWhenDepress: boolean = true, reverse: boolean = false): this {
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

    /** `useMovingKey` 메서드로 키보드로 액터 움직임을 취소합니다. */
    stopUsingMovingKey(): this {
        this.upKey      = null
        this.downKey    = null
        this.leftKey    = null
        this.rightKey   = null
        return this
    }

    /**
     * 씬이 매 프레임 업데이트 될 때 마다 호출될 함수입니다. 자동으로 호출되며, *직접 호출하지 마십시오.*
     * @param time 씬이 시작한 후 흐른 시간(ms)입니다.
     * @param delta 이전 프레임과 현재 프레임 사이에 흐른 시간(ms)입니다. 게임은 일반적으로 60프레임이므로, 1/60초인 0.016초입니다.
     */
    private update(_time: number, _delta: number): void {
        this.routingAutomatic()
        this.moveAutomatic()
    }

    private destroy(): void {
        this.actor = null
    }
}