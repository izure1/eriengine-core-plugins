import { TypedEmitter } from 'tiny-typed-emitter'
import { Actor } from './Actor'

type UpdateCallback = (time: number, delta: number) => void
interface DotJob {
  start: number
  duration: number
  tickCallback?: UpdateCallback
  doneCallback?: UpdateCallback
}

interface ActorDotEvent {
  'start': (key: string) => void
  'update': (key: string, passedTime: number, delta: number) => void
  'stop': (key: string) => void
  'end': (key: string) => void
}

export class ActorDot extends TypedEmitter<ActorDotEvent> {
  private readonly jobmap: Map<string, DotJob> = new Map
  private readonly actor: Actor

  static update(dot: ActorDot, time: number, delta: number): void {
    dot.update(time, delta)
  }

  static destroy(dot: ActorDot): void {
    dot.destroy()
  }

  constructor(actor: Actor) {
    super()

    this.actor = actor
  }

  /** 해당 액터 인스턴스가 속한 씬이 생성된 후 지난 시간(ms)입니다. *직접 호출하지 마십시오.* */
  private get now(): number {
    return this.actor.world.scene.time.now
  }

  /**
   * 매 프레임마다 작동할 도트를 실행합니다. 이는 독 데미지, 또는 일정시간동안 천천히 차오르는 체력회복 효과를 구현하는데 좋습니다.
   * @param key 도트 고유 키입니다. 다른 도트와 중복되어선 안됩니다.
   * @param duration 작동하는 기간(ms)입니다.
   * @param tickCallback 매 프레임마다 호출될 함수입니다.
   * @param doneCallback `duration` 기간이 끝나면 호출될 함수입니다.
   */
  start(key: string, duration: number, tickCallback?: UpdateCallback, doneCallback?: UpdateCallback): this {
    this.jobmap.set(key, {
      start: this.now,
      duration,
      tickCallback,
      doneCallback
    })

    this.emit('start', key)
    
    return this
  }

  /**
   * 도트가 이미 실행 중인지 여부를 반환합니다.
   * @param key 도트 고유 키입니다.
   */
  has(key: string): boolean {
    return this.jobmap.has(key)
  }

  /**
   * 작동 중안 도트를 중단하고, 삭제합니다.
   * 가령 체력회복 도트 효과 도중에 캐릭터가 사망하면 체력회복 효과를 중단해야할 필요가 있습니다. 그럴 때 사용합니다.
   * @param key 도트 고유 키입니다.
   */
  stop(key: string): this {
    this.jobmap.delete(key)

    this.emit('stop', key)
    this.emit('end', key)

    return this
  }

  /**
   * 도트 매니저가 씬이 매 프레임 업데이트 될 때 마다 호출될 함수입니다. 자동으로 호출되며, *직접 호출하지 마십시오.*
   * @param time 씬이 시작한 후 흐른 시간(ms)입니다.
   * @param delta 이전 프레임과 현재 프레임 사이에 흐른 시간(ms)입니다. 게임은 일반적으로 60프레임이므로, 1/60초인 0.016초입니다.
   */
  private update(time: number, delta: number): void {
    for (const [ key, { start, duration, tickCallback, doneCallback } ] of this.jobmap) {
      const passedTime = time - start

      if (passedTime > duration) {
        if (doneCallback) {
          doneCallback(time, delta)
        }

        this.jobmap.delete(key)

        this.emit('end', key)

        continue
      }
      
      if (tickCallback) {
        tickCallback(time, delta)

        this.emit('update', key, passedTime, delta)
      }
    }
  }

  private destroy(): void {
    this.jobmap.clear()
  }
}