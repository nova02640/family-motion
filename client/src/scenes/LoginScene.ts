import Phaser from 'phaser';
import { api } from '../net/ApiClient.js';
import { TextInput } from '../ui/TextInput.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

export class LoginScene extends Phaser.Scene {
  private usernameInput!: TextInput;
  private passwordInput!: TextInput;
  private statusText!: Phaser.GameObjects.Text;
  private busy = false;

  constructor() {
    super('login');
  }

  create() {
    const cx = GAME_WIDTH / 2;
    this.add.text(cx, 80, '传 奇 Web', {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: '#fbbf24',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(cx, 130, 'Mir Web — 浏览器即开即玩', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#9ca3af',
    }).setOrigin(0.5);

    this.add.text(cx - 130, 200, '账号', this.labelStyle()).setOrigin(0, 0.5);
    this.usernameInput = new TextInput(this, cx - 80, 200, 260, '3-32 位字母数字下划线', 32);
    this.usernameInput.text.on('submit', () => this.passwordInput.focus());

    this.add.text(cx - 130, 250, '密码', this.labelStyle()).setOrigin(0, 0.5);
    this.passwordInput = new TextInput(this, cx - 80, 250, 260, '至少 6 位', 32);
    this.passwordInput.text.on('submit', () => this.tryLogin());

    this.makeButton(cx - 80, 310, '登 录', 0x2563eb, () => this.tryLogin());
    this.makeButton(cx + 80, 310, '注 册', 0x059669, () => this.tryRegister());

    this.statusText = this.add.text(cx, 360, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#f87171',
    }).setOrigin(0.5);

    this.add.text(cx, GAME_HEIGHT - 30, '提示：MVP 演示版，账号数据保存在本地数据库', {
      fontFamily: 'monospace', fontSize: '11px', color: '#6b7280',
    }).setOrigin(0.5);

    this.usernameInput.focus();
    this.events.once('shutdown', () => {
      this.usernameInput?.destroy();
      this.passwordInput?.destroy();
    });
  }

  private labelStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontFamily: 'monospace', fontSize: '16px', color: '#e5e7eb' };
  }

  private makeButton(x: number, y: number, label: string, color: number, onClick: () => void) {
    const text = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '16px', color: '#fff', padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const bg = this.add.rectangle(x, y, 120, 36, color, 1).setStrokeStyle(2, 0x000).setOrigin(0.5);
    bg.setDepth(-1);
    text.on('pointerover', () => bg.setFillStyle(color, 0.85));
    text.on('pointerout', () => bg.setFillStyle(color, 1));
    text.on('pointerdown', onClick);
    return { text, bg };
  }

  private async tryLogin() {
    if (this.busy) return;
    const username = this.usernameInput.getValue().trim();
    const password = this.passwordInput.getValue();
    if (!username || !password) {
      this.setStatus('请输入账号和密码', true);
      return;
    }
    this.busy = true;
    this.setStatus('登录中...', false);
    try {
      await api.login(username, password);
      this.scene.start('character-select');
    } catch (err) {
      this.setStatus((err as Error).message ?? '登录失败', true);
    } finally {
      this.busy = false;
    }
  }

  private async tryRegister() {
    if (this.busy) return;
    const username = this.usernameInput.getValue().trim();
    const password = this.passwordInput.getValue();
    if (!username || !password) {
      this.setStatus('请输入账号和密码', true);
      return;
    }
    this.busy = true;
    this.setStatus('注册中...', false);
    try {
      await api.register(username, password);
      this.scene.start('character-select');
    } catch (err) {
      this.setStatus((err as Error).message ?? '注册失败', true);
    } finally {
      this.busy = false;
    }
  }

  private setStatus(text: string, isError: boolean) {
    this.statusText.setText(text).setColor(isError ? '#f87171' : '#9ca3af');
  }
}
