import Phaser from 'phaser';
import { gameClient } from '../net/GameClient.js';
import { localState } from '../state/LocalState.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { InventoryPanel } from './InventoryPanel.js';
import { ChatPanel } from './ChatPanel.js';

const CLASS_LABEL: Record<string, string> = {
  warrior: '战士', mage: '法师', taoist: '道士',
};

interface NotifyItem { text: Phaser.GameObjects.Text; life: number }

export class HudScene extends Phaser.Scene {
  private hpBar!: Phaser.GameObjects.Rectangle;
  private mpBar!: Phaser.GameObjects.Rectangle;
  private expBar!: Phaser.GameObjects.Rectangle;
  private infoText!: Phaser.GameObjects.Text;
  private notifications: NotifyItem[] = [];
  private notifY = 80;
  private inventoryPanel!: InventoryPanel;
  private chatPanel!: ChatPanel;
  private deathOverlay?: Phaser.GameObjects.Container;
  private toast?: Phaser.GameObjects.Text;

  constructor() {
    super('hud');
  }

  create() {
    // 顶部信息
    this.infoText = this.add.text(16, 12, '', {
      fontFamily: 'monospace', fontSize: '13px', color: '#e5e7eb',
    }).setScrollFactor(0).setDepth(100);

    // HP 条
    this.add.text(16, 36, 'HP', { fontFamily: 'monospace', fontSize: '11px', color: '#f87171' })
      .setScrollFactor(0).setDepth(100);
    this.add.rectangle(40, 40, 200, 12, 0x1f2937, 0.95).setStrokeStyle(1, 0x374151)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);
    this.hpBar = this.add.rectangle(40, 40, 200, 12, 0xef4444).setOrigin(0, 0.5)
      .setScrollFactor(0).setDepth(101);

    // MP 条
    this.add.text(16, 58, 'MP', { fontFamily: 'monospace', fontSize: '11px', color: '#60a5fa' })
      .setScrollFactor(0).setDepth(100);
    this.add.rectangle(40, 62, 200, 12, 0x1f2937, 0.95).setStrokeStyle(1, 0x374151)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);
    this.mpBar = this.add.rectangle(40, 62, 200, 12, 0x3b82f6).setOrigin(0, 0.5)
      .setScrollFactor(0).setDepth(101);

    // EXP 条
    this.add.text(16, 80, 'EXP', { fontFamily: 'monospace', fontSize: '10px', color: '#facc15' })
      .setScrollFactor(0).setDepth(100);
    this.add.rectangle(40, 84, 200, 6, 0x1f2937, 0.95).setStrokeStyle(1, 0x374151)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);
    this.expBar = this.add.rectangle(40, 84, 200, 6, 0xfacc15).setOrigin(0, 0.5)
      .setScrollFactor(0).setDepth(101);

    // 顶部右：地图名 + 坐标
    this.add.text(GAME_WIDTH - 16, 12, 'ESC: 退出  B: 背包  Enter: 聊天  空格: 拾取', {
      fontFamily: 'monospace', fontSize: '11px', color: '#9ca3af',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

    // 底部按钮
    this.makeBtn(GAME_WIDTH / 2 - 200, GAME_HEIGHT - 28, '背包(B)', 0x4b5563, () => this.inventoryPanel.toggle());
    this.makeBtn(GAME_WIDTH / 2 - 80, GAME_HEIGHT - 28, '聊天(Enter)', 0x4b5563, () => this.chatPanel.toggle());
    this.makeBtn(GAME_WIDTH / 2 + 40, GAME_HEIGHT - 28, '拾取(空格)', 0x4b5563, () => gameClient.sendPickup());

    // 死亡 overlay 隐藏，等待 onDeath 事件

    // 面板
    this.inventoryPanel = new InventoryPanel(this);
    this.chatPanel = new ChatPanel(this);

    // 事件订阅
    const gameScene = this.scene.get('game');
    gameScene.events.on('inv-snapshot', () => this.inventoryPanel.refresh());
    gameScene.events.on('exp-gain', (m: { amount: number; currentExp: number; expToNext: number }) => {
      this.showNotification(`+${m.amount} 经验`, '#facc15');
    });
    gameScene.events.on('level-up', (m: { newLevel: number }) => {
      this.showNotification(`升级！当前 Lv.${m.newLevel}`, '#fbbf24');
    });
    gameScene.events.on('pickup-result', (m: { ok: boolean; itemId: string; count: number; reason?: string }) => {
      if (!m.ok) this.showNotification(m.reason ?? '拾取失败', '#f87171');
      else this.showNotification(`拾取 ${m.itemId} x${m.count}`, '#fde047');
    });
    gameScene.events.on('system-msg', (m: { text: string; level: string }) => {
      const color = m.level === 'error' ? '#f87171' : m.level === 'warn' ? '#fbbf24' : '#9ca3af';
      this.showNotification(m.text, color);
    });
    gameScene.events.on('notify', (m: { text: string; level: string }) => {
      const color = m.level === 'error' ? '#f87171' : m.level === 'warn' ? '#fbbf24' : '#9ca3af';
      this.showNotification(m.text, color);
    });
    gameScene.events.on('chat', (m: { fromName: string; text: string }) => {
      this.chatPanel.addMessage(m.fromName, m.text);
    });
    gameScene.events.on('death', () => this.showDeathOverlay());
    gameScene.events.on('respawn-result', () => this.hideDeathOverlay());
    gameScene.events.on('error-msg', (m: { code: string; message: string }) => {
      this.showNotification(m.message, '#f87171');
    });

    // 按键
    this.input.keyboard?.on('keydown-B', () => this.inventoryPanel.toggle());
    this.input.keyboard?.on('keydown-ENTER', () => this.chatPanel.toggle());
    this.input.keyboard?.on('keydown-I', () => this.inventoryPanel.toggle());

    this.events.once('shutdown', () => {
      this.inventoryPanel?.destroy();
      this.chatPanel?.destroy();
    });
  }

  update(_time: number, deltaMs: number) {
    this.updateNotifications(deltaMs);
    const room = gameClient.room;
    if (!room) return;
    const state = room.state as unknown as {
      players: Map<string, { name: string; classId: string; level: number; exp: number; expToNext: number; hp: number; maxHp: number; mp: number; maxMp: number; position: { x: number; y: number } }>;
      mapId: string; mapName: string;
    };
    const me = state.players.get(localState.localSessionId ?? '');
    if (me) {
      const hpRatio = Math.max(0, me.hp / Math.max(1, me.maxHp));
      const mpRatio = Math.max(0, me.mp / Math.max(1, me.maxMp));
      const expRatio = Math.max(0, me.exp / Math.max(1, me.expToNext));
      this.hpBar.setSize(200 * hpRatio, 12);
      this.mpBar.setSize(200 * mpRatio, 12);
      this.expBar.setSize(200 * expRatio, 6);
      this.infoText.setText(
        `${me.name}  ${CLASS_LABEL[me.classId] ?? me.classId}  Lv.${me.level}    HP ${Math.floor(me.hp)}/${me.maxHp}   MP ${Math.floor(me.mp)}/${me.maxMp}`,
      );
    }
  }

  private makeBtn(x: number, y: number, label: string, color: number, onClick: () => void) {
    const text = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '12px', color: '#fff', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setInteractive({ useHandCursor: true });
    const bg = this.add.rectangle(x, y, 110, 28, color, 0.95).setStrokeStyle(1, 0x111827)
      .setOrigin(0.5).setScrollFactor(0).setDepth(99);
    text.on('pointerdown', onClick);
    text.on('pointerover', () => bg.setFillStyle(color, 0.85));
    text.on('pointerout', () => bg.setFillStyle(color, 0.95));
  }

  showNotification(text: string, color = '#e5e7eb') {
    const t = this.add.text(16, this.notifY, text, {
      fontFamily: 'monospace', fontSize: '13px', color,
      backgroundColor: '#111827', padding: { x: 8, y: 4 },
    }).setScrollFactor(0).setDepth(150).setAlpha(1);
    this.notifications.push({ text: t, life: 3500 });
    this.notifY += t.height + 4;
  }

  private showDeathOverlay() {
    if (this.deathOverlay) return;
    const overlay = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    overlay.setDepth(500).setScrollFactor(0);
    const bg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);
    overlay.add(bg);
    const text = this.add.text(0, -40, '你已倒下', {
      fontFamily: 'monospace', fontSize: '32px', color: '#f87171', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);
    overlay.add(text);
    const hint = this.add.text(0, 10, '按 R 复活（在新手村出生点）', {
      fontFamily: 'monospace', fontSize: '14px', color: '#9ca3af',
    }).setOrigin(0.5);
    overlay.add(hint);
    const btn = this.add.text(0, 50, '复 活', {
      fontFamily: 'monospace', fontSize: '16px', color: '#fff', backgroundColor: '#dc2626', padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => gameClient.sendRespawn());
    overlay.add(btn);
    this.deathOverlay = overlay;
  }

  private hideDeathOverlay() {
    if (this.deathOverlay) {
      this.deathOverlay.destroy();
      this.deathOverlay = undefined;
    }
  }

  // 每帧更新通知淡出与重新排列
  updateNotifications(deltaMs: number) {
    let removed = false;
    for (let i = this.notifications.length - 1; i >= 0; i--) {
      const n = this.notifications[i];
      n.life -= deltaMs;
      const alpha = Math.max(0, Math.min(1, n.life / 1000));
      n.text.setAlpha(alpha);
      if (n.life <= 0) {
        n.text.destroy();
        this.notifications.splice(i, 1);
        removed = true;
      }
    }
    if (removed) {
      // 重新排列剩余通知
      this.notifY = 80;
      for (const n of this.notifications) {
        n.text.setPosition(16, this.notifY);
        this.notifY += n.text.height + 4;
      }
    }
  }
}
