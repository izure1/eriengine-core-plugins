export type CollideObject = Phaser.GameObjects.GameObject&Phaser.GameObjects.Components.Transform&Phaser.Physics.Matter.MatterPhysics
export type CollideHandler = (e: Phaser.Types.Physics.Matter.MatterCollisionData, pair: CollideObject) => void
export type BeforeDestroyHandler = () => void