import Phaser from 'phaser'

type ParticleEmitterConfig = Phaser.Types.GameObjects.Particles.ParticleEmitterConfig
type Actor = Phaser.GameObjects.GameObject&Phaser.GameObjects.Components.Transform

interface ParticleEmitterOption {
  frequency: number
  isTop: boolean
  emitter: Phaser.GameObjects.Particles.ParticleEmitter
}

export class ActorParticle {
  private actor: Actor
  private emittermap: Map<string, ParticleEmitterOption> = new Map

  static update(particle: ActorParticle, time: number, delta: number): void {
    particle.update(time, delta)
  }

  static destroy(particle: ActorParticle): void {
    particle.destroy()
  }
  
  static createEmitterOption(emitter: Phaser.GameObjects.Particles.ParticleEmitter, isTop: boolean, frequency: number): ParticleEmitterOption {
    return { isTop, emitter, frequency }
  }

  constructor(actor: Actor) {
    this.actor = actor
  }

  /** 해당 액터 인스턴스가 속한 씬을 반환합니다. 씬에 추가되어있지 않다면 `null`을 반환합니다. */
  private get scene(): Phaser.Scene {
    return this.actor.scene
  }

  /** 등록된 파티클의 이미터를 배열로 반환합니다. */
  get emitters(): Phaser.GameObjects.Particles.ParticleEmitter[] {
    const emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = []
    for (const { emitter } of this.emittermap.values()) {
      emitters.push(emitter)
    }
    return emitters
  }

  /**
   * 등록된 모든 파티클의 키를 배열로 반환합니다.
   */
  get keys(): string[] {
    return Array.from(this.emittermap.keys())
  }

  /**
   * 새로운 파티클을 등록합니다. 이미 등록되어 있다면 삭제하고 새롭게 등록합니다.
   * @param key 파티클 키입니다.
   * @param texture 파티클에서 사용할 텍스쳐 키입니다.
   * @param isTop 파티클이 액터 위에 그려질 것인지 여부를 설정합니다. 기본값은 `false`입니다.
   * @param config 파티클 설정입니다. `speed`, `lifespan`, `blendMode`, `scale` 등이 있습니다. 자세한 내용은 아래 링크를 참고하십시오.
   * https://photonstorm.github.io/phaser3-docs/Phaser.Types.GameObjects.Particles.html#.ParticleEmitterConfig
   */
  add(key: string, texture: string, isTop: boolean = false, config: ParticleEmitterConfig = {}): this {
    const configDefault: ParticleEmitterConfig = {
      speed: 200,
      lifespan: 400,
      frequency: 0,
      quantity: 1,
      blendMode: Phaser.BlendModes.ADD,
      scale: {
        start: 1,
        end: 0
      }
    }
    const configAppended: ParticleEmitterConfig = { ...configDefault, ...config }

    const particle = this.scene.add.particles(texture)
    const emitter = particle
      .createEmitter(configAppended)
      .startFollow(this.actor)

    const option = ActorParticle.createEmitterOption(emitter, isTop, emitter.frequency!)

    this.remove(key)

    this.emittermap.set(key, option)

    return this
  }

  /**
   * 이미 생성된 파티클 게임 오브젝트 인스턴스를 등록합니다.
   * 이렇게 등록된 객체는 액터를 따라다니며, 액터가 파괴되었을 때 함께 파괴됩니다.
   * @param key 파티클 키입니다.
   * @param particle 존재하는 파티클 게임 오브젝트 인스턴스입니다.
   * @@param isTop 파티클이 액터 위에 그려질 것인지 여부를 설정합니다. 기본값은 `false`입니다.
   */
  addExists(key: string, particle: Phaser.GameObjects.Particles.ParticleEmitterManager, isTop: boolean = false): this {
    const emitter = particle.emitters.first
    emitter.startFollow(this.actor)
    
    const option = ActorParticle.createEmitterOption(emitter, isTop, emitter.frequency)

    this.remove(key)

    this.emittermap.set(key, option)

    return this
  }

  /**
   * 파티클을 삭제합니다. 자동으로 호출되며, *직접 호출하지 마십시오*
   * @param emitter 삭제할 파티클 이미터입니다.
   */
  private destroyEmitter(emitter: Phaser.GameObjects.Particles.ParticleEmitter): void {
    emitter.stop()

    this.scene.time.delayedCall(emitter.lifespan.propertyValue, () => {
      emitter.manager.destroy()
    })
  }

  /** 등록된 모든 파티클 이미터를 파괴합니다. *직접 호출하지 마십시오.* */
  private destroyAllEmitter(): void {
    for (const emitter of this.emitters) {
      this.destroyEmitter(emitter)
    }
  }

  /**
   * 등록된 파티클을 제거합니다.
   * @param key 파티클 키입니다.
   */
  remove(key: string): this {
    if (this.emittermap.has(key)) {
      const { emitter } = this.emittermap.get(key)!

      this.destroyEmitter(emitter)
    }
    return this
  }

  /**
   * 해당 파티클이 등록되어 있는지 여부를 반환합니다.
   * @param key 파티클 키입니다.
   */
  has(key: string): boolean {
    return this.emittermap.has(key)
  }

  /**
   * 등록된 해당 파티클 이미터를 반환합니다. 존재하지 않는다면 `null`을 반환합니다.
   * 이 기능은 파티클에 더욱 고급 설정을 부여하기 위해 사용됩니다.
   * @param key 파티클 키입니다.
   */
  get(key: string): Phaser.GameObjects.Particles.ParticleEmitter|null {
    if (!this.emittermap.has(key)) {
      return null
    }

    const { emitter } = this.emittermap.get(key)!
    return emitter
  }

  /**
   * 등록된 파티클 효과를 출력합니다.
   * @param key 파티클 키입니다.
   * @param frequency 파티클 입자를 다시 뿌리는 간격(ms)입니다. 기본값은 `this.get(key).emitter.frequency`입니다.
   */
  play(key: string, frequency?: number): this {
    if (!this.emittermap.has(key)) {
      return this
    }

    const particle = this.emittermap.get(key)!

    let newFrequency = frequency ?? particle.emitter.frequency
    
    // explode 메서드로 frequency 속성이 -1이 되었을 경우,
    // 최초 등록했던 frequency로 재설정함.
    if (newFrequency < 0) {
      newFrequency = particle.frequency
    }

    particle.frequency = newFrequency

    particle.emitter
      .setFrequency(newFrequency)
      .start()
    
    return this
  }

  /**
   * 출력 중인 파티클 효과를 중단합니다.
   * @param key 파티클 키입니다.
   */
  pause(key: string): this {
    if (!this.emittermap.has(key)) {
      return this
    }

    const { emitter } = this.emittermap.get(key)!

    emitter.stop()

    return this
  }

  /**
   * 파티클 입자를 폭발적으로 뿌립니다. 이는 어떤 폭발 효과를 주는데 좋습니다.
   * 이는 파티클 입자를 한 번 폭발적으로 뿌린 후, 재생을 중단하므로 주의하십시오.
   * 다시 파티클 입자를 뿌리기 위해서는 `play` 메서드를 이용하여 재생하십시오.
   * @param key 파티클 키입니다.
   * @param count 파티클 입자가 뿌려질 갯수입니다.
   */
  explode(key: string, count: number): this {
    if (!this.emittermap.has(key)) {
      return this
    }

    const particle = this.emittermap.get(key)!
    const { x, y } = this.actor

    particle.frequency = particle.emitter.frequency

    particle.emitter.start()
    particle.emitter.explode(count, x, y)

    return this
  }

  /** 파티클 이미터의 `depth`를 업데이트합니다. 자동으로 호출되며, *직접 호출하지 마십시오.* */
  private sortDepth(): void {
    for (const { emitter, isTop } of this.emittermap.values()) {
      if (!emitter.manager) {
        continue
      }

      const depth = isTop ? 1 : -1
      emitter.manager.setDepth(this.actor.y + depth)
    }
  }

  /**
   * 파티클 매니저를 업데이트합니다. 자동으로 호출되며, *직접 호출하지 마십시오.*
   * @param time 씬이 시작한 후 흐른 시간(ms)입니다.
   * @param delta 이전 프레임과 현재 프레임 사이에 흐른 시간(ms)입니다. 게임은 일반적으로 60프레임이므로, 1/60초인 0.016초입니다.
   */
  private update(_time: number, _delta: number): void {
    this.sortDepth()
  }

  private destroy(): void {
    this.destroyAllEmitter()
    
    this.emittermap.clear()
  }
}