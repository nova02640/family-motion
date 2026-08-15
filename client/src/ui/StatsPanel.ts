import Phaser from 'phaser';
import { gameClient } from '../net/GameClient.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import type { Stats } from '@mir/shared';

interface AllocRow {
  label: string;
  stat: keyof Stats;
  inc: number;
}

const ALLOC_ROWS: AllocRow[] = [
  { label: '生命上限 +10', stat: 'maxHp', inc: 10 },
  { label: '魔法上限 +10', stat: 'maxMp', inc: 10 },
  { label: '物理攻击 +2', stat: 'attack', inc: 2 },
  { label: '物理防御 +1', stat: 'defense', inc: 1 },
  { label: '魔法攻击 +2', stat: 'magicAttack', inc: 2 },
];

/** 属性面板：查看属性与分配属性点 */
export class StatsPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private visible = false;
  private rowsContainer!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const panelW = 420;
    const panelH = 340;
    this.container = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2)
      .setDepth(300).setScrollFactor(0).setVisible(false);

    const bg = scene.add.rectangle(0, 0, panelW, panelH, 0x111827, 0.97).setStrokeStyle(2, 0x4b5563);
    this.container.add(bg);

    this.container.add(scene.add.text(0, -panelH / 2 + 24, '角色属性', {
      fontFamily: 'monospace', fontSize: '20px', color: '#fbbf24',
    }).setOrigin(0.5));

    this.rowsContainer = scene.add.container(-panelW / 2 + 24, -panelH / 2 + 60);
    this.container.add(this.rowsContainer);

    const closeBtn = scene.add.text(panelW / 2 - 30, -panelH / 2 + 24, '×', {
      fontFamily: 'monospace', fontSize: '22px', color: '#f87171',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.toggle());
    this.container.add(closeBtn);
  }

  toggle() {
    this.visible = !this.visible;
    this.container.setVisible(this.visible);
    if (this.visible) this.refresh();
  }

  refresh() {
    this.rowsContainer.removeAll(true);

    const player = gameClient.room?.state.players.get('local');
    const free = gameClient.getFreePoints();

    const lines: Array<{ label: string; value: string }> = [
      { label: '可分配属性点', value: `${free}` },
      { label: '物理攻击', value: `${player?.attack ?? 0}` },
      { label: '物理防御', value: `${player?.defense ?? 0}` },
      { label: '魔法攻击', value: `${player?.magicAttack ?? 0}` },
      { label: '魔法防御', value: `${player?.magicDefense ?? 0}` },
      { label: '生命上限', value: `${player?.maxHp ?? 0}` },
      { label: '魔法上限', value: `${player?.maxMp ?? 0}` },
    ];

    let y = 0;
    for (const l of lines) {
      const label = this.scene.add.text(0, y, l.label, {
        fontFamily: 'monospace', fontSize: '13px', color: '#9ca3af',
      }).setOrigin(0, 0.5);
      const value = this.scene.add.text(160, y, l.value, {
        fontFamily: 'monospace', fontSize: '13px', color: '#e5e7eb',
      }).setOrigin(0, 0.5);
      this.rowsContainer.add([label, value]);
      y += 26;
    }

    if (free > 0) {
      y += 8;
      this.rowsContainer.add(this.scene.add.text(0, y, '—— 分配属性点 ——', {
        fontFamily: 'monospace', fontSize: '12px', color: '#fbbf24',
      }).setOrigin(0, 0.5));
      y += 22;
      for (const row of ALLOC_ROWS) {
        const label = this.scene.add.text(0, y, row.label, {
          fontFamily: 'monospace', fontSize: '12px', color: '#e5e7eb',
        }).setOrigin(0, 0.5);
        const btn = this.scene.add.text(150, y, '加点', {
          fontFamily: 'monospace', fontSize: '12px', color: '#fff',
          backgroundColor: '#2563eb', padding: { x: 10, y: 2 },
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => {
          gameClient.sendAllocate(row.stat, row.inc);
          this.refresh();
        });
        this.rowsContainer.add([label, btn]);
        y += 24;
      }
    }
  }

  destroy() {
    this.container.destroy();
  }
}
