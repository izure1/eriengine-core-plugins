import { Inventory } from './Inventory'
import { Plugin } from './eriengine-core-plugin-inventory'

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
   * 이 함수를 지정하지 않는다면, 유효성 검사는 항상 `true`를 반환할 것입니다.
   * @param item 해당 아이템 인스턴스입니다.
   * @param inventory 해당 아이템이 속한 인벤토리 인스턴스입니다.
   * @param owner 아이템의 사용자입니다.
   */
  onBeforeAdd?(item: ItemBlueprint, inventory: Inventory, owner: any): boolean

  /**
   * 아이템이 인벤토리에 추가됐을 때 호출될 콜백함수입니다.
   * 이 함수는 `onBeforeAdd` 메서드의 유효성을 통과하고, 슬롯, 무게 제한을 통과한 이후에 실제로 인벤토리에 추가되었을 때만 호출됩니다.
   * @param item 해당 아이템 인스턴스입니다.
   * @param inventory 해당 아이템이 속한 인벤토리 인스턴스입니다.
   * @param owner 아이템의 사용자입니다.
   */
  onAdd(item: Item, inventory: Inventory, owner: any): void

  /**
   * 아이템을 인벤토리에서 제거하기 전에, 호출될 콜백함수입니다.  
   * 이 함수는 아이템을 인벤토리에서 제거하기 전에, 유효성을 검사하는 함수입니다.
   * 이 함수에서 `true`를 반환한다면, 아이템은 인벤토리에서 제거될 것입니다. 하지만 `false`를 반환한다면 아이템은 인벤토리에서 제거되지 않습니다.
   * 이 함수를 지정하지 않는다면, 유효성 검사는 항상 `true`를 반환할 것입니다.
   * @param item 해당 아이템 인스턴스입니다.
   * @param inventory 해당 아이템이 속한 인벤토리 인스턴스입니다.
   * @param owner 아이템의 사용자입니다.
   */
  onBeforeDrop?(item: Item, inventory: Inventory, owner: any): boolean

  /**
   * 아이템을 인벤토리에서 제거했을 때, 호출될 콜백함수입니다.
   * 이 함수는 `onBeforeDrop` 메서드의 유효성을 통과한 이후에 실제로 인벤토리에서 제거되었을 때만 호출됩니다.
   * @param item 해당 아이템 인스턴스입니다.
   * @param inventory 해당 아이템이 속했던 인벤토리 인스턴스입니다.
   * @param owner 아이템의 사용자입니다.
   */
  onDrop(item: Item, inventory: Inventory, owner: any): void

  /**
   * 아이템을 사용하기 전에, 호출될 콜백함수입니다.  
   * 이 함수는 아이템을 사용하기 전에, 유효성을 검사하는 함수입니다.
   * 이 함수에서 `true`를 반환한다면, 아이템은 사용될 것입니다. 하지만 `false`를 반환한다면 아이템은 사용되지 않습니다.
   * 이 함수를 지정하지 않는다면, 유효성 검사는 항상 `true`를 반환할 것입니다.
   * @param item 해당 아이템 인스턴스입니다.
   * @param inventory 해당 아이템이 속한 인벤토리 인스턴스입니다.
   * @param owner 아이템의 사용자입니다.
   */
  onBeforeUse?(item: Item, inventory: Inventory, owner: any): boolean

  /**
   * 아이템을 사용했을 때, 호출될 콜백함수입니다.
   * 이 함수는 `onBeforeUse` 메서드의 유효성을 통과한 이후에 실제로 사용되었을 때만 호출됩니다.
   * @param item 해당 아이템 인스턴스입니다.
   * @param inventory 해당 아이템이 속했던 인벤토리 인스턴스입니다.
   * @param owner 아이템의 사용자입니다.
   */
  onUse(item: Item, inventory: Inventory, owner: any): void
}

export class Item {
  private __inventoryManager: Plugin
  /** 아이템의 고유 키입니다. 이 값은 다른 아이템 종류와 결코 중복되어선 안됩니다. */
  key: string
  /** 아이템이 추가된 시각입니다. `timestamp` 값입니다. */
  timestamp: number
  /** 아이템의 사용자 정의 데이터입니다. 가령 아이템에 강화 수치 기능을 추가하고 싶다면, 이 속성을 이용하십시오.
   * 돈, 골드와 같은 많은 갯수를 필요로 하는 아이템 구현에 사용하기에도 좋습니다.
   */
  data: Json

  constructor(inventoryManager: Plugin, key: string, timestamp: number) {
    this.__inventoryManager = inventoryManager
    this.key = key
    this.timestamp = timestamp
    this.data = {}
  }

  /** 해당 아이템의 블루프린트입니다. */
  get blueprint(): ItemBlueprint {
    return this.__inventoryManager.getItemBlueprint(this.key)!
  }
}