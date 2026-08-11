import Phaser from 'phaser';

/** 浮动伤害数字管理器 */
interface FloatingText {
  text: Phaser.GameObjects.Text;
  vy: number;
  life: number;
  maxLife: number;
}

export class DamageText {
  private items: FloatingText[] = [];

  spawn(scene: Phaser.Scene, x: number, y: number, content: string, color: string) {
    const text = scene.add.text(x, y, content, {
      fontFamily: 'monospace', fontSize: '16px', color,
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);
    this.items.push({ text, vy: -1.2, life: 1000, maxLife: 1000 });
  }

  update(deltaMs: number) {
    const dt = deltaMs / 16.67;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.life -= deltaMs;
      it.text.y += it.vy * dt;
      it.vy *= 0.96;
      const alpha = Math.max(0, it.life / it.maxLife);
      it.text.setAlpha(alpha);
      if (it.life <= 0) {
        it.text.destroy();
        this.items.splice(i, 1);
      }
    }
  }
}
