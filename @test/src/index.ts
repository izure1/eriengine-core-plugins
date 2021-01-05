import Phaser from 'phaser'
import { Plugin as ActorPlugin, Actor } from '~/actor'
import { Plugin as IsomScenePlugin } from '~/isometric-scene'
import { Plugin as IsomCursorPlugin } from '~/isometric-cursor'
import { Plugin as DialoguePlugin } from '~/dialogue'
import { Plugin as FowPlugin } from '~/fog-of-war'
import { getIsometricSide } from '~/@common/Math/MathUtil'

class User extends Actor {
    private hp: number = 100

    constructor(name: string, scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture)
        this.setName(name)
    }

    private initBubble(): void {
        this.bubble.of('name')
            .setOffset('top')
            .setAlign('center')
            .notice(this.name, { fontSize: '20px', fontStyle: 'bold', align: 'center' })
        this.bubble.of('message')
            .setOffset('right')
            .setAlign('left')
            .setVertical('middle')
            .say(`내 이름은 ${this.name}! 내가 돌아왔다!`, undefined, { align: 'left' })
    }

    private initParticle(): void {
        this.particle
            .add('effect', 'particle-red', true, { speed: 1500 })
            .add('explode', 'particle-flash')
            .add('dead', 'sprite-hannah-stand', true, { speed: 500, lifespan: 100 })
            .pause('explode').pause('dead').pause('effect')
    }

    private initBattle(): void {
        this.battle.on('get-hit', (from, { key, damage }): void => {
            this.bubble.of('message').say(`윽! ${from.name}로부터 ${damage}만큼의 딜을 받았다!`)
            if (damage) {
                const min: number = Phaser.Math.MinSub(this.hp, damage, 0)
                this.hp = min
            }
            if (this.hp <= 0) {
                this.battle.defeat()
                this.destroy()
            }
        })
        this.battle.on('win', (from): void => {
            this.bubble.of('message').say(`와! ${from.name}로부터 승리했다!`)
        })
    }

    start(): void {
        this.initBubble()
        this.initParticle()
        this.initBattle()
        this.play('hannah-stand', true)
    }

    update(): void {
        if (!this.run.isMoving) {
            this.play('hannah-stand', true)
        }
        else if (this.run.isMovingLeft) {
            this.flipX = false
            this.play('hannah-run', true)
        }
        else if (this.run.isMovingRight) {
            this.flipX = true
            this.play('hannah-run', true)
        }
    }

    end(): void {
        this.particle.explode('dead', 10)
        console.log(this.name + ' has been destroied')
    }
}

class Player extends User {
    private spaceKey: Phaser.Input.Keyboard.Key = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    private initRun(): void {
        this.run.useMoveKey('arrow')
    }

    start(): void {
        super.start()
        this.initRun()
        this.followCamera(0.7)
        //this.particle.play('explode')

        this.battle
            .addSkill('default', (target, dot) => {
                const damage: number = 10
                return { damage }
            })
            .addSkill('confuse', (target, dot) => {
                target.setStatic(true)
                target.dot.start('confuse', 5000, undefined, (): void => {
                    if (target) {
                        target.setStatic(false)
                    }
                })
                return {}
            })
    }

    update(): void {
        super.update()
        if (this.spaceKey.isDown) {
            const a = this.getAroundActors(150)
            this.particle.explode('effect', 20)
            this.battle.useSkill('confuse', this, 250, 'all-except-me')
        }
    }
}


let x: number = 0
let y: number = 0

class CoordinateSystem extends Phaser.Scene {
    private text: Phaser.GameObjects.Text|null = null
    private map!: IsomScenePlugin

    constructor() {
        super({ key: 'coordinate', active: true })
    }

    create(): void {
        this.text = this.add.text(10, 10, '')
        console.log(this)
    }

    update(): void {
        if (this.text) {
            const iso = this.map.toIsometricCoord({ x, y })
            this.text.setText(`Cartesian: ${x},${y}
Isometric: ${~~iso.x},${~~iso.y}
fps: ${this.game.loop.actualFps}
            `)
        }
    }
}

class Test extends Phaser.Scene {
    private player: Player|null = null
    private map!: IsomScenePlugin
    private cursor!: IsomCursorPlugin
    private dialogue!: DialoguePlugin
    private actor!: ActorPlugin
    private fow!: FowPlugin
    private shiftKey!: Phaser.Input.Keyboard.Key
    private ctrlKey!: Phaser.Input.Keyboard.Key
    private side: number = getIsometricSide(235/2)

    constructor() {
        super({ key: 'test', active: true })
    }

    preload(): void {
        this.load.image('wall-basic-left', '/assets/img/wall-basic-left.png')
        this.load.image('wall-basic-right', '/assets/img/wall-basic-right.png')
        this.load.image('tile-basic-1', '/assets/img/tile-basic-1.png')
        this.load.image('tile', '/assets/img/tile.png')
        this.load.spritesheet('sprite-hannah-run', '/assets/img/sprite-hannah-run.webp', { frameWidth: 170, frameHeight: 210 })
        this.load.spritesheet('sprite-hannah-stand', '/assets/img/sprite-hannah-stand.webp', { frameWidth: 170, frameHeight: 210 })
        this.load.image('particle-flash', '/assets/img/particle-flash.png')
        this.load.image('particle-red', '/assets/img/particle-red.png')
        this.load.image('character-sample', '/assets/img/character-sample.png')
        this.load.image('tile-stone', '/assets/img/stones.png')
    }
    
    create(): void {
        const side: number = getIsometricSide(this.side)

        this.player     = this.actor.addActor(Player, 'izure', this, 100, 100, 'sprite-hannah-stand')
        this.shiftKey   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
        this.ctrlKey    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL)
        
        this.input.mouse.disableContextMenu()

        //this.dialogue.addCharacter('character-sample', -150, 50)
        //this.dialogue.say('character-sample', '내가 바로 타카오급 중순양함 2번함, 제2함대 기함——아타고야. 내 곁에서 상당히 많은 자매들이 전투를 치렀지. 어떤 임무라도 누나한테 맡겨주렴. 우후후……')

        this.cursor.enable(true)
        this.cursor.setGridSide(side)

        this.fow.setRevealer(this.player, 0x000000, (object) => {
            console.log(object.name)
            if (object.name === 'eriengine-core-plugin-actor-bubble-text') return false
            return true
        }).setRadius(500)
        
        this.anims.create({
            key: 'hannah-stand',
            frames: this.anims.generateFrameNumbers('sprite-hannah-stand', { start: 0, end: 38 }),
            frameRate: 12,
            repeat: -1
        })
        
        this.anims.create({
            key: 'hannah-run',
            frames: this.anims.generateFrameNumbers('sprite-hannah-run', { start: 0, end: 14 }),
            frameRate: 18,
            repeat: -1
        })


        this.input.on(Phaser.Input.Events.POINTER_DOWN, async (e: Phaser.Input.Pointer): Promise<void> => {
            if (e.button === 2) {
                if (this.player && this.player.active) {
                    this.player.run.to(await this.map.getRoutes(this.player, this.cursor.pointer))
                }
            }
        })

        console.log(this.player, this)
    }

    update(): void {
        if (this.player && this.player.active) {
            x = ~~this.player.x
            y = ~~this.player.y
        }

        if (this.input.mousePointer.leftButtonDown()) {
            const { x, y } = this.cursor.pointer
            if (!this.shiftKey.isDown && !this.ctrlKey.isDown) {
                const user: User = this.actor.addActor(User, performance.now().toString(), this, 0, 0, 'sprite-hannah-stand')
                user.setPosition(x, y)
                user.run.useMoveKey('wasd')
            }
            else if (this.shiftKey.isDown) {
                this.map.setFloortile(x, y, this.side, 'tile-basic-1')
            }
            else {
                this.map.setWalltile(x, y, this.side, 'wall-basic-left')
            }
        }
    }
}

const config: Phaser.Types.Core.GameConfig = {
    width: 1024,
    height: 768,
    type: Phaser.WEBGL,
    scene: [ Test, CoordinateSystem ],
    scale: {
        parent: '#game',
        fullscreenTarget: '#game',
        zoom: 1
    },
    render: {
        maxLights: 10
    },
    dom: {
        createContainer: true
    },
    plugins: {
        global: [
            {
                key: 'dialoguePlugin',
                mapping: 'dialogue',
                plugin: DialoguePlugin
            }
        ],
        scene: [
            {
                key: 'actorPlugin',
                mapping: 'actor',
                plugin: ActorPlugin
            },
            {
                key: 'isomScenePlugin',
                mapping: 'map',
                plugin: IsomScenePlugin,
                start: false
            },
            {
                key: 'isomCursorPlugin',
                mapping: 'cursor',
                plugin: IsomCursorPlugin
            },
            {
                key: 'fogOfWarPlugin',
                mapping: 'fow',
                plugin: FowPlugin
            }
        ]
    },
    physics: {
        default: 'matter',
        matter: {
            // debug: true,
            gravity: {
                x: 0,
                y: 0
            }
        }
    }
}

const game: Phaser.Game = new Phaser.Game(config)