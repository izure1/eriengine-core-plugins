import Phaser from 'phaser'
import * as Key from 'keycode-js'
import { Plugin as ActorPlugin, Actor } from '~/actor'
import { Plugin as IsomScenePlugin } from '~/isometric-scene'
import { PointerPlugin as IsomCursorPlugin, SelectPlugin as IsomSelectPlugin } from '~/isometric-cursor'
import { DialoguePlugin, ModalPlugin } from '~/dialogue'
import { Plugin as FowPlugin } from '~/fog-of-war'
import { Plugin as SpatialAudioPlugin, SpatialAudio } from '~/spatial-audio'
import { Plugin as FeelingPlugin } from '~/feeling'
import { Plugin as ParticlePlugin } from '~/particle'
import { Plugin as OptimizationPlugin } from '~/optimization'
import { Plugin as InventoryPlugin } from '~/inventory'
import { getIsometricSide } from '~/@common/Math/MathUtil'

class User extends Actor {
    private hp: number = 100
    declare scene: Test

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
        .add('effect', 'particle-red', false, { speed: 1500 })
        .add('dead', 'sprite-hannah-stand', true, { speed: 500, lifespan: 100 })
        .pause('dead')
        .pause('effect')
    }

    private initBattle(): void {
      this.battle.on('get-hit', (from, { key, damage }): void => {
        this.bubble.of('message').say(`윽! ${from.name}로부터 ${damage}만큼의 딜을 받았다!`)
        if (damage) {
          const min: number = Phaser.Math.MinSub(this.hp, damage, 0)
          this.hp = min
        }

        if (this.hp < 75) {
          if (!this.particle.has('smoke')) {
            this.particle.addExists('smoke', this.scene.particle.addSmoke(0, 0), true)
          }
        }
        
        if (this.hp < 30) {
          if (!this.particle.has('explode')) {
            this.particle.addExists('explode', this.scene.particle.addExplode(0, 0), true)
          }
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
        this.run.useMovingKey('arrow')
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
                return { damage: 1 }
            })
            .addSkill('use-missile', (target, dot) => {
              const actors = this.getAroundActors(1000, this.battle.enemies, true)
              
              if (actors.length <= 0) {
                return {}
              }

              const betweenAngle = this.getAngleBetween(actors[0])
              const missilePosition = this.getPointFromAngle(betweenAngle, 150)

              const rocket = this.bullet.addMissile(missilePosition, 'rocket', undefined, (_e, pair) => {
                if (pair instanceof Player) {
                  rocket.destroy()
                  this.scene.feeling.wound()
                  return
                }
                if (pair instanceof User) {
                  this.battle.useSkill('hit-missile', pair, 1, 'enemies')
                }
                rocket.destroy()
              }, () => {
                rocket.particle.explode('flame', 30)
              })

              rocket.fireMissile(betweenAngle, 0.1, 0.01, actors[0])
              rocket.particle.addExists('flame', this.scene.particle.addJet(0, 0))
              rocket.particle.addExists('smoke', this.scene.particle.addJetSmoke(0, 0))

              return {}
            })
            .addSkill('hit-missile', (target, dot) => {
              let damage = 45
              this.scene.feeling.wound()
              if (Math.random() > 0.75) {
                this.scene.feeling.critical()
                damage *= 2
              }
              return { damage }
            })
    }

    update(): void {
        super.update()
        if (this.spaceKey.isDown) {
            this.battle.useSkill('use-missile', this, 1, 'me')
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
    player: Player|null = null
    map!: IsomScenePlugin
    cursor!: IsomCursorPlugin
    select!: IsomSelectPlugin
    dialogue!: DialoguePlugin
    modal!: ModalPlugin
    actor!: ActorPlugin
    fow!: FowPlugin
    spatial!: SpatialAudioPlugin
    feeling!: FeelingPlugin
    particle!: ParticlePlugin
    optimization!: OptimizationPlugin
    inventory!: InventoryPlugin
    private shiftKey!: Phaser.Input.Keyboard.Key
    private ctrlKey!: Phaser.Input.Keyboard.Key
    private side: number = 10000
    private bgm!: SpatialAudio

    constructor() {
        super({ key: 'test', active: true })
    }

    preload(): void {
        this.load.image('wall-basic-left', '/assets/img/wall-basic-left.png')
        this.load.image('wall-basic-right', '/assets/img/wall-basic-right.png')
        this.load.image('tile-basic-1', '/assets/img/tile-basic-1.png')
        this.load.image('tile', '/assets/img/tile.png')
        this.load.image('dirt', '/assets/img/dirt_E.png')
        this.load.spritesheet('sprite-hannah-run', '/assets/img/sprite-hannah-run.webp', { frameWidth: 170, frameHeight: 210,  })
        this.load.spritesheet('sprite-hannah-stand', '/assets/img/sprite-hannah-stand.webp', { frameWidth: 170, frameHeight: 210 })
        this.load.image('particle-flash', '/assets/img/particle-flash.png')
        this.load.image('particle-red', '/assets/img/particle-red.png')
        this.load.image('character-sample', '/assets/img/character-sample.png')
        this.load.image('tile-stone', '/assets/img/stones.png')
        this.load.image('logo', '/assets/img/logo.png')
        this.load.image('rocket', '/assets/img/rocket.png')

        this.load.audio('bgm', '/assets/audio/bgm.mp3')
        this.load.audio('effect-chicken', '/assets/audio/effect-chicken.mp3')
    }
    
    async create() {
        this.player     = this.actor.addActor(Player, 'izure', this, 0, 0, 'sprite-hannah-stand')
        this.shiftKey   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
        this.ctrlKey    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL)

        this.input.mouse.disableContextMenu()
        this.map.setWorldSize(3000)

        this.sound.pauseOnBlur = false
        // this.bgm = this.spatial.addSpatialAudio('bgm', { x: 0, y: 0 })
        // this.bgm
        //   .setLoop(true)
        //   .setThresholdRadius(1000)
        //   .setVolume(0.3)
        //   .play()

        // this.fow
        //   .enable()
        //   .setRevealer(this.player)
        //   .changeDaylight('dawn', 0, true)

        const particle = this.particle.addFirefly(0, 0)

        this.player.particle.addExists('t', particle).pause('t')

        this.inventory.addItemBlueprint({
          key: 'potion',
          type: 'potion',
          name: '포션',
          thumbnail: '',
          description: '체력을 회복합니다',
          maximumPcs: 1,
          weight: 1,
          disposable: true,
          onAdd: async (item, inventory) => {},
          onDrop: async (item, inventory) => {},
          onUse: async (item, inventory) => {},
        })

        this.inventory.addItemBlueprint({
          key: 'gold',
          type: 'gold',
          name: '골드',
          thumbnail: '',
          description: '금화입니다',
          maximumPcs: 100,
          weight: 1,
          disposable: true,
          // onBeforeAdd: (item, inventory) => {
          //   if (inventory.owner instanceof Phaser.Scene) {
          //     console.log('씬에는 추가할 수 없음!')
          //     return false
          //   }
          //   return true
          // },
          onAdd: (item, inventory) => {
            console.log('추가됨')
          },
          onDrop: (item, inventory) => {
            console.log('버릴게')
          },
          onUse: (item, inventory) => {},
        })

        const playerInventory = this.inventory.of(this.player)
        const sceneInventory = this.inventory.of(this)
        const bank = this.inventory.createBank(playerInventory, sceneInventory)

        const gold = playerInventory.add('gold')
        sceneInventory.add('potion')

        if (gold) {
          gold.data.pcs = 10000
        }

        bank.on('offer', (list, agent) => {
          if (agent.owner !== playerInventory.owner) {
            console.log('상대가 ', list, '을 올렸습니다')
          }
        })

        bank.a.offer(playerInventory.get('gold'))
        bank.b.offer(sceneInventory.get('potion'))

        bank.a.done().then((received) => console.log(`a가 얻은 아이템은.. 쨔잔`, received))

        // this.player.particle.addExists('smoke', this.particle.addSmoke(0, 0), true)
        // this.player.particle.addExists('explode', this.particle.addExplode(0, 0, 100), true)

        // this.feeling.hit({ r: 0, g: 0, b: 0 }, 1, 0.15)

        // const chicken = this.sound.add('effect-chicken')
        // chicken.on(Phaser.Sound.Events.COMPLETE, () => {
        //   chicken.play({ delay: 3 })
        // }).play()

        this.dialogue.setUsingScene('coordinate').addDialogue('main', 'monologue')
        this.dialogue.get('main')?.speech([
            '내가 바로 타카오급 중순양함 2번함, 제2함대 기함——아타고야.',
            '내 곁에서 상당히 많은 자매들이 전투를 치렀지.',
            '어떤 임무라도 누나한테 맡겨주렴. 우후후……'
        ], undefined, undefined, { align: 'center' }).then(() => {
            this.dialogue.get('main')?.speech([
                'test',
                'test2'
            ])
        })

       this.modal.addModal('test', {
            title: '네이밍',
            subtitle: '캐릭터의 이름을 정해주세요',
            inputs: [
                {
                    key: 'id',
                    description: '아이디 입력',
                    type: 'text'
                },
                {
                    key: 'password',
                    description: '비밀번호 입력',
                    type: 'password'
                },
                {
                    key: 'age',
                    description: '나이 입력',
                    type: 'number'
                },
                {
                    key: 'isMan',
                    description: '남자인가요?',
                    type: 'boolean'
                },
            ],
            buttons: [
                {
                    text: '확인',
                    click: (answer) => {
                        console.log(answer)
                    }
                }
            ]
        })

        this.modal.get('test')?.open().close()

        this.cursor.enable(true)
        this.cursor.setGridSide(50)

        this.select.enable(true)
        this.select.setStrokeThickness(1)
        this.select.events.on('drag-end', (e, selection): void => {
            console.log(this.select.select(selection))
        })
        
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

        console.log(this.player, this, playerInventory, sceneInventory, bank)
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
              user.run.useMovingKey('wasd')

              this.optimization.add(user)

              this.player?.battle.addEnemy(user)
          }
          else if (this.shiftKey.isDown) {
              this.map.setFloorTile(`${x}:${y}`, x, y, 'dirt')
          }
          else {
              this.map.setWallTile(`${x}:${y}`, x, y, 'wall-basic-right')
          }
        }

        if (this.player) {
          // this.bgm.setPosition(this.player)
          // const distanceThreshold = 1000; //This is the max distance from the object. Any farther and no sound is played.
          // const distanceToObject = Phaser.Math.Distance.BetweenPoints(this.player, { x: 0, y: 0 })
          // let normalizedSound = 1 - (distanceToObject / distanceThreshold)
          // // let normalizedVolume = Phaser.Math.

          // // if (normalizedSound < 0) {
          // //   normalizedSound = 0
          // // }

          // // this.bgm.setPan(distanceToObject / distanceThreshold)
          // // console.log(normalizedSound, distanceToObject / distanceThreshold)
          // this.bgm.volume = Phaser.Math.Easing.Sine.In(normalizedSound)
        }
    }
}

const config: Phaser.Types.Core.GameConfig = {
    width: 1024,
    height: 768,
    type: Phaser.WEBGL,
    scene: [ Test, CoordinateSystem ],
    scale: {
      mode: Phaser.Scale.ScaleModes.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      parent: 'game',
      fullscreenTarget: 'game',
      zoom: 1
    },
    render: {
        maxLights: 10,
        // pipeline: {
        //   GloomyPostFX,
        //   DreamPostFX
        // } as any,
    },
    dom: {
        createContainer: true
    },
    plugins: {
        scene: [
            {
                key: 'ActorPlugin',
                mapping: 'actor',
                plugin: ActorPlugin
            },
            {
                key: 'IsomScenePlugin',
                mapping: 'map',
                plugin: IsomScenePlugin
            },
            {
                key: 'IsomCursorPlugin',
                mapping: 'cursor',
                plugin: IsomCursorPlugin
            },
            {
                key: 'IsomSelectPlugin',
                mapping: 'select',
                plugin: IsomSelectPlugin
            },
            {
                key: 'FowPlugin',
                mapping: 'fow',
                plugin: FowPlugin
            },
            {
                key: 'dialoguePlugin',
                mapping: 'dialogue',
                plugin: DialoguePlugin
            },
            {
                key: 'modalPlugin',
                mapping: 'modal',
                plugin: ModalPlugin
            },
            {
              key: 'spatialAudioPlugin',
              mapping: 'spatial',
              plugin: SpatialAudioPlugin
            },
            {
              key: 'FeelingPlugin',
              mapping: 'feeling',
              plugin: FeelingPlugin
            },
            {
              key: 'ParticlePlugin',
              mapping: 'particle',
              plugin: ParticlePlugin
            },
            {
              key: 'OptimizationPlugin',
              mapping: 'optimization',
              plugin: OptimizationPlugin
            },
            {
              key: 'InventoryPlugin',
              mapping: 'inventory',
              plugin: InventoryPlugin
            }
            // {
            //   key: 'daylightPlugin',
            //   mapping: 'daylight',
            //   plugin: DaylightPlugin
            // }
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