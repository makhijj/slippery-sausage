import { useEffect, useRef } from "react";
import * as Phaser from "phaser";

//game variables
const GRAVITY = 1200;
const JUMP_FORCE = -550;
const MOVE_ACCELERATION = 300;
const MAX_MOVE_SPEED = 450;
const FRICTION = 0.99;
const CELL_SIZE = 32;
const BASE_COLS = 40;
const MAX_STRETCH = 7 * CELL_SIZE;
const STRETCH_SPEED = 800;
const PLAYER_WIDTH = 1.5;
const PLAYER_HEIGHT = 0.8;

type Tile = {
  x: number;
  y: number;
  type: "platform" | "spike" | "wall";
  width: number;
  height: number;
  properties: Record<string, unknown>;
};

type Enemy = {
  x: number;
  y: number;
  type: "basic" | "flying";
  width: number;
  height: number;
  properties: Record<string, unknown>;
};

type Checkpoint = {
  x: number;
  y: number;
};

type SpawnPoint = {
  x: number;
  y: number;
};

type LevelData = {
  height: number;
  spawnPoint: SpawnPoint | null;
  tiles: Tile[];
  enemies: Enemy[];
  checkpoints: Checkpoint[];
  goal: { x: number; y: number } | null;
};

type Props = {
  levelData: LevelData;
  onExit: () => void;
};

function GamePlayer({ levelData, onExit }: Props) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const levelHeightPxs = levelData.height * CELL_SIZE;
    const levelWidthPxs = BASE_COLS * CELL_SIZE;

    class GameScene extends Phaser.Scene {
      playerSprite!: Phaser.GameObjects.Sprite;
      player!: Phaser.GameObjects.Rectangle;
      playerBody!: Phaser.Physics.Arcade.Body;
      platforms!: Phaser.Physics.Arcade.StaticGroup;
      spikes!: Phaser.Physics.Arcade.StaticGroup;
      enemies!: Phaser.Physics.Arcade.Group;
      checkpoints!: Phaser.Physics.Arcade.StaticGroup;
      cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      frontFeetHitbox!: Phaser.GameObjects.Rectangle;
      frontFeetBody!: Phaser.Physics.Arcade.Body;
      wasd!: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
      };
      spaceKey!: Phaser.Input.Keyboard.Key;
      lastCheckpoint!: { x: number; y: number };
      facingRight: boolean = true;
      stretchActive: boolean = false;
      stretchCurrentLength: number = 0;
      stretchGrabbed: boolean = false;
      stretchKey!: Phaser.Input.Keyboard.Key;
      goalObject!: Phaser.GameObjects.Image;
      timerText!: Phaser.GameObjects.Text;
      gameWon: boolean = false;

      constructor() {
        super({ key: "GameScene" });
      }

      preload() {
        this.load.spritesheet("dog", "/assets/dog_stretch.png", {
          frameWidth: 224,
          frameHeight: 35,
        });
        this.load.spritesheet("flying_enemy", "/assets/flying_enemy.png", {
          frameWidth: 32,
          frameHeight: 32,
        });
        this.load.image("platform", "/assets/platform.png");
        this.load.image("wall", "/assets/wall.png");
        this.load.image("spike", "/assets/spike.png");
        this.load.image("goal", "/assets/goal.png");
        this.load.image("background", "/assets/background.png");
        this.load.image("checkpoint", "/assets/checkpoint.png");
        this.load.image("basic_enemy", "/assets/basic_enemy.png");
      }

      create() {
        this.gameWon = false;
        //track global time for timer
        startTimeRef.current = Date.now();

        //bg
        this.add
          .tileSprite(0, 0, levelWidthPxs, levelHeightPxs, "background")
          .setOrigin(0, 0)
          .setAlpha(0.5);

        this.physics.world.setBounds(0, 0, levelWidthPxs, levelHeightPxs);

        const spawn = levelData.spawnPoint || { x: 5, y: 5 };
        const spawnPx = {
          x: spawn.x * CELL_SIZE + CELL_SIZE / 2,
          y: levelHeightPxs - spawn.y * CELL_SIZE - CELL_SIZE,
        };
        this.lastCheckpoint = spawnPx;

        this.platforms = this.physics.add.staticGroup();
        this.spikes = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        this.checkpoints = this.physics.add.staticGroup();

        //saw spin animation sheet
        this.anims.create({
          key: "spin",
          frames: this.anims.generateFrameNumbers("flying_enemy", {
            start: 0,
            end: 7,
          }),
          frameRate: 12,
          repeat: -1,
        });

        //player hitbox
        this.player = this.add.rectangle(
          spawnPx.x,
          spawnPx.y,
          CELL_SIZE * PLAYER_WIDTH,
          CELL_SIZE * PLAYER_HEIGHT,
          0x000000,
          0,
        ) as any;
        this.physics.add.existing(this.player);
        this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        this.playerBody.setSize(CELL_SIZE * PLAYER_WIDTH, CELL_SIZE * PLAYER_HEIGHT);
        this.playerBody.setOffset(0, (CELL_SIZE * PLAYER_HEIGHT) / 4);
        this.playerBody.setCollideWorldBounds(false);
        this.playerBody.setGravityY(GRAVITY);
        this.playerBody.setMaxVelocityX(MAX_MOVE_SPEED);
        this.playerBody.setMaxVelocityY(800);
        this.playerBody.setDragX(200);

        //player sprite
        this.playerSprite = this.add.sprite(spawnPx.x, spawnPx.y, "dog", 0) as any;
        this.playerSprite.setOrigin(1, 0.5);
        this.playerSprite.setScale(
          ((CELL_SIZE * PLAYER_WIDTH) / 62) * 1.5,
          ((CELL_SIZE * PLAYER_HEIGHT) / 35) * 1.5,
        );

        //front feet hitbox 
        this.frontFeetHitbox = this.add.rectangle(0, 0, 4, 4, 0x00ff00, 0);
        this.physics.add.existing(this.frontFeetHitbox);
        this.frontFeetBody = this.frontFeetHitbox.body as Phaser.Physics.Arcade.Body;
        this.frontFeetBody.setAllowGravity(false);

        //build blocks
        levelData.tiles.forEach((tile) => {
          const px = tile.x * CELL_SIZE;
          const py = levelHeightPxs - tile.y * CELL_SIZE - tile.height * CELL_SIZE;
          const w = tile.width * CELL_SIZE;
          const h = tile.height * CELL_SIZE;

          if (tile.type === "platform") {
            const platform = this.add.tileSprite(px, py, w, h, "platform");
            platform.setOrigin(0, 0);
            this.physics.add.existing(platform, true);
            this.platforms.add(platform);
          } else if (tile.type === "wall") {
            const wall = this.add.tileSprite(px, py, w, h, "wall");
            wall.setOrigin(0, 0);
            this.physics.add.existing(wall, true);
            this.platforms.add(wall);
          } else if (tile.type === "spike") {
            const spike = this.add.tileSprite(px, py, w, h, "spike");
            spike.setOrigin(0, 0);
            this.physics.add.existing(spike, true);
            this.spikes.add(spike);
          }
        });

        //build enemies
        levelData.enemies.forEach((enemy) => {
          const px = enemy.x * CELL_SIZE;
          const py = levelHeightPxs - enemy.y * CELL_SIZE - enemy.height * CELL_SIZE;
          const w = enemy.width * CELL_SIZE;
          const h = enemy.height * CELL_SIZE;

          if (enemy.type === "flying") {
            const saw = this.add.sprite(px + w / 2, py + h / 2, "flying_enemy");
            saw.play("spin");
            this.physics.add.existing(saw);
            const sawBody = saw.body as Phaser.Physics.Arcade.Body;
            sawBody.setAllowGravity(false);
            sawBody.setVelocityX(100);
            this.enemies.add(saw);
            (saw as any).patrolOriginX = px + w / 2;
            (saw as any).patrolRange = 5 * CELL_SIZE;
            (saw as any).patrolDir = 1;
          } else {
            //basic enemy
            const e = this.add.image(px + w / 2, py + h , "basic_enemy");
            e.setDisplaySize(CELL_SIZE * 2, CELL_SIZE * 2);
            this.physics.add.existing(e, true);
            this.enemies.add(e);
          }
        });

        //build checkpoints
        levelData.checkpoints.forEach((cp) => {
          const px = cp.x * CELL_SIZE;
          const py = levelHeightPxs - cp.y * CELL_SIZE - CELL_SIZE * 2;
          const checkpoint = this.add.image(px + CELL_SIZE / 2, py + CELL_SIZE * 2, "checkpoint");
          checkpoint.setDisplaySize(CELL_SIZE, CELL_SIZE * 2);
          this.physics.add.existing(checkpoint, true);
          this.checkpoints.add(checkpoint);
        });

        //build goal
        if (levelData.goal) {
          const px = levelData.goal.x * CELL_SIZE;
          const py = levelHeightPxs - levelData.goal.y * CELL_SIZE - CELL_SIZE * 2;
          this.goalObject = this.add.image(px + CELL_SIZE, py + CELL_SIZE * 2, "goal") as any;
          this.goalObject.setDisplaySize(CELL_SIZE * 2, CELL_SIZE * 2);
          this.physics.add.existing(this.goalObject, true);

          this.physics.add.overlap(this.player, this.goalObject, () => {
            if (!this.gameWon) {
              this.gameWon = true;
              this.time.delayedCall(100, () => this.handleWin());
            }
          });
        }

        this.physics.add.collider(this.player, this.platforms);

        this.physics.add.overlap(this.player, this.spikes, () => {
          this.respawn();
        });

        this.physics.add.overlap(this.player, this.enemies, () => {
          this.respawn();
        });

        this.physics.add.overlap(this.player, this.checkpoints, (_, cp) => {
          const checkpoint = cp as Phaser.GameObjects.Image;
          this.lastCheckpoint = { x: checkpoint.x, y: checkpoint.y };
          checkpoint.setTint(0xffff00);
        });

        this.cameras.main.setBounds(0, 0, levelWidthPxs, levelHeightPxs);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBackgroundColor("#1a1a2e");

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = {
          up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
          down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
          left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
          right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        };
        this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.stretchKey = this.spaceKey;

        this.timerText = this.add
          .text(16, 16, "00:00.000", {
            fontSize: "20px",
            color: "#ffffff",
            backgroundColor: "#00000088",
            padding: { x: 8, y: 4 },
          })
          .setScrollFactor(0);
      }

      respawn() {
        this.playerBody.setVelocity(0, 0);
        this.playerBody.setAcceleration(0, 0);
        this.player.setPosition(this.lastCheckpoint.x, this.lastCheckpoint.y);
        this.playerSprite.setAlpha(0.5);
        this.time.delayedCall(500, () => {
          this.playerSprite.setAlpha(1);
        });
      }

      handleWin() {
        this.playerBody.setVelocity(0, 0);
        this.playerBody.setAcceleration(0, 0);
        this.playerBody.allowGravity = false;

        //calculate time
        const elapsed = Date.now() - startTimeRef.current;
        const finalTime = this.formatTime(elapsed);

        const bestKey = `best_time_${levelData.spawnPoint?.x}_${levelData.spawnPoint?.y}`;
        const prevBest = localStorage.getItem(bestKey);
        const isNewBest = !prevBest || elapsed < parseInt(prevBest);
        if (isNewBest) localStorage.setItem(bestKey, String(elapsed));
        const bestTime = isNewBest ? finalTime : this.formatTime(parseInt(prevBest!));

        const camW = this.cameras.main.width;
        const camH = this.cameras.main.height;

        this.add
          .rectangle(camW / 2, camH / 2, camW, camH, 0x000000, 0.7)
          .setScrollFactor(0);

        this.add
          .text(camW / 2, camH / 2 - 80, "Level Complete!", {
            fontSize: "36px",
            color: "#ffd700",
            fontStyle: "bold",
          })
          .setOrigin(0.5)
          .setScrollFactor(0);

        this.add
          .text(camW / 2, camH / 2 - 20, `Time: ${finalTime}`, {
            fontSize: "24px",
            color: "#ffffff",
          })
          .setOrigin(0.5)
          .setScrollFactor(0);

        this.add
          .text(camW / 2, camH / 2 + 20, `Best: ${bestTime}`, {
            fontSize: "20px",
            color: isNewBest ? "#00ff88" : "#aaaaaa",
          })
          .setOrigin(0.5)
          .setScrollFactor(0);

        const playAgainBtn = this.add
          .text(camW / 2 - 80, camH / 2 + 80, "Play Again", {
            fontSize: "20px",
            color: "#000000",
            backgroundColor: "#00aa44",
            padding: { x: 16, y: 8 },
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setInteractive({ useHandCursor: true });

        playAgainBtn.on("pointerdown", () => {
          this.gameWon = false;
          this.playerBody.allowGravity = true;
          startTimeRef.current = Date.now();
          this.scene.restart();
        });

        const editorBtn = this.add
          .text(camW / 2 + 80, camH / 2 + 80, "Back to Editor", {
            fontSize: "20px",
            color: "#000000",
            backgroundColor: "#0066cc",
            padding: { x: 16, y: 8 },
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setInteractive({ useHandCursor: true });

        editorBtn.on("pointerdown", () => {
          onExit();
        });
      }

      formatTime(ms: number): string {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = ms % 1000;
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
      }

      update(_time: number, delta: number) {
        //position front feet at head of stretch length 
        const stretchHead = this.stretchActive
          ? this.facingRight
            ? this.playerBody.x + CELL_SIZE * PLAYER_WIDTH + this.stretchCurrentLength
            : this.playerBody.x - this.stretchCurrentLength
          : -9999;

        this.frontFeetHitbox.setPosition(stretchHead, this.playerBody.y + this.playerBody.height);
        this.frontFeetBody.reset(stretchHead, this.playerBody.y + this.playerBody.height);

        //saw patrol movement
        this.enemies.getChildren().forEach((child) => {
          const saw = child as any;
          if (!saw.patrolOriginX) return;
          const body = saw.body as Phaser.Physics.Arcade.Body;
          const dist = saw.x - saw.patrolOriginX;
          if (dist >= saw.patrolRange) saw.patrolDir = -1;
          else if (dist <= -saw.patrolRange) saw.patrolDir = 1;
          body.setVelocityX(100 * saw.patrolDir);
        });

        //sprite and hitbox
        const baseScaleX = ((CELL_SIZE * PLAYER_WIDTH) / 62) * 1.5;
        const baseScaleY = ((CELL_SIZE * PLAYER_HEIGHT) / 35) * 1.5;
        const spriteX = this.facingRight
          ? this.playerBody.x
          : this.playerBody.x + CELL_SIZE * PLAYER_WIDTH;

        this.playerSprite.setPosition(
          spriteX,
          this.playerBody.y + (CELL_SIZE * PLAYER_HEIGHT) / 2 - this.playerBody.offset.y,
        );
        this.playerSprite.setScale(
          this.facingRight ? -baseScaleX : baseScaleX,
          baseScaleY,
        );

        //stretch animation 
        if (this.stretchActive) {
          const frame = Math.min(7, Math.floor((this.stretchCurrentLength / MAX_STRETCH) * 7));
          (this.playerSprite as any).setFrame(frame);
        } else {
          (this.playerSprite as any).setFrame(0);
        }

        //set timer
        if (!this.gameWon) {
          this.timerText.setText(this.formatTime(Date.now() - startTimeRef.current));
        }

        //catch fall death
        if (this.player.y > levelHeightPxs + 100) {
          this.respawn();
          return;
        }

        const onGround = this.playerBody.blocked.down;
        const dt = delta / 1000;

        //prevent stretch from front feet are already on platform
        const frontFeetOnGround = levelData.tiles.some((tile) => {
          if (tile.type === "spike") return false;
          const tileLeft = tile.x * CELL_SIZE;
          const tileRight = (tile.x + tile.width) * CELL_SIZE;
          const tileTop = levelHeightPxs - (tile.y + tile.height) * CELL_SIZE;
          const feetX = this.frontFeetHitbox.x;
          const feetY = this.frontFeetHitbox.y;
          return feetX >= tileLeft && feetX <= tileRight && feetY >= tileTop - 4 && feetY <= tileTop + 4;
        });

        //stretch 
        if (this.stretchKey.isDown && !this.stretchGrabbed && !frontFeetOnGround) {
          if (!this.stretchActive) {
            this.stretchActive = true;
            this.stretchCurrentLength = 0;
          }

          this.stretchCurrentLength = Math.min(
            this.stretchCurrentLength + STRETCH_SPEED * dt,
            MAX_STRETCH,
          );

          const stretchHeadX = this.facingRight
            ? this.player.x + (CELL_SIZE * PLAYER_WIDTH) / 2 + this.stretchCurrentLength
            : this.player.x - (CELL_SIZE * PLAYER_WIDTH) / 2 - this.stretchCurrentLength;

          //wall grab
          const hitTile = levelData.tiles.find((tile) => {
            if (tile.type === "spike") return false;
            const tileLeft = tile.x * CELL_SIZE;
            const tileRight = (tile.x + tile.width) * CELL_SIZE;
            const tileTop = levelHeightPxs - (tile.y + tile.height) * CELL_SIZE;
            const tileBottom = levelHeightPxs - tile.y * CELL_SIZE;
            return (
              stretchHeadX >= tileLeft &&
              stretchHeadX <= tileRight &&
              this.player.y >= tileTop &&
              this.player.y <= tileBottom
            );
          });

          //top grab 
          let groundUnderPaw = false;
          let pawSnapX = 0;

          levelData.tiles.forEach((tile) => {
            if (tile.type === "spike") return;
            const tileLeft = tile.x * CELL_SIZE;
            const tileRight = (tile.x + tile.width) * CELL_SIZE;
            const tileTop = levelHeightPxs - (tile.y + tile.height) * CELL_SIZE;
            const feetX = this.frontFeetHitbox.x;
            const feetY = this.frontFeetHitbox.y;

            if (
              feetX >= tileLeft &&
              feetX <= tileRight &&
              feetY >= tileTop - 8 &&
              feetY <= tileTop + 8 &&
              this.stretchCurrentLength > CELL_SIZE
            ) {
              groundUnderPaw = true;
              pawSnapX = this.facingRight
                ? stretchHead - (CELL_SIZE * PLAYER_WIDTH) / 2
                : stretchHead + (CELL_SIZE * PLAYER_WIDTH) / 2;
            }
          });

          if (hitTile || groundUnderPaw) {
            this.stretchGrabbed = true;

            let snapX: number;
            if (hitTile) {
              snapX = this.facingRight
                ? hitTile.x * CELL_SIZE - (CELL_SIZE * PLAYER_WIDTH) / 2
                : (hitTile.x + hitTile.width) * CELL_SIZE + (CELL_SIZE * PLAYER_WIDTH) / 2;
            } else {
              snapX = pawSnapX;
            }

            const snapY = this.player.y;
            let validSnapX = snapX;
            let validSnapY = snapY;

            //push player out of any tile if clip
            levelData.tiles.forEach((t) => {
              if (t.type === "spike") return;
              const tLeft = t.x * CELL_SIZE;
              const tRight = (t.x + t.width) * CELL_SIZE;
              const tTop = levelHeightPxs - (t.y + t.height) * CELL_SIZE;
              const tBottom = levelHeightPxs - t.y * CELL_SIZE;
              const pLeft = validSnapX - (CELL_SIZE * PLAYER_WIDTH) / 2;
              const pRight = validSnapX + (CELL_SIZE * PLAYER_WIDTH) / 2;
              const pTop = validSnapY - (CELL_SIZE * PLAYER_HEIGHT) / 2;
              const pBottom = validSnapY + (CELL_SIZE * PLAYER_HEIGHT) / 2;

              if (pRight > tLeft && pLeft < tRight && pBottom > tTop && pTop < tBottom) {
                validSnapX = this.facingRight
                  ? tLeft - (CELL_SIZE * PLAYER_WIDTH) / 2
                  : tRight + (CELL_SIZE * PLAYER_WIDTH) / 2;
                validSnapY = Math.min(validSnapY, tTop - (CELL_SIZE * PLAYER_HEIGHT) / 2);
              }
            });

            this.playerBody.setVelocity(0, 0);
            this.playerBody.setAcceleration(0, 0);
            this.player.setPosition(validSnapX, validSnapY);
            this.playerBody.reset(validSnapX, validSnapY);
            this.stretchActive = false;
            this.stretchCurrentLength = 0;
          }
        } else if (!this.stretchKey.isDown) {
          if (this.stretchGrabbed) this.stretchGrabbed = false;

          //on release, closest tile to snap to
          if (this.stretchActive) {
            const playerX = this.player.x;
            const playerY = this.player.y;
            let closestTile = null;
            let closestDist = Infinity;

            levelData.tiles.forEach((tile) => {
              if (tile.type === "spike") return;
              const tileLeft = tile.x * CELL_SIZE;
              const tileRight = (tile.x + tile.width) * CELL_SIZE;
              const tileTop = levelHeightPxs - (tile.y + tile.height) * CELL_SIZE;
              const tileBottom = levelHeightPxs - tile.y * CELL_SIZE;
              const playerBottom = playerY + (CELL_SIZE * PLAYER_HEIGHT) / 2;
              const playerTop = playerY - (CELL_SIZE * PLAYER_HEIGHT) / 2;
              const stretchStart = this.facingRight
                ? playerX + (CELL_SIZE * PLAYER_WIDTH) / 2
                : playerX - (CELL_SIZE * PLAYER_WIDTH) / 2;
              const stretchEnd = this.facingRight
                ? playerX + (CELL_SIZE * PLAYER_WIDTH) / 2 + this.stretchCurrentLength
                : playerX - (CELL_SIZE * PLAYER_WIDTH) / 2 - this.stretchCurrentLength;

              const pathCrossesTile = this.facingRight
                ? stretchStart <= tileRight && stretchEnd >= tileLeft
                : stretchStart >= tileLeft && stretchEnd <= tileRight;

              if (!pathCrossesTile) return;

              if (playerBottom >= tileTop - 8 && playerTop <= tileTop + 8) {
                const dist = Math.abs(stretchStart - tileLeft);
                if (dist < closestDist) { closestDist = dist; closestTile = tile; }
              }

              if (playerBottom >= tileTop && playerTop <= tileBottom) {
                const dist = Math.abs(stretchStart - (this.facingRight ? tileLeft : tileRight));
                if (dist < closestDist) { closestDist = dist; closestTile = tile; }
              }
            });

            if (closestTile) {
              const tile = closestTile as any;
              const tileLeft = tile.x * CELL_SIZE;
              const tileRight = (tile.x + tile.width) * CELL_SIZE;
              const tileTop = levelHeightPxs - (tile.y + tile.height) * CELL_SIZE;
              const snapX = this.facingRight
                ? tileLeft - (CELL_SIZE * PLAYER_WIDTH) / 2
                : tileRight + (CELL_SIZE * PLAYER_WIDTH) / 2;
              const snapY = Math.min(this.player.y, tileTop - (CELL_SIZE * PLAYER_HEIGHT) / 2);

              let validSnapX = snapX;
              let validSnapY = snapY;

              levelData.tiles.forEach((t) => {
                if (t.type === "spike") return;
                const tLeft = t.x * CELL_SIZE;
                const tRight = (t.x + t.width) * CELL_SIZE;
                const tTop = levelHeightPxs - (t.y + t.height) * CELL_SIZE;
                const tBottom = levelHeightPxs - t.y * CELL_SIZE;
                const pLeft = validSnapX - (CELL_SIZE * PLAYER_WIDTH) / 2;
                const pRight = validSnapX + (CELL_SIZE * PLAYER_WIDTH) / 2;
                const pTop = validSnapY - (CELL_SIZE * PLAYER_HEIGHT) / 2;
                const pBottom = validSnapY + (CELL_SIZE * PLAYER_HEIGHT) / 2;

                if (pRight > tLeft && pLeft < tRight && pBottom > tTop && pTop < tBottom) {
                  validSnapX = this.facingRight
                    ? tLeft - (CELL_SIZE * PLAYER_WIDTH) / 2
                    : tRight + (CELL_SIZE * PLAYER_WIDTH) / 2;
                  validSnapY = Math.min(validSnapY, tTop - (CELL_SIZE * PLAYER_HEIGHT) / 2);
                }
              });

              this.playerBody.setVelocity(0, 0);
              this.playerBody.setAcceleration(0, 0);
              this.player.setPosition(validSnapX, validSnapY);
              this.playerBody.reset(validSnapX, validSnapY);
            }
          }

          this.stretchActive = false;
          this.stretchCurrentLength = 0;
        }

        const jumpPressed = this.cursors.up.isDown || this.wasd.up.isDown || this.spaceKey.isDown;

        //player movement 
        if (!this.stretchGrabbed) {
          if (onGround) {
            if (this.cursors.left.isDown || this.wasd.left.isDown) {
              this.playerBody.setAccelerationX(-MOVE_ACCELERATION);
              this.facingRight = false;
            } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
              this.playerBody.setAccelerationX(MOVE_ACCELERATION);
              this.facingRight = true;
            } else {
              this.playerBody.setAccelerationX(0);
              this.playerBody.setVelocityX(this.playerBody.velocity.x * FRICTION);
            }
          } else {
            // direction change only, no acceleration in air
            if (this.cursors.left.isDown || this.wasd.left.isDown) this.facingRight = false;
            else if (this.cursors.right.isDown || this.wasd.right.isDown) this.facingRight = true;
            this.playerBody.setAccelerationX(0);
          }

          if (jumpPressed && onGround) {
            this.playerBody.setVelocityY(JUMP_FORCE);
          }
        }
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      parent: containerRef.current,
      backgroundColor: "#1a1a2e",
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scene: GameScene,
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      <button
        onClick={onExit}
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          padding: "0.4rem 1rem",
          background: "#aa4400",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          zIndex: 10,
        }}
      >
        Back to Editor
      </button>
    </div>
  );
}

export default GamePlayer;