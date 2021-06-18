type PhysicsGameObject = Phaser.Physics.Matter.Image|Phaser.Physics.Matter.Sprite
export type CollideObject = Phaser.GameObjects.GameObject&Phaser.GameObjects.Components.Transform&PhysicsGameObject
export type CollideHandler = (e: Phaser.Types.Physics.Matter.MatterCollisionData, pair: CollideObject) => void
export type BeforeDestroyHandler = () => void