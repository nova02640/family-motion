import Phaser from 'phaser';
import { api } from '../net/ApiClient.js';
import { TextInput } from '../ui/TextInput.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

export class LoginScene extends Phaser.Scene {
  private usernameInput!: TextInput;
  private statusText!: Phaser.GameObjects.Text;
  private busy = false;

  constructor() {
    super('login');
  }

  create() {
    const cx = GAME_WIDTH / 2;
    this.add.text(cx, 80, '传 奇 Web', {
      fontFamily: 'monospace',
      fontSize: '44px',
      color: '#fbbf24',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(cx, 134, '单机版 · 浏览器即开即玩', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#9ca3af',
    }).setOrigin(0.5);

    this.add.text(cx - 130, 210, '玩家名', this.labelStyle()).setOrigin(0, 0.5);
    this.usernameInput = new TextInput(this, cx - 80, 210, 260, '输入任意名字进入游戏', 16);
    this.usernameInput.text.on('submit', () => this.tryEnter());

    this.makeButton(cx, 280, '进入游戏', 0x2563eb, () => this.tryEnter());

    this.statusText = this.add.text(cx, 340, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#f87171',
    }).setOrigin(0.5);

    this.add.text(cx, GAME_HEIGHT - 30, '账号与角色存档保存在本地浏览器 (localStorage)', {
      fontFamily: 'monospace', fontSize: '11px', color: '#6b7280',
    }).setOrigin(0.5);

    this.usernameInput.focus();

    // 尝试恢复上次账号（预填名字）
    if (api.restoreSession()) {
      this.usernameInput.setValue(localStorage.getItem('mir_current_user') ?? '');
    }

    this.events.once('shutdown', () => {
      this.usernameInput?.destroy();
    });
  }

  private labelStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontFamily: 'monospace', fontSize: '16px', color: '#e5e7eb' };
  }

  private makeButton(x: number, y: number, label: string, color: number, onClick: () => void) {
    const text = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '16px', color: '#fff', padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const bg = this.add.rectangle(x, y, 160, 36, color, 1).setStrokeStyle(2, 0x000).setOrigin(0.5);
    bg.setDepth(-1);
    text.on('pointerover', () => bg.setFillStyle(color, 0.85));
    text.on('pointerout', () => bg.setFillStyle(color, 1));
    text.on('pointerdown', onClick);
    return { text, bg };
  }

  private async tryEnter() {
    if (this.busy) return;
    const username = this.usernameInput.getValue().trim();
    if (!username) {
      this.setStatus('请输入玩家名');
      return;
    }
    this.busy = true;
    this.setStatus('进入中...', false);
    try {
      await api.login(username, '');
      this.scene.start('character-select');
    } catch (err) {
      this.setStatus((err as Error).message ?? '进入失败');
    } finally {
      this.busy = false;
    }
  }

  private setStatus(text: string, isError = true) {
    this.statusText.setText(text).setColor(isError ? '#f87171' : '#9ca3af');
  }
}
