import Phaser from 'phaser';
import { gameClient } from '../net/GameClient.js';
import { GAME_WIDTH } from '../config.js';
import { getMap, TileType } from '@mir/shared';

const SIZE = 150;

/** 右上角小地图 */
export class MinimapPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private baseG: Phaser.GameObjects.Graphics;
  private dotG: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private lastMapId = '';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const x = GAME_WIDTH - SIZE / 2 - 12;
    const y = SIZE / 2 + 12;

    this.container = scene.add.container(x, y).setDepth(120).setScrollFactor(0);

    const border = scene.add.rectangle(0, 0, SIZE + 8, SIZE + 8, 0x111827, 0.9)
      .setStrokeStyle(2, 0x374151).setOrigin(0.5);
    this.baseG = scene.add.graphics();
    this.dotG = scene.add.graphics();
    this.nameText = scene.add.text(0, -SIZE / 2 - 16, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#fbbf24', backgroundColor: '#111827',
      padding: { x: 6, y: 2 },
    }).setOrigin(0.5);

    this.container.add([border, this.baseG, this.dotG, this.nameText]);
  }

  private renderBase(mapId: string) {
    const map = getMap(mapId);
    if (!map) return;
    this.lastMapId = mapId;
    this.nameText.setText(map.name);
    this.baseG.clear();
    const cell = SIZE / Math.max(map.width, map.height);
    const ox = -SIZE / 2;
    const oy = -SIZE / 2;
    for (let ty = 0; ty < map.height; ty++) {
      for (let tx = 0; tx < map.width; tx++) {
        const t = map.tiles[ty * map.width + tx] as TileType;
        let color = 0x1a202c;
        if (t === TileType.Floor) color = 0x2d3748;
        else if (t === TileType.Wall) color = 0x4a5568;
        else if (t === TileType.Water) color = 0x2b6cb0;
        else if (t === TileType.Tree) color = 0x276749;
        this.baseG.fillStyle(color, 1);
        this.baseG.fillRect(ox + tx * cell, oy + ty * cell, cell + 0.5, cell + 0.5);
      }
    }
  }

  update() {
    const state = gameClient.room?.state;
    if (!state) return;
    if (state.mapId !== this.lastMapId) this.renderBase(state.mapId);

    const map = getMap(state.mapId);
    if (!map) return;
    const cell = SIZE / Math.max(map.width, map.height);
    const ox = -SIZE / 2;
    const oy = -SIZE / 2;

    this.dotG.clear();
    // NPC（绿）
    this.dotG.fillStyle(0x34d399, 1);
    state.npcs.forEach((n) => {
      this.dotG.fillRect(ox + n.position.x * cell, oy + n.position.y * cell, cell * 1.5, cell * 1.5);
    });
    // 怪物（红）
    this.dotG.fillStyle(0xef4444, 1);
    state.monsters.forEach((m) => {
      if (m.deadAt > 0) return;
      this.dotG.fillRect(ox + m.position.x * cell, oy + m.position.y * cell, cell, cell);
    });
    // 玩家（黄）
    this.dotG.fillStyle(0xfde047, 1);
    state.players.forEach((p) => {
      this.dotG.fillRect(ox + p.position.x * cell, oy + p.position.y * cell, cell * 2, cell * 2);
    });
  }

  destroy() {
    this.container.destroy();
  }
}
