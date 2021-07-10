declare type Primitive = string|number|boolean|Json|null|Primitive[]
declare interface Json {
  [key: string]: Primitive
}