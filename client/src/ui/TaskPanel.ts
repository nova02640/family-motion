import Phaser from 'phaser';
import { gameClient } from '../net/GameClient.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

/** 任务面板（J 键 / 与村长对话打开） */
export class TaskPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private rows: Phaser.GameObjects.Container;
  private visible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const panelW = 520;
    const panelH = 300;
    this.container = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2)
      .setDepth(300).setScrollFactor(0).setVisible(false);

    const bg = scene.add.rectangle(0, 0, panelW, panelH, 0x111827, 0.97).setStrokeStyle(2, 0x4b5563);
    this.container.add(bg);
    this.container.add(scene.add.text(0, -panelH / 2 + 24, '任务', {
      fontFamily: 'monospace', fontSize: '20px', color: '#fbbf24',
    }).setOrigin(0.5));

    this.rows = scene.add.container(-panelW / 2 + 30, -panelH / 2 + 60);
    this.container.add(this.rows);

    const closeBtn = scene.add.text(panelW / 2 - 30, -panelH / 2 + 24, '×', {
      fontFamily: 'monospace', fontSize: '22px', color: '#f87171',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.toggle());
    this.container.add(closeBtn);
  }

  open() {
    this.visible = true;
    this.container.setVisible(true);
    this.refresh();
  }

  toggle() {
    this.visible = !this.visible;
    this.container.setVisible(this.visible);
    if (this.visible) this.refresh();
  }

  refresh() {
    this.rows.removeAll(true);
    const tasks = gameClient.getTasks();
    tasks.forEach((t, i) => {
      const y = i * 74;
      const color = t.done ? '#34d399' : '#e5e7eb';
      const title = this.scene.add.text(0, y, `${t.title}${t.done ? ' (已完成)' : ''}`, {
        fontFamily: 'monospace', fontSize: '14px', color,
      }).setOrigin(0, 0.5);
      const desc = this.scene.add.text(0, y + 20, `${t.description}`, {
        fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af',
      }).setOrigin(0, 0.5);
      const prog = this.scene.add.text(0, y + 40, `进度：${Math.min(t.current, t.targetCount)}/${t.targetCount}`, {
        fontFamily: 'monospace', fontSize: '12px', color: t.done ? '#34d399' : '#fde047',
      }).setOrigin(0, 0.5);
      const reward = this.scene.add.text(220, y + 40, `奖励：${t.rewardLabel}`, {
        fontFamily: 'monospace', fontSize: '12px', color: '#fbbf24',
      }).setOrigin(0, 0.5);
      this.rows.add([title, desc, prog, reward]);
    });
  }

  destroy() {
    this.container.destroy();
  }
}
