import Phaser from 'phaser';
import { gameClient } from '../net/GameClient.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { TextInput } from './TextInput.js';

interface ChatMsg { fromName: string; text: string; ts: number; system?: boolean; level?: string }

const PANEL_X = 16;
const PANEL_Y = GAME_HEIGHT - 200;
const PANEL_W = 480;
const PANEL_H = 180;
const MAX_MSG = 12;

export class ChatPanel {
  private static openCount = 0;

  /** 是否有聊天面板打开（供 ESC 优先级判断） */
  static isOpen(): boolean {
    return ChatPanel.openCount > 0;
  }

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
    if (this.visible) ChatPanel.openCount += 1;
    else ChatPanel.openCount = Math.max(0, ChatPanel.openCount - 1);
    if (this.visible) {
      this.inputEl.focus();
      this.renderMessages();
    }
  }

  isVisible() {
    return this.visible;
  }

  addMessage(fromName: string, text: string) {
    this.messages.push({ fromName, text, ts: Date.now() });
    if (this.messages.length > MAX_MSG * 2) {
      this.messages = this.messages.slice(-MAX_MSG * 2);
    }
    if (this.visible) this.renderMessages();
  }

  addSystemMessage(text: string, level = 'info') {
    this.messages.push({ fromName: '系统', text, ts: Date.now(), system: true, level });
    if (this.messages.length > MAX_MSG * 2) {
      this.messages = this.messages.slice(-MAX_MSG * 2);
    }
    if (this.visible) this.renderMessages();
  }

  private renderMessages() {
    const recent = this.messages.slice(-MAX_MSG);
    const txt = recent.map((m) => m.system ? `【系统】${m.text}` : `[${m.fromName}] ${m.text}`).join('\n');
    this.msgText.setText(txt);
  }

  destroy() {
    for (const o of this.objs) o.destroy();
    this.inputEl.destroy();
    if (this.visible) ChatPanel.openCount = Math.max(0, ChatPanel.openCount - 1);
    this.visible = false;
  }
}
