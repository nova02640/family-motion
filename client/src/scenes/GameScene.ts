import Phaser from 'phaser';
import { gameClient } from '../net/GameClient.js';
import { localState } from '../state/LocalState.js';
import { TILE_PX, GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import {
  ServerMsg,
  TileType,
  type MapInitMessage,
  type PlayerState as PlayerStateT,
  type MonsterState as MonsterStateT,
  type ItemDropState as ItemDropStateT,
  type NpcState as NpcStateT,
} from '@mir/shared';
import { DamageText } from '../ui/DamageText.js';

interface EntityView {
  id: string;
  kind: 'player' | 'monster' | 'npc' | 'drop';
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Arc;
  nameText: Phaser.GameObjects.Text;
  hpBar?: Phaser.GameObjects.Rectangle;
  hpBarBg?: Phaser.GameObjects.Rectangle;
  /** 服务端最新坐标（用于插值） */
  targetX: number;
  targetY: number;
  /** 当前是否本地玩家 */
  isLocal?: boolean;
}

export class GameScene extends Phaser.Scene {
  private mapData: MapInitMessage | null = null;
  private tileGraphics!: Phaser.GameObjects.Graphics;
  private entities = new Map<string, EntityView>();
  private localPlayer?: EntityView;
  private damageTexts: DamageText;
  private connectingText!: Phaser.GameObjects.Text;
  private disconnectText?: Phaser.GameObjects.Text;
  private dropLabels = new Map<string, Phaser.GameObjects.Text>();

  constructor() {
    super('game');
    this.damageTexts = new DamageText();
  }

  async create() {
    this.cameras.main.setBackgroundColor('#0d1117');
    this.tileGraphics = this.add.graphics();

    this.connectingText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '连接服务器中...', {
      fontFamily: 'monospace', fontSize: '20px', color: '#fbbf24',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

    // 启动 HUD 场景
    if (!this.scene.isActive('hud')) this.scene.launch('hud');

    // 注册回调
    gameClient.setCallbacks({
      onMapInit: (msg) => this.onMapInit(msg),
      onStateChange: () => this.syncEntities(),
      onDamage: (m) => this.onDamage(m),
      onExpGain: (m) => this.events.emit('exp-gain', m),
      onLevelUp: (m) => this.events.emit('level-up', m),
      onItemDrop: (m) => this.events.emit('item-drop', m),
      onPickupResult: (m) => this.events.emit('pickup-result', m),
      onInventorySnapshot: (m) => this.events.emit('inv-snapshot', m),
      onChat: (m) => this.events.emit('chat', m),
      onSystem: (m) => this.events.emit('system-msg', m),
      onNotification: (m) => this.events.emit('notify', m),
      onDeath: (m) => this.events.emit('death', m),
      onRespawnResult: (m) => this.events.emit('respawn-result', m),
      onError: (m) => this.events.emit('error-msg', m),
      onDisconnect: () => this.onDisconnect(),
    });

    // 输入：点击移动/攻击/拾取
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.handlePointer(pointer));

    // ESC：返回角色选择
    this.input.keyboard?.on('keydown-ESC', () => {
      gameClient.leave();
      this.scene.stop('hud');
      this.scene.start('character-select');
    });

    // R：复活（死亡后）
    this.input.keyboard?.on('keydown-R', () => {
      if (this.localPlayer && this.localPlayer.container.getData('dead')) {
        gameClient.sendRespawn();
      }
    });

    // 空格：自动拾取附近物品
    this.input.keyboard?.on('keydown-SPACE', () => gameClient.sendPickup());

    this.events.once('shutdown', () => {
      gameClient.leave();
    });

    // 连接
    try {
      const charId = localState.currentCharacterId;
      if (!charId) {
        this.scene.start('character-select');
        return;
      }
      await gameClient.join(charId);
      this.connectingText.setVisible(false);
    } catch (err) {
      this.connectingText.setText(`连接失败: ${(err as Error).message}\n按 ESC 返回`);
    }
  }

  private onMapInit(msg: MapInitMessage) {
    this.mapData = msg;
    this.renderTiles();
  }

  private renderTiles() {
    if (!this.mapData) return;
    const { width, height, tiles } = this.mapData;
    this.tileGraphics.clear();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const t = tiles[y * width + x] as TileType;
        let color = 0x1a202c;
        if (t === TileType.Floor) color = 0x2d3748;
        else if (t === TileType.Wall) color = 0x4a5568;
        else if (t === TileType.Water) color = 0x2b6cb0;
        else if (t === TileType.Tree) color = 0x276749;
        else if (t === TileType.Door) color = 0x975a16;
        this.tileGraphics.fillStyle(color, 1);
        this.tileGraphics.fillRect(x * TILE_PX, y * TILE_PX, TILE_PX, TILE_PX);
        // 网格线
        this.tileGraphics.lineStyle(1, 0x111827, 0.4);
        this.tileGraphics.strokeRect(x * TILE_PX + 0.5, y * TILE_PX + 0.5, TILE_PX - 1, TILE_PX - 1);
      }
    }
    this.tileGraphics.setDepth(-10);
  }

  private syncEntities() {
    const room = gameClient.room;
    if (!room || !this.mapData) return;
    const state = room.state as unknown as {
      players: Map<string, PlayerStateT>;
      monsters: Map<string, MonsterStateT>;
      drops: Map<string, ItemDropStateT>;
      npcs: Map<string, NpcStateT>;
    };

    const seen = new Set<string>();

    // 玩家
    state.players.forEach((p, key) => {
      const id = `p_${key}`;
      seen.add(id);
      const isLocal = key === localState.localSessionId;
      this.upsertEntity(id, 'player', p.position.x, p.position.y, {
        name: p.name,
        color: this.classColor(p.classId),
        isLocal,
        hpRatio: p.hp / Math.max(1, p.maxHp),
        showHp: p.hp < p.maxHp || isLocal,
        level: p.level,
        stateFlag: p.state,
      });
      if (isLocal) {
        this.localPlayer = this.entities.get(id);
        if (this.localPlayer) {
          this.localPlayer.container.setData('dead', p.state === 'dead');
        }
        this.cameras.main.startFollow(this.localPlayer!.container, true, 0.15, 0.15);
      }
    });

    // 怪物
    state.monsters.forEach((m, key) => {
      const id = `m_${key}`;
      seen.add(id);
      const dead = m.deadAt > 0;
      this.upsertEntity(id, 'monster', m.position.x, m.position.y, {
        name: `${m.name} Lv.${m.level}`,
        color: this.monsterColor(m.templateId),
        isLocal: false,
        hpRatio: m.hp / Math.max(1, m.maxHp),
        showHp: !dead && (m.hp < m.maxHp || true),
        level: m.level,
        stateFlag: m.state,
        hidden: dead,
      });
    });

    // NPC
    state.npcs.forEach((n, key) => {
      const id = `n_${key}`;
      seen.add(id);
      this.upsertEntity(id, 'npc', n.position.x, n.position.y, {
        name: n.name,
        color: 0xfbbf24,
        isLocal: false,
        hpRatio: 1,
        showHp: false,
        level: 0,
        stateFlag: '',
      });
    });

    // 掉落物
    state.drops.forEach((d, key) => {
      const id = `d_${key}`;
      seen.add(id);
      this.upsertEntity(id, 'drop', d.position.x, d.position.y, {
        name: d.itemId === 'gold' ? `${d.count} 金` : d.itemId,
        color: d.itemId === 'gold' ? 0xfde047 : 0xf59e0b,
        isLocal: false,
        hpRatio: 0,
        showHp: false,
        level: 0,
        stateFlag: '',
        small: true,
      });
    });

    // 移除已不存在的
    for (const [id, view] of this.entities) {
      if (!seen.has(id)) {
        view.container.destroy();
        this.entities.delete(id);
      }
    }
  }

  private upsertEntity(
    id: string,
    kind: EntityView['kind'],
    x: number, y: number,
    opts: {
      name: string;
      color: number;
      isLocal: boolean;
      hpRatio: number;
      showHp: boolean;
      level: number;
      stateFlag: string;
      hidden?: boolean;
      small?: boolean;
    },
  ) {
    const px = x * TILE_PX;
    const py = y * TILE_PX;
    const existing = this.entities.get(id);
    let view: EntityView;
    if (existing) {
      view = existing;
    } else {
      const container = this.add.container(px, py);
      const radius = opts.small ? 6 : 12;
      const sprite = this.add.circle(0, 0, radius, opts.color).setStrokeStyle(2, opts.isLocal ? 0xfbbf24 : 0x000000);
      container.add(sprite);
      if (opts.small) sprite.setScale(0.8);

      let nameText: Phaser.GameObjects.Text;
      if (kind === 'drop') {
        nameText = this.add.text(0, -10, opts.name, {
          fontFamily: 'monospace', fontSize: '10px', color: '#fde047',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5);
      } else {
        nameText = this.add.text(0, kind === 'player' ? -22 : -18, opts.name, {
          fontFamily: 'monospace', fontSize: kind === 'player' ? '12px' : '10px',
          color: opts.isLocal ? '#fbbf24' : '#e5e7eb',
          stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5);
      }
      container.add(nameText);

      let hpBar: Phaser.GameObjects.Rectangle | undefined;
      let hpBarBg: Phaser.GameObjects.Rectangle | undefined;
      if (kind !== 'drop' && kind !== 'npc') {
        hpBarBg = this.add.rectangle(0, kind === 'player' ? -32 : -28, 28, 4, 0x000000, 0.7).setOrigin(0.5);
        hpBar = this.add.rectangle(0, kind === 'player' ? -32 : -28, 28, 4, 0xef4444).setOrigin(0.5);
        container.add([hpBarBg, hpBar]);
      }

      container.setDepth(kind === 'player' ? 10 : kind === 'monster' ? 5 : 1);
      view = {
        id, kind, container, sprite, nameText, hpBar, hpBarBg,
        targetX: px, targetY: py, isLocal: opts.isLocal,
      };
      this.entities.set(id, view);
    }
    view.targetX = px;
    view.targetY = py;
    view.nameText.setText(opts.name);

    if (view.hpBar && view.hpBarBg) {
      const w = 28 * Math.max(0, Math.min(1, opts.hpRatio));
      view.hpBar.setSize(w, 4);
      view.hpBar.setX(-(28 - w) / 2);
      view.hpBar.setVisible(opts.showHp);
      view.hpBarBg.setVisible(opts.showHp);
    }
    view.container.setVisible(!opts.hidden);
    if (opts.stateFlag === 'dead' && view.sprite) {
      view.sprite.setAlpha(0.4);
    } else if (view.sprite) {
      view.sprite.setAlpha(1);
    }
  }

  private onDamage(msg: { targetId: string; sourceId: string; amount: number; crit: boolean; type: string; targetHp: number }) {
    const view = this.findEntityByStateId(msg.targetId);
    if (!view) return;
    const color = msg.amount === 0 ? '#9ca3af' : msg.crit ? '#fbbf24' : msg.type === 'magic' ? '#a78bfa' : '#f87171';
    const text = msg.amount === 0 ? 'MISS' : `${msg.amount}${msg.crit ? '!' : ''}`;
    this.damageTexts.spawn(this, view.container.x, view.container.y - 30, text, color);
  }

  private findEntityByStateId(stateId: string): EntityView | undefined {
    // stateId 形如 player sessionId / monster id / npc id / drop id
    // 我们的 entity key 用了 p_ m_ n_ d_ 前缀；先按玩家 sessionId 找
    for (const [k, v] of this.entities) {
      if (k === `p_${stateId}`) return v;
      if (k === `m_${stateId}`) return v;
      if (k === `n_${stateId}`) return v;
      if (k === `d_${stateId}`) return v;
    }
    return undefined;
  }

  private handlePointer(pointer: Phaser.Input.Pointer) {
    if (!this.mapData || !this.localPlayer) return;
    if (this.localPlayer.container.getData('dead')) return;

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(worldPoint.x / TILE_PX);
    const ty = Math.floor(worldPoint.y / TILE_PX);

    // 优先检测是否点中怪物/NPC
    for (const [k, v] of this.entities) {
      if (v.container.getData('dead')) continue;
      if (v.kind !== 'monster' && v.kind !== 'npc') continue;
      const dist = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, v.container.x, v.container.y);
      if (dist < 20) {
        if (v.kind === 'monster') {
          const stateId = k.slice(2); // m_xxx → xxx
          gameClient.sendAttack(stateId);
          return;
        }
        if (v.kind === 'npc') {
          const stateId = k.slice(2);
          gameClient.sendInteractNpc(stateId);
          return;
        }
      }
    }
    // 检测是否点中掉落物
    for (const [k, v] of this.entities) {
      if (v.kind !== 'drop') continue;
      const dist = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, v.container.x, v.container.y);
      if (dist < 18) {
        const stateId = k.slice(2);
        gameClient.sendPickup(stateId);
        return;
      }
    }
    // 否则点击移动
    gameClient.sendMove(tx, ty);
  }

  private classColor(classId: string): number {
    if (classId === 'warrior') return 0x60a5fa;
    if (classId === 'mage') return 0xf472b6;
    if (classId === 'taoist') return 0xfacc15;
    return 0xe5e7eb;
  }

  private monsterColor(templateId: string): number {
    if (templateId === 'slime') return 0x84cc16;
    if (templateId === 'wolf') return 0xa16207;
    if (templateId === 'skeleton') return 0xe5e7eb;
    return 0xef4444;
  }

  update(_time: number, deltaMs: number) {
    const lerpFactor = Math.min(1, deltaMs / 80);
    for (const view of this.entities.values()) {
      view.container.x += (view.targetX - view.container.x) * lerpFactor;
      view.container.y += (view.targetY - view.container.y) * lerpFactor;
    }
    this.damageTexts.update(deltaMs);
  }

  private onDisconnect() {
    if (this.disconnectText) return;
    this.disconnectText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '与服务器断开连接\n按 ESC 返回角色选择', {
      fontFamily: 'monospace', fontSize: '18px', color: '#f87171', align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2000);
  }
}
