import Phaser from 'phaser';
import { gameClient } from '../net/GameClient.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { TextInput } from './TextInput.js';

interface ChatMsg { fromName: string; text: string; ts: number }

const PANEL_X = 16;
const PANEL_Y = GAME_HEIGHT - 200;
const PANEL_W = 480;
const PANEL_H = 180;
const MAX_MSG = 12;

export class ChatPanel {
  private scene: Phaser.Scene;
  private objs: Phaser.GameObjects.GameObject[] = [];
  private inputEl: TextInput;
  private msgText: Phaser.GameObjects.Text;
  private messages: ChatMsg[] = [];
  private visible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // 背景
    const bg = scene.add.rectangle(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 0x111827, 0.92)
      .setStrokeStyle(1, 0x374151).setOrigin(0, 0).setScrollFactor(0).setDepth(280);
    this.objs.push(bg);

    this.msgText = scene.add.text(PANEL_X + 8, PANEL_Y + 8, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#e5e7eb',
      wordWrap: { width: PANEL_W - 16 }, lineSpacing: 2,
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(281);
    this.objs.push(this.msgText);

    // 输入框（直接放在场景上，不进容器）
    const inputBg = scene.add.rectangle(PANEL_X + 8, PANEL_Y + 150, PANEL_W - 16, 24, 0x1f2937, 0.95)
      .setStrokeStyle(1, 0x4b5563).setOrigin(0, 0).setScrollFactor(0).setDepth(281);
    this.objs.push(inputBg);

    // TextInput 创建后位置已经是场景坐标，独立管理可见性
    this.inputEl = new TextInput(
      scene,
      PANEL_X + 8,
      PANEL_Y + 162,
      PANEL_W - 16,
      '回车发送 / Esc 关闭（默认世界频道）',
      200,
    );
    // 由于 TextInput.bg 默认 origin 是 (0, 0.5)，PANEL_Y + 162 是中线
    this.inputEl.bg.setScrollFactor(0).setDepth(282);
    this.inputEl.text.setScrollFactor(0).setDepth(282);
    this.inputEl.bg.setVisible(false);
    this.inputEl.text.setVisible(false);
    this.inputEl.text.on('submit', (val: string) => {
      const text = val.trim();
      if (text) gameClient.sendChat('world', text);
      this.inputEl.clear();
    });

    // 监听游戏场景的聊天事件
    const gameScene = scene.scene.get('game');
    gameScene.events.on('chat', (m: { fromName: string; text: string; timestamp: number }) => {
      this.addMessage(m.fromName, m.text);
    });

    scene.input.keyboard?.on('keydown-ENTER', () => this.toggle());
    scene.input.keyboard?.on('keydown-ESC', () => { if (this.visible) this.toggle(); });

    // 初始隐藏
    this.setVisible(false);
  }

  private setVisible(v: boolean) {
    for (const o of this.objs) (o as Phaser.GameObjects.GameObject & { setVisible: (v: boolean) => void }).setVisible(v);
    this.inputEl.bg.setVisible(v);
    this.inputEl.text.setVisible(v);
    if (!v) this.inputEl.blur();
  }

  toggle() {
    this.visible = !this.visible;
    this.setVisible(this.visible);
    if (this.visible) {
      this.inputEl.focus();
      this.renderMessages();
    }
  }

  addMessage(fromName: string, text: string) {
    this.messages.push({ fromName, text, ts: Date.now() });
    if (this.messages.length > MAX_MSG * 2) {
      this.messages = this.messages.slice(-MAX_MSG * 2);
    }
    if (this.visible) this.renderMessages();
  }

  private renderMessages() {
    const recent = this.messages.slice(-MAX_MSG);
    const txt = recent.map((m) => `[${m.fromName}] ${m.text}`).join('\n');
    this.msgText.setText(txt);
  }

  destroy() {
    for (const o of this.objs) o.destroy();
    this.inputEl.destroy();
  }
}
