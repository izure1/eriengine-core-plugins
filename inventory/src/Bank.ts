import { TypedEmitter } from 'tiny-typed-emitter'

import { Inventory } from './Inventory'
import { Item } from './Item'

interface TradeFailResult {
  state: number
  detail: string
}

interface Events {
  'offer': (list: Item[], agent: Agent) => void
  'done': (list: Item[], agent: Agent) => void
  'resume': (list: Item[], agent: Agent) => void
  'cancel': (agent: Agent) => void
}

export class Agent {
  private __inventory: Inventory
  private __bank: Bank
  private __offered: Set<Item> = new Set
  private __done: boolean = false
  private __donePromiseResolve: ((v: Item[]|PromiseLike<Item[]>) => void)|null = null
  private __donePromiseReject: ((reason: TradeFailResult) => void)|null = null
  private __destroyed: boolean = false

  static get TRADE_FAIL_RESUME(): TradeFailResult {
    return { state: 1, detail: '준비를 취소했습니다.' }
  }

  static get TRADE_FAIL_CONDITION(): TradeFailResult {
    return { state: 2, detail: '일부 아이템이 거래 조건을 충족하지 못했습니다.' }
  }

  constructor(inventory: Inventory, bank: Bank) {
    this.__inventory = inventory
    this.__bank = bank
  }
  
  /**
   * 현재 대리인이 담당하고 있는 인벤토리 인스턴스입니다.
   */
  get inventory(): Inventory {
    return this.__inventory
  }

  /**
   * 현재 대리인이 참여하고 있는 은행입니다.
   */
  get bank(): Bank {
    return this.__bank
  }

  /**
   * 현재 인벤토리에서 `offer` 메서드로 거래 품목에 등록한 아이템 목록입니다.
   */
  get offered(): Item[] {
    return Array.from(this.__offered)
  }

  /**
   * 거래 중인 상대방 대리인 인스턴스입니다.
   */
  get another(): Agent {
    const { a, b } = this.__bank
    return this === a ? b : a
  }

  /**
   * 현재 인벤토리의 소유자입니다.
   */
  get owner(): any {
    return this.__inventory.owner
  }

  /**
   * 해당 아이템이 파기 가능한지 여부를 반환합니다.
   * 이는 아이템에 onBeforeDrop 함수가 없을 경우에는 항상 `true`를 반환합니다.
   * @param item 검사할 아이템입니다.
   * @param inventory 검사할 아이템이 등록되어있는 인벤토리입니다.
   * @returns 파기 가능 여부를 반환합니다.
   */
  private checkDroppable(item: Item, inventory: Inventory): boolean {
    let droppable = true
    if (item.blueprint.onBeforeDrop) {
      droppable = item.blueprint.onBeforeDrop(item, inventory, inventory.owner)
    }
    return droppable
  }

  /**
   * 해당 아이템이 추가 가능한지 여부를 반환합니다.
   * 이는 아이템에 onBeforeAdd 함수가 없을 경우에는 항상 `true`를 반환합니다.
   * @param item 검사할 아이템입니다.
   * @param inventory 검사할 아이템이 등록될 인벤토리입니다.
   * @returns 파기 가능 여부를 반환합니다.
   */
   private checkAddible(item: Item, inventory: Inventory): boolean {
    let addible = true
    if (item.blueprint.onBeforeAdd) {
      addible = item.blueprint.onBeforeAdd(item.blueprint, inventory, inventory.owner)
    }
    return addible
  }

  /**
   * 거래 성립 직전, 마지막으로 해당 아이템의 거래 유효성을 검사합니다.
   * 이는 거래하고자 하는 아이템이 인벤토리에 없거나, 또는 버릴 수 없는 아이템인지 여부를 테스트하고, 결과를 반환합니다.
   * @returns 최종적 거래 가능 여부를 반환합니다.
   */
   private checkAvailableTrade(): boolean {
    for (const item of this.__offered) {
      if (
        !this.__inventory.has(item) ||
        !this.checkDroppable(item, this.__inventory) ||
        !this.checkAddible(item, this.another.__inventory)
      ) {
        return false
      }
    }

    return true
  }

  private receiveFromAnotherPerson(): Item[] {
    const list: Set<Item> = new Set

    for (const item of this.another.__offered) {
      // 상대방의 인벤토리에서 아이템을 제거합니다.
      const poppedItem = this.another.__inventory.drop(item)

      // 제거에 성공하였다면 인벤토리에 추가를 시도합니다.
      if (poppedItem !== null) {
        this.another.__offered.delete(poppedItem)
        const addedItem = this.__inventory.add(poppedItem)

        // 추가에 성공하였다면 리스트에 담습니다. 이 리스트는 이후에 프로미스를 해결할 때, 매개변수로 보내집니다.
        if (addedItem !== null) {
          // data 정보를 깊은 복사합니다.
          addedItem.data = JSON.parse(JSON.stringify(poppedItem.data))

          // 건내 받은 아이템 리스트에 추가합니다.
          list.add(addedItem)
        }
      }
    }

    return Array.from(list)
  }

  /**
   * 거래하고자 하는 아이템입니다. 이 아이템을 거래 상대에게 제시합니다.
   * 거래가 성사되면 제시한 아이템은 인벤토리에서 제거됩니다.
   * 거래 성사 시, 인벤토리에서 아이템이 제거되며 onBeforeDrop, onDrop 함수가 호출됩니다. 아이템을 얻는 거래 상대는 onBeforeAdd, onAdd 함수가 호출됩니다.
   * @param items 제시할 아이템입니다.
   */
  offer(items: Item|Item[]): void {
    if (this.__destroyed) {
      throw 'This agent was expired.'
    }

    
    if (!Array.isArray(items)) {
      items = [items]
    }
    
    for (const item of items) {
      if (this.checkDroppable(item, this.__inventory)) {
        this.__offered.add(item)
      }
    }

    this.__bank.emit('offer', this.offered, this)

    this.resume()
  }

  private tryEmitFail(reason: TradeFailResult): void {
    if (this.__donePromiseReject !== null) {
      this.__donePromiseReject(reason)
    }

    this.__donePromiseResolve = null
    this.__donePromiseReject = null
    this.__done = false
  }

  private tryEmitSuccess(list: Item[]): void {
    if (this.__donePromiseResolve !== null) {
      this.__donePromiseResolve(list)
    }

    this.__donePromiseResolve = null
    this.__donePromiseReject = null
    this.__done = false
  }

  /**
   * `offer` 메서드로 아이템 제시가 끝났으며, 거래 상대의 동의를 구합니다.
   * 거래 상대 역시 `done` 메서드를 호출하면 거래가 성사됩니다. 만일 반대로 상대가 먼저 `done` 메서드를 호출하였을 경우, `done` 메서들 호출하면 거래가 성사됩니다.
   * 이는 양측이 모두 거래 완료가 될 때 까지 준비됨을 의미합니다.
   * 만약 `done` 메서드를 호출한 이후에, `offer`, `resume`, `cancel` 메서드를 호출한다면 약속은 실패를 반환합니다.
   * @returns 거래 상대와 거래하여 얻어낸 아이템 목록을 배열로 반환합니다.
   */
  done(): Promise<Item[]> {
    if (this.__destroyed) {
      throw 'This agent was expired.'
    }

    this.__bank.emit('done', this.offered, this)

    // 기존에 `done` 메서드를 호출하여 프로미스가 생성되었다면 reject하여 파기하고, 가비지 컬렉터가 수집하도록 합니다.
    this.tryEmitFail(Agent.TRADE_FAIL_RESUME)

    return new Promise((resolve, reject: (reason: TradeFailResult) => void) => {
      this.__done = true

      this.__donePromiseResolve = resolve
      this.__donePromiseReject = reject

      const { a, b } = this.__bank

      // 한 쪽만 승낙했을 경우, 상대측이 완료하기를 대기합니다.
      if (!a.__done || !b.__done) {
        return
      }

      // 양측이 모두 수락했으므로 최종 검증을 합니다.
      // 만일 상대방의 인벤토리에 거래 용품이 없다면 부정이 있다는 증거이므로 거래를 취소해야 합니다.

      // 이 작업은 한 쪽에서 일임합니다.
      if (a.checkAvailableTrade() && b.checkAvailableTrade()) {
        // 거래가 성사되었을 경우, 서로의 아이템 교환을 시도합니다.
        const aReceived = a.receiveFromAnotherPerson()
        const bReceived = b.receiveFromAnotherPerson()

        // 교환에 성공했을 경우, 성공 리스트를 프로미스 해결로 등록합니다.
        a.tryEmitSuccess(aReceived)
        b.tryEmitSuccess(bReceived)

        a.__destroyed = true
        b.__destroyed = true
      }
      // 교환 조건을 충족하지 못했을 때
      else {
        a.tryEmitFail(Agent.TRADE_FAIL_CONDITION)
        b.tryEmitFail(Agent.TRADE_FAIL_CONDITION)
      }
    })
  }
  
  /**
   * `done` 메서드를 호출하여 설정된 거래 준비 완료 상태를 다시 되돌립니다.
   * 이는 `offer` 메서드를 이용하여 새로운 아이템을 추가하였을 경우에도 자동으로 호출됩니다.
   */
  resume(): this {
    if (this.__destroyed) {
      throw 'This agent was expired.'
    }

    this.__bank.emit('resume', this.offered, this)

    // 기존에 `done` 메서드를 호출하여 프로미스가 생성되었다면 reject하여 파기하고, 가비지 컬렉터가 수집하도록 합니다.
    this.__done = false
    this.tryEmitFail(Agent.TRADE_FAIL_RESUME)

    return this
  }

  /**
   * 현재 거래를 취소합니다. 현 거래 인스턴스는 파기되어 사용할 수 없게 됩니다.
   */
  cancel(): void {
    if (this.__destroyed) {
      throw 'This agent was expired.'
    }

    this.__bank.emit('cancel', this)

    const { a, b } = this.__bank
    a.__offered.clear()
    b.__offered.clear()

    a.__done = false
    b.__done = false
    a.__destroyed = true
    b.__destroyed = true

    // 기존에 `done` 메서드를 호출하여 프로미스가 생성되었다면 reject하여 파기하고, 가비지 컬렉터가 수집하도록 합니다.
    a.tryEmitFail(Agent.TRADE_FAIL_RESUME)
    b.tryEmitFail(Agent.TRADE_FAIL_RESUME)
  }
}

export class Bank extends TypedEmitter<Events> {
  private __a: Agent
  private __b: Agent

  constructor(a: Inventory, b: Inventory) {
    super()

    this.__a = new Agent(a, this)
    this.__b = new Agent(b, this)
  }

  get a(): Agent {
    return this.__a
  }

  get b(): Agent {
    return this.__b
  }
}