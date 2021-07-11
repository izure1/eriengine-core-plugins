import { Item, ItemBlueprint } from './Item'
import { Plugin } from './eriengine-core-plugin-inventory'

export class Inventory {
  private readonly __items: Item[] = []
  private readonly __inventoryManager: Plugin
  private readonly __owner: any

  private maximumWeight: number = Infinity
  private maximumSlot: number = Infinity

  constructor(inventoryManager: Plugin, owner: any) {
    this.__inventoryManager = inventoryManager
    this.__owner = owner
  }

  /**
   * 현재 인벤토리에 저장된 모든 아이템을 배열로 반환합니다.
   */
  get items(): Item[] {
    return this.__items
  }

  /**
   * 현재 인벤토리의 소유자입니다.
   */
  get owner(): any {
    return this.__owner
  }

  /**
   * 현재 인벤토리에 저장된 모든 아이템의 무게를 총합하여 반환합니다.
   */
  get totalWeight(): number {
    return this.__items.reduce((weight, item) => {
      const blueprint = this.__inventoryManager.getItemBlueprint(item.key)
      if (blueprint === null) {
        return weight
      }
      return weight + blueprint.weight
    }, 0)
  }

  /**
   * 현재 인벤토리에 저장된 모든 아이템이 소비하고 있는 슬롯의 갯수를 반환합니다.
   */
  get totalSlot(): number {
    const items: Map<ItemBlueprint, number> = new Map

    this.__items.forEach((item) => {
      const blueprint = this.__inventoryManager.getItemBlueprint(item.key)
      if (blueprint === null) {
        return
      }

      const count = items.get(blueprint) ?? 0
      items.set(blueprint, count + 1)
    })

    let slot = 0
    items.forEach((count, blueprint) => {
      slot += Math.ceil(count / blueprint.maximumPcs)
    })

    return slot
  }

  /**
   * 인벤토리에 남아 있는 여유 무게를 계산하여 반환합니다.
   * 이 값은 인벤토리의 `this.maximumWeight - this.totalWeight` 계산의 결과입니다.
   */
  get availableSpaceWeight(): number {
    return this.maximumWeight - this.totalWeight
  }

  /**
   * 인벤토리에 남아있는 여유 슬롯의 갯수를 계산하여 반환합니다.
   * 이 값은 인벤토리의 `this.maximumSlot - this.totalSlot` 계산의 결과입니다.
   */
  get availableSpaceSlot(): number {
    return this.maximumSlot - this.totalSlot
  }

  private createItem(blueprint: ItemBlueprint): Item {
    return new Item(this.__inventoryManager, blueprint.key, Date.now())
  }

  /**
   * 현재 인벤토리에 해당 아이템을 추가할 수 있는지 여부를 반환합니다.
   * 주의하세요. 이 메서드는 아이템의 `onBeforeAdd` 콜백함수의 유효성 검사를 하지 않습니다.
   * 오로지 아이템의 무게, 슬롯 제한에 따른 인벤토리의 여유공간이 있는지만을 확인합니다.
   * @param key 검사할 아이템의 고유 키값입니다. 아이템 인스턴스를 넘기면 아이템을 직접 검사할 수 있습니다.
   */
  addible(key: string|Item): boolean {
    const blueprint = this.normalizeBlueprint(key)

    if (blueprint === null) {
      return false
    }

    // 무게가 부족하다면
    if (this.availableSpaceWeight < blueprint.weight) {
      return false
    }

    // 여분 슬롯이 없을 경우
    if (this.availableSpaceSlot <= 0) {
      // maximumPcs 속성으로 인해 같은 타입의 아이템이 모여있는지 확인합니다.
      const exists = this.get(key)!
      const lastSlotPcs = exists.length % blueprint.maximumPcs

      if (lastSlotPcs === 0) {
        return false
      }
    }
    
    return true
  }

  /**
   * 현재 인벤토리에 아이템을 가지고 있는 여부를 반환합니다.
   * @param key 아이템의 고유 키값입니다. 아이템 인스턴스를 넘기면 해당 아이템이 인벤토리에 있는지 여부를 반환합니다.
   */
  has(key: string|Item): boolean {
    return this.get(key).length !== 0
  }

  /**
   * 현재 인벤토리에 찾고자 하는 아이템 목록을 배열에 담아 반환합니다.
   * @param key 찾고자 하는 아이템의 고유 키값입니다. 아이템 인스턴스를 넘기면 아이템을 가져올 수 있습니다. 만일 인벤토리에 해당 아이템이 존재하지 않는다면 빈 배열을 반환합니다.
   */
  get(key: string|Item): Item[] {
    const blueprint = this.normalizeBlueprint(key)

    if (blueprint === null) {
      return []
    }

    // 아이템 인스턴스를 매개변수로 넘겼을 경우, 해당 아이템과 일치하는 것만을 반환함.
    if (key instanceof Item) {
      return this.__items.filter((item) => item === key)
    }

    return this.__items.filter((item) => item.key === blueprint.key)
  }

  /**
   * 현재 인벤토리의 아이템을 `이름(name)` 순으로 정렬합니다.
   * 이는 `this.items` 속성을 위해 사용됩니다.
   * @param desc 이 값을 `true`로 설정하면 내림차순으로 정렬합니다. 기본값은 `false`입니다.
   */
  sortByName(desc: boolean = false): this {
    const sortBy = desc ? -1 : 1
    this.__items.sort((a, b) => a.blueprint.name.localeCompare(b.blueprint.name) * sortBy)
    return this
  }
  
  /**
   * 현재 인벤토리의 아이템을 `추가된(timestamp)` 순으로 정렬합니다.
   * 이는 `this.items` 속성을 위해 사용됩니다.
   * @param desc 이 값을 `true`로 설정하면 내림차순으로 정렬합니다. 기본값은 `false`입니다.
   */
  sortByAdded(desc: boolean = false): this {
    const sortBy = desc ? -1 : 1
    this.__items.sort((a, b) => (a.timestamp - b.timestamp) * sortBy)
    return this
  }
  
  /**
   * 현재 인벤토리의 아이템을 `무게(weight)` 순으로 정렬합니다.
   * 이는 `this.items` 속성을 위해 사용됩니다.
   * @param desc 이 값을 `true`로 설정하면 내림차순으로 정렬합니다. 기본값은 `false`입니다.
   */
  sortByWeight(desc: boolean = false): this {
    const sortBy = desc ? -1 : 1
    this.__items.sort((a, b) => (a.blueprint.weight - b.blueprint.weight) * sortBy)
    return this
  }

  private normalizeBlueprint(key: string|Item): ItemBlueprint|null {
    let blueprint: ItemBlueprint

    if (typeof key === 'string') {
      if (!this.__inventoryManager.hasItemBlueprint(key)) {
        return null
      }
      blueprint = this.__inventoryManager.getItemBlueprint(key)!
    }
    else if (key instanceof Item) {
      blueprint = key.blueprint
    }
    else {
      return null
    }

    return blueprint
  }

  /**
   * 현재 인벤토리에 아이템을 추가합니다.
   * 추가하고자하는 아이템은 인벤토리 플러그인에서 `addItemBlueprint` 메서드로 등록한 아이템이여야 합니다.
   * 이 메서드는 아이템의 `onBeforeAdd` 콜백함수의 영향을 받으며, `onBeforeAdd` 콜백함수가 `false`를 반환한다면 아이템을 추가하지 않습니다.
   * `onBeforeAdd` 유효성 검사를 통과하더라도, 인벤토리의 `무게 제한(maximumWeight)`, `슬롯 제한(maximumSlot)`에 제한되면 추가하지 않습니다.
   * @param key 추가할 아이템의 고유 키값입니다. 아이템 인스턴스를 넘기면 아이템을 직접 추가할 수 있습니다.
   * @returns 인벤토리에 아이템 추가한 아이템을 반환합니다. 추가에 실패했다면 `null`을 반환합니다.
   */
  add(key: string|Item): Item|null {
    const blueprint = this.normalizeBlueprint(key)

    if (blueprint === null) {
      return null
    }

    // 아이템 추가 유효성 검사 함수를 실행하고, 적합하지 않았을 경우 추가하지 않음
    if (
      blueprint.onBeforeAdd &&
      !blueprint.onBeforeAdd(blueprint, this, this.__owner)
    ) {
      return null
    }

    // 무게, 슬롯 제한으로 인해 추가할 수 없음
    if (!this.addible(key)) {
      return null
    }

    const item = this.createItem(blueprint)
    this.__items.push(item)

    blueprint.onAdd(item, this, this.__owner)

    return item
  }

  /**
   * 현재 인벤토리에서 아이템을 제거합니다.
   * 제거하고자하는 아이템은 인벤토리 플러그인에서 `addItemBlueprint` 메서드로 등록한 아이템이여야 합니다.
   * 이 메서드는 아이템의 `onBeforeDrop` 콜백함수의 영향을 받으며, `onBeforeDrop` 콜백함수가 `false`를 반환한다면 아이템을 제거하지 않습니다.
   * 인벤토리에 아이템이 존재하지 않는다면 `null`를 반환합니다.
   * @param key 제거할 아이템의 고유 키값입니다. 아이템 인스턴스를 넘기면 아이템을 직접 제거할 수 있습니다.
   * @returns 인벤토리에서 아이템 제거한 아이템을 반환합니다. 제거에 실패했다면 `null`을 반환합니다.
   */
  drop(key: string|Item): Item|null {
    const blueprint = this.normalizeBlueprint(key)

    if (blueprint === null) {
      return null
    }

    // 아이템을 소유하고 있지 않음
    if (!this.has(key)) {
      return null
    }

    // 아이템 제거 유효성 검사 함수를 실행하고, 적합하지 않았을 경우 제거하지 않음
    const oldest = this.get(key)[0]
    if (
      blueprint.onBeforeDrop &&
      !blueprint.onBeforeDrop(oldest, this, this.__owner)
    ) {
      return null
    }

    const index = this.__items.indexOf(oldest)
    const item = this.__items.splice(index, 1)

    blueprint.onDrop(oldest, this, this.__owner)

    return item.pop()!
  }

  /**
   * 현재 인벤토리에 있는 아이템을 사용합니다.
   * 사용하고자하는 아이템은 인벤토리 플러그인에서 `addItemBlueprint` 메서드로 등록한 아이템이여야 합니다.
   * 이 메서드는 아이템의 `onBeforeUse` 콜백함수의 영향을 받으며, `onBeforeUse` 콜백함수가 `false`를 반환한다면 아이템을 사용하지 않습니다.
   * 인벤토리에 아이템이 존재하지 않는다면 `null`를 반환합니다.
   * @param key 사용할 아이템의 고유 키값입니다. 아이템 인스턴스를 넘기면 아이템을 직접 사용할 수 있습니다.
   * @returns 사용한 아이템을 반환합니다. 사용에 실패했다면 `null`을 반환합니다.
   */
  use(key: string|Item): Item|null {
    const blueprint = this.normalizeBlueprint(key)

    if (blueprint === null) {
      return null
    }

    // 아이템을 소유하고 있지 않음
    if (!this.has(key)) {
      return null
    }

    // 아이템 제거 유효성 검사 함수를 실행하고, 적합하지 않았을 경우 제거하지 않음
    const oldest = this.get(key)[0]
    if (
      blueprint.onBeforeUse &&
      !blueprint.onBeforeUse(oldest, this, this.__owner)
    ) {
      return null
    }

    let item: Item|null = null
    // 일회성 소모품이라면 1개 제거합니다.
    if (blueprint.disposable) {
      const index = this.__items.indexOf(oldest)
      const used = this.__items.splice(index, 1)

      item = used.pop()!
    }

    blueprint.onUse(oldest, this, this.__owner)

    return item
  }
}