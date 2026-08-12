/**
 * 文本输入控件（Phaser 实现，捕获键盘输入）
 *
 * 用法：
 *   const input = new TextInput(scene, x, y, width, 'placeholder')
 *   input.focus()
 *   scene.events.once('shutdown', () => input.destroy())
 *   // 读取：input.getValue()
 */
import Phaser from 'phaser';

const PRINTABLE = /^[a-zA-Z0-9 ._\-@]$/;

export class TextInput {
  private scene: Phaser.Scene;
  private buffer = '';
  readonly text: Phaser.GameObjects.Text;
  bg: Phaser.GameObjects.Rectangle;
  private cursor = true;
  private blink?: Phaser.Time.TimerEvent;
  private focused = false;
  private onKeyDown?: (event: KeyboardEvent) => void;
  placeholder: string;
  maxLength: number;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, placeholder = '', maxLength = 32) {
    this.scene = scene;
    this.placeholder = placeholder;
    this.maxLength = maxLength;

    this.bg = scene.add.rectangle(x, y, width, 30, 0x1f2937, 0.95)
      .setStrokeStyle(1, 0x4b5563)
      .setOrigin(0, 0.5);
    this.bg.setSize(width, 30);

    this.text = scene.add.text(x + 8, y, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#e5e7eb',
    }).setOrigin(0, 0.5);

    this.bg.setInteractive({ useHandCursor: true });
    this.bg.on('pointerdown', () => this.focus());
    this.renderText();
  }

  focus() {
    if (this.focused) return;
    this.focused = true;
    this.bg.setStrokeStyle(2, 0x60a5fa);
    this.onKeyDown = (event: KeyboardEvent) => this.handleKey(event);
    window.addEventListener('keydown', this.onKeyDown);
    this.blink = this.scene.time.addEvent({
      delay: 500, loop: true, callback: () => { this.cursor = !this.cursor; this.renderText(); },
    });
    // 阻止 Phaser 接收空格等键
    this.scene.input.keyboard?.removeAllListeners('keydown');
  }

  blur() {
    if (!this.focused) return;
    this.focused = false;
    this.bg.setStrokeStyle(1, 0x4b5563);
    if (this.onKeyDown) window.removeEventListener('keydown', this.onKeyDown);
    this.blink?.remove();
    this.cursor = false;
    this.renderText();
  }

  isFocused() { return this.focused; }

  getValue() { return this.buffer; }

  clear() { this.buffer = ''; this.renderText(); }

  private handleKey(event: KeyboardEvent) {
    // 不阻止 Phaser 默认行为以外的全局快捷键
    if (event.key === 'Backspace') {
      this.buffer = this.buffer.slice(0, -1);
      this.renderText();
      event.preventDefault();
      return;
    }
    if (event.key === 'Enter') {
      // 触发 submit（由调用方监听）
      this.text.emit('submit', this.buffer);
      event.preventDefault();
      return;
    }
    if (event.key === 'Escape') {
      this.blur();
      event.preventDefault();
      return;
    }
    if (event.key.length === 1 && PRINTABLE.test(event.key)) {
      if (this.buffer.length < this.maxLength) {
        this.buffer += event.key;
        this.renderText();
      }
      event.preventDefault();
    }
  }

  private renderText() {
    const shown = this.buffer + (this.focused && this.cursor ? '_' : '');
    this.text.setText(shown || (this.focused ? '' : this.placeholder));
    this.text.setColor(this.buffer || this.focused ? '#e5e7eb' : '#6b7280');
  }

  destroy() {
    this.blur();
    this.bg.destroy();
    this.text.destroy();
  }
}
