import Phaser from 'phaser'
import { Point2 } from '@common/Math/MathUtil'

type Primitive = string|number|boolean|Json|null|Primitive[]
interface Json {
  [key: string]: Primitive
}

export interface ItemBlueprint {
  /** 아이템의 고유 키입니다. 이 값은 다른 아이템 종류와 결코 중복되어선 안됩니다. */
  readonly key: string
  /** 아이템의 타입입니다. 이는 아이템의 종류를 구분짓는 용도로 사용합니다. 가령 갑옷, 무기, 신발, 소모품 등으로 구분지을 수 있습니다. */
  readonly type: string
  /** 게임에서 보여질 아이템의 이름입니다. */
  readonly name: string
  /** 게임에서 보여질 아이템의 이미지입니다. Phaser에서 불러온 텍스쳐 키를 사용합니다. */
  readonly thumbnail: string
  /** 아이템의 설명입니다. */
  readonly description: string
  /** 아이템을 모을 수 있는 최대 갯수를 지정합니다. 최소 `1`입니다. 이 개수만큼 아이템을 중첩하여 슬롯을 아낄 수 있습니다. */
  readonly maximumPcs: number
  /** 아이템의 무게입니다. 인벤토리의 무게 시스템을 사용한다면 이 값을 통해 인벤토리가 꽉 찼을 경우 더 이상 추가할 수 없게 됩니다. */
  readonly weight: number
  /** 아이템이 일회성 소모품인지 여부를 지정합니다. 이 값이 `true`라면, `use` 메서드로 아이템을 사용했을 때, 인벤토리에서 1개 제거됩니다. 이는 포션과 같은 일회성 아이템을 위해 사용됩니다. */
  readonly disposable: boolean

  /**
   * 아이템을 인벤토리에 추가하기 전에, 호출될 콜백함수입니다.  
   * 이 함수는 아이템을 인벤토리에 추가하기 전에, 유효성을 검사하는 함수입니다.
   * 이 함수에서 `true`를 반환한다면, 아이템은 인벤토리에 추가될 것입니다. 하지만 `false`를 반환한다면 아이템은 인벤토리에 추가되지 않습니다.
   * @param item 해당 아이템 인스턴스입니다.
   * @param inventory 해당 아이템이 속한 인벤토리 인스턴스입니다.
   */
  onBeforeAdd?(item: ItemBlueprint, inventory: Inventory): Promise<boolean>

  /**
   * 아이템이 인벤토리에 추가됐을 때 호출될 콜백함수입니다.
   * 이 함수는 `onBeforeAdd` 메서드의 유효성을 통과하고, 슬롯, 무게 제한을 통과한 이후에 실제로 인벤토리에 추가되었을 때만 호출됩니다.
   * @param item 해당 아이템 인스턴스입니다.
   * @param inventory 해당 아이템이 속한 인벤토리 인스턴스입니다.
   */
  onAdd(item: Item, inventory: Inventory): Promise<void>

  /**
   * 아이템을 인벤토리에서 제거하기 전에, 호출될 콜백함수입니다.  
   * 이 함수는 아이템을 인벤토리에서 제거하기 전에, 유효성을 검사하는 함수입니다.
   * 이 함수에서 `true`를 반환한다면, 아이템은 인벤토리에서 제거될 것입니다. 하지만 `false`를 반환한다면 아이템은 인벤토리에서 제거되지 않습니다.
   * @param item 해당 아이템 인스턴스입니다.
   * @param inventory 해당 아이템이 속한 인벤토리 인스턴스입니다.
   */
  onBeforeDrop?(item: Item, inventory: Inventory): Promise<boolean>

  /**
   * 아이템을 인벤토리에서 제거했을 때, 호출될 콜백함수입니다.
   * 이 함수는 `onBeforeDrop` 메서드의 유효성을 통과한 이후에 실제로 인벤토리에서 제거되었을 때만 호출됩니다.
   * @param item 해당 아이템 인스턴스입니다.
   * @param inventory 해당 아이템이 속했던 인벤토리 인스턴스입니다.
   */
  onDrop(item: Item, inventory: Inventory): Promise<void>

  /**
   * 아이템을 사용하기 전에, 호출될 콜백함수입니다.  
   * 이 함수는 아이템을 사용하기 전에, 유효성을 검사하는 함수입니다.
   * 이 함수에서 `true`를 반환한다면, 아이템은 사용될 것입니다. 하지만 `false`를 반환한다면 아이템은 사용되지 않습니다.
   * @param item 해당 아이템 인스턴스입니다.
   * @param inventory 해당 아이템이 속한 인벤토리 인스턴스입니다.
   */
  onBeforeUse?(item: Item, inventory: Inventory): Promise<boolean>

  /**
   * 아이템을 사용했을 때, 호출될 콜백함수입니다.
   * 이 함수는 `onBeforeUse` 메서드의 유효성을 통과한 이후에 실제로 사용되었을 때만 호출됩니다.
   * @param item 해당 아이템 인스턴스입니다.
   * @param inventory 해당 아이템이 속했던 인벤토리 인스턴스입니다.
   */
  onUse(item: Item, inventory: Inventory): Promise<void>
}

export class Item {
  private __inventoryManager: Plugin
  private __inventory: Inventory
  /** 아이템의 고유 키입니다. 이 값은 다른 아이템 종류와 결코 중복되어선 안됩니다. */
  key: string
  /** 아이템이 추가된 시각입니다. `timestamp` 값입니다. */
  regdate: number
  /** 아이템의 사용자 정의 데이터입니다. 가령 아이템에 강화 수치 기능을 추가하고 싶다면, 이 속성을 이용하십시오. */
  data: Json

  constructor(inventoryManager: Plugin, inventory: Inventory, key: string, regdate: number) {
    this.__inventoryManager = inventoryManager
    this.__inventory = inventory
    this.key = key
    this.regdate = regdate
    this.data = {}
  }

  /** 해당 아이템의 블루프린트입니다. */
  get blueprint(): ItemBlueprint {
    return this.__inventoryManager.getItemBlueprint(this.key)!
  }
}

export class Inventory {
  private readonly __items: Item[] = []
  private readonly __inventoryManager: Plugin

  private maximumWeight: number = Infinity
  private maximumSlot: number = Infinity

  constructor(inventoryManager: Plugin) {
    this.__inventoryManager = inventoryManager
  }

  /**
   * 현재 인벤토리에 저장된 모든 아이템을 배열로 반환합니다.
   */
  get items(): Item[] {
    return this.__items
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
    return new Item(this.__inventoryManager, this, blueprint.key, Date.now())
  }

  /**
   * 현재 인벤토리에 해당 아이템을 추가할 수 있는지 여부를 반환합니다.
   * 주의하세요. 이 메서드는 아이템의 `onBeforeAdd` 콜백함수의 유효성 검사를 하지 않습니다.
   * 오로지 아이템의 무게, 슬롯 제한에 따른 인벤토리의 여유공간이 있는지만을 확인합니다.
   * @param key 검사할 아이템의 고유 키값입니다.
   */
  async addible(key: string): Promise<boolean> {
    if (!this.__inventoryManager.hasItemBlueprint(key)) {
      return false
    }

    const blueprint = this.__inventoryManager.getItemBlueprint(key)!

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

  // 인벤토리에 아이템을 가지고 있는지 여부를 반환
  has(key: string): boolean {
    return this.get(key).length !== 0
  }

  // 인벤토리에 있는 아이템을 키값으로 검색하여 배열에 담아 반환
  get(key: string): Item[] {
    return this.__items.filter((item) => item.key === key)
  }

  // 인벤토리의 아이템을 이름 순으로 정렬
  sortByName(desc: boolean = false): this {
    const sortBy = desc ? -1 : 1
    this.__items.sort((a, b) => a.blueprint.name.localeCompare(b.blueprint.name) * sortBy)
    return this
  }
  
  // 인벤토리 아이템을 추가한 시간 순으로 정렬
  sortByAdded(desc: boolean = false): this {
    const sortBy = desc ? -1 : 1
    this.__items.sort((a, b) => (a.regdate - b.regdate) * sortBy)
    return this
  }
  
  // 인벤토리 아이템을 무게 순으로 정렬
  sortByWeight(desc: boolean = false): this {
    const sortBy = desc ? -1 : 1
    this.__items.sort((a, b) => (a.blueprint.weight - b.blueprint.weight) * sortBy)
    return this
  }

  // 인벤토리에 아이템을 추가.
  async add(key: string): Promise<boolean> {
    if (!this.__inventoryManager.hasItemBlueprint(key)) {
      return false
    }

    // 아이템 추가 유효성 검사 함수를 실행하고, 적합하지 않았을 경우 추가하지 않음
    const blueprint = this.__inventoryManager.getItemBlueprint(key)!
    if (
      blueprint.onBeforeAdd &&
      !await blueprint.onBeforeAdd(blueprint, this)
    ) {
      return false
    }

    // 무게, 슬롯 제한으로 인해 추가할 수 없음
    if (!await this.addible(key)) {
      return false
    }

    const item = this.createItem(blueprint)
    this.__items.push(item)

    blueprint.onAdd(item, this)

    return true
  }

  // 인벤토리에서 아이템을 제거.
  async drop(key: string): Promise<boolean> {
    if (!this.__inventoryManager.hasItemBlueprint(key)) {
      return false
    }

    // 아이템을 소유하고 있지 않음
    if (!this.has(key)) {
      return false
    }

    // 아이템 제거 유효성 검사 함수를 실행하고, 적합하지 않았을 경우 제거하지 않음
    const blueprint = this.__inventoryManager.getItemBlueprint(key)!
    const oldest = this.get(key)[0]
    if (
      blueprint.onBeforeDrop &&
      !await blueprint.onBeforeDrop(oldest, this)
    ) {
      return false
    }

    const index = this.__items.indexOf(oldest)
    this.__items.splice(index, 1)

    blueprint.onDrop(oldest, this)

    return true
  }

  // 인벤토리에 있는 아이템을 사용.
  async use(key: string): Promise<boolean> {
    if (!this.__inventoryManager.hasItemBlueprint(key)) {
      return false
    }

    // 아이템을 소유하고 있지 않음
    if (!this.has(key)) {
      return false
    }

    // 아이템 제거 유효성 검사 함수를 실행하고, 적합하지 않았을 경우 제거하지 않음
    const blueprint = this.__inventoryManager.getItemBlueprint(key)!
    const oldest = this.get(key)[0]
    if (
      blueprint.onBeforeUse &&
      !await blueprint.onBeforeUse(oldest, this)
    ) {
      return false
    }

    // 일회성 소모품이라면 1개 제거합니다.
    if (blueprint.disposable) {
      const index = this.__items.indexOf(oldest)
      this.__items.splice(index, 1)
    }

    blueprint.onUse(oldest, this)

    return true
  }
}

export class Plugin extends Phaser.Plugins.ScenePlugin {
  private __inventorys: Map<any, Inventory> = new Map
  private __itemBlurprints: Map<string, ItemBlueprint> = new Map

  boot(): void {
    this.scene.events.on(Phaser.Scenes.Events.DESTROY, this.destroy.bind(this))
  }

  /** `addItemBlueprint` 메서드로 추가된 모든 아이템 타입을 배열로 반환합니다. */
  get blueprints(): ItemBlueprint[] {
    return Array.from(this.__itemBlurprints.values())
  }

  /** `addItemBlueprint` 메서드로 추가된 모든 아이템의 키값을 배열로 반환합니다. */
  get blueprintKeys(): string[] {
    return Array.from(this.__itemBlurprints.keys())
  }

  // 인벤토리 주인을 설정하고, 인벤토리 인스턴스를 생성 및 반환
  /**
   * 인벤토리의 주인을 설정하고, 인벤토리 인스턴스를 생성합니다.
   * 기존에 이미 생성했다면 생성되었던 인벤토리 인스턴스를 반환합니다.
   * @param owner 인벤토리의 주인입니다. 문자열, 게임 오브젝트 등 모든 타입을 사용할 수 있습니다.
   * @returns 생성된 인벤토리 인스턴스입니다.
   */
  of(owner: any): Inventory {
    if (!this.__inventorys.has(owner)) {
      this.__inventorys.set(owner, new Inventory(this))
    }
    return this.__inventorys.get(owner)!
  }

  /**
   * 새로운 아이템 블루프린트를 추가합니다.
   * 추가한 이후에 인벤토리 인스턴스에서 동일한 `key` 속성을 이용하여 아이템을 추가/사용할 수 있습니다.
   * ```
   * this.inventory.addItemBlueprint({ key: 'potion', ... })
   * this.inventory.of(myActor).add('potion') // 아이템 추가
   * this.inventory.of(myActor).use('potion') // 아이템 사용
   * ```
   * @param item 아이템의 상세 구현이 되어있는 설계도입니다.
   */
  addItemBlueprint(item: ItemBlueprint): this {
    this.__itemBlurprints.set(item.key, item)

    return this
  }

  /**
   * `addItemBlueprint` 메서드로 해당 아이템 블루프린트를 추가했는지 여부를 반환합니다.
   * @param key 추가한 아이템 블루프린트의 고유 키값입니다.
   */
  hasItemBlueprint(key: string): boolean {
    return this.__itemBlurprints.has(key)
  }

  /**
   * `addItemBlueprint` 메서드로 추가된 아이템 블루프린트를 반환합니다.
   * 추가되지 않았다면 `null`을 반환합니다.
   * @param key 추가한 아이템 블루프린트의 고유 키값입니다.
   */
  getItemBlueprint(key: string): ItemBlueprint|null {
    return this.__itemBlurprints.get(key) ?? null
  }

  destroy(): void {
    this.__inventorys.clear()
    this.__itemBlurprints.clear()
  }
}