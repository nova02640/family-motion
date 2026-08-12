import Phaser from 'phaser';

/** 程序化生成贴图，避免依赖外部美术资源 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create() {
    // 用 Graphics 绘制后转贴图，更可控
    this.generateTile('tile_floor', 0x2d3748, 0x1a202c);
    this.generateTile('tile_wall', 0x4a5568, 0x2d3748);
    this.generateTile('tile_water', 0x2b6cb0, 0x2c5282);
    this.generateTile('tile_tree', 0x276749, 0x22543d);
    this.generateTile('tile_door', 0x975a16, 0x744210);

    // 实体贴图
    this.generateCircle('player_warrior', 0x60a5fa, 12);
    this.generateCircle('player_mage', 0xf472b6, 12);
    this.generateCircle('player_taoist', 0xfacc15, 12);
    this.generateCircle('monster_slime', 0x84cc16, 11);
    this.generateCircle('monster_wolf', 0xa16207, 11);
    this.generateCircle('monster_skeleton', 0xe5e7eb, 11);
    this.generateCircle('monster_default', 0xef4444, 11);
    this.generateSquare('npc', 0xfbbf24, 16);
    this.generateSquare('item_drop', 0xf59e0b, 8);
    this.generateCircle('item_gold', 0xfde047, 6);

    // 字体
    this.scene.start('preload');
  }

  private makeCanvas(w: number, h: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas;
  }

  private generateTile(key: string, fill: number, grid: number) {
    const SIZE = 32;
    const canvas = this.makeCanvas(SIZE, SIZE);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = `#${fill.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, SIZE, SIZE);
    // 网格线
    ctx.strokeStyle = `#${grid.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, SIZE - 1, SIZE - 1);
    // 噪点纹理
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(Math.random() * SIZE | 0, Math.random() * SIZE | 0, 2, 2);
    }
    this.textures.addCanvas(key, canvas);
  }

  private generateCircle(key: string, color: number, radius: number) {
    const size = radius * 2 + 2;
    const canvas = this.makeCanvas(size, size);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    this.textures.addCanvas(key, canvas);
  }

  private generateSquare(key: string, color: number, size: number) {
    const canvas = this.makeCanvas(size * 2, size * 2);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, size * 2, size * 2);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, size * 2 - 2, size * 2 - 2);
    this.textures.addCanvas(key, canvas);
  }
}
