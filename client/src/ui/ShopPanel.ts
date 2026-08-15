import Phaser from 'phaser';
import { gameClient } from '../net/GameClient.js';
import { localState } from '../state/LocalState.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { getItem } from '@mir/shared';
import type { ShopInfo } from '../game/engine/GameEngine.js';

/** 商店面板：买药水/装备，出售物品回收 */
export class ShopPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private buyContainer: Phaser.GameObjects.Container;
  private sellContainer: Phaser.GameObjects.Container;
  private goldText!: Phaser.GameObjects.Text;
  private visible = false;
  private shop: ShopInfo | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const panelW = 640;
    const panelH = 420;
    this.container = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2)
      .setDepth(300).setScrollFactor(0).setVisible(false);

    const bg = scene.add.rectangle(0, 0, panelW, panelH, 0x111827, 0.97).setStrokeStyle(2, 0x4b5563);
    this.container.add(bg);

    const title = scene.add.text(0, -panelH / 2 + 24, '杂货店', {
      fontFamily: 'monospace', fontSize: '20px', color: '#fbbf24',
    }).setOrigin(0.5);
    this.container.add(title);

    this.goldText = scene.add.text(0, -panelH / 2 + 52, '金币: 0', {
      fontFamily: 'monospace', fontSize: '14px', color: '#fde047',
    }).setOrigin(0.5);
    this.container.add(this.goldText);

    this.container.add(scene.add.text(-panelW / 2 + 24, -panelH / 2 + 80, '—— 购买 ——', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af',
    }).setOrigin(0, 0.5));
    this.container.add(scene.add.text(panelW / 2 - 24, -panelH / 2 + 80, '—— 出售(回收) ——', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af',
    }).setOrigin(1, 0.5));

    this.buyContainer = scene.add.container(-panelW / 2 + 24, -panelH / 2 + 100);
    this.sellContainer = scene.add.container(panelW / 2 - 24, -panelH / 2 + 100);
    this.container.add([this.buyContainer, this.sellContainer]);

    const closeBtn = scene.add.text(panelW / 2 - 30, -panelH / 2 + 24, '×', {
      fontFamily: 'monospace', fontSize: '22px', color: '#f87171',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.close());
    this.container.add(closeBtn);
  }

  open(shop: ShopInfo) {
    this.shop = shop;
    this.visible = true;
    this.container.setVisible(true);
    this.refresh();
  }

  close() {
    this.visible = false;
    this.container.setVisible(false);
  }

  toggle(shop?: ShopInfo) {
    if (this.visible) this.close();
    else if (shop || this.shop) this.open(shop ?? this.shop!);
  }

  refresh() {
    this.buyContainer.removeAll(true);
    this.sellContainer.removeAll(true);
    this.goldText.setText(`金币: ${localState.inventory.gold}`);

    if (this.shop) {
      this.shop.buyList.forEach((item, i) => {
        const row = this.makeBuyRow(item.name, item.price, 0, i * 24, () => {
          gameClient.sendBuyItem(item.itemId, 1);
        });
        this.buyContainer.add(row);
      });
    }

    // 出售列表：背包中可出售的物品
    const sellable = localState.inventory.slots.filter((s) => {
      const tpl = getItem(s.itemId);
      return tpl && tpl.sellPrice > 0 && s.itemId !== 'gold';
    });
    if (sellable.length === 0) {
      this.sellContainer.add(this.scene.add.text(0, 0, '(背包无可出售物品)', {
        fontFamily: 'monospace', fontSize: '11px', color: '#6b7280',
      }).setOrigin(0, 0.5));
    } else {
      sellable.slice(0, 12).forEach((s, i) => {
        const tpl = getItem(s.itemId)!;
        const row = this.makeSellRow(tpl.name, tpl.sellPrice, 0, i * 24, () => {
          gameClient.sendSellItem(s.itemId, 1);
        });
        this.sellContainer.add(row);
      });
    }
  }

  private makeBuyRow(name: string, price: number, x: number, y: number, onBuy: () => void) {
    const c = this.scene.add.container(x, y);
    const nameText = this.scene.add.text(0, 0, name, {
      fontFamily: 'monospace', fontSize: '12px', color: '#e5e7eb',
    }).setOrigin(0, 0.5);
    const priceText = this.scene.add.text(120, 0, `${price} 金`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#fde047',
    }).setOrigin(0, 0.5);
    const btn = this.scene.add.text(180, 0, '购买', {
      fontFamily: 'monospace', fontSize: '12px', color: '#fff',
      backgroundColor: '#059669', padding: { x: 8, y: 2 },
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => { onBuy(); this.scene.time.delayedCall(80, () => this.refresh()); });
    c.add([nameText, priceText, btn]);
    return c;
  }

  private makeSellRow(name: string, price: number, x: number, y: number, onSell: () => void) {
    const c = this.scene.add.container(x, y);
    const nameText = this.scene.add.text(0, 0, name, {
      fontFamily: 'monospace', fontSize: '12px', color: '#e5e7eb',
    }).setOrigin(0, 0.5);
    const priceText = this.scene.add.text(110, 0, `+${price} 金`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#fde047',
    }).setOrigin(0, 0.5);
    const btn = this.scene.add.text(170, 0, '出售', {
      fontFamily: 'monospace', fontSize: '12px', color: '#fff',
      backgroundColor: '#b45309', padding: { x: 8, y: 2 },
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => { onSell(); this.scene.time.delayedCall(80, () => this.refresh()); });
    c.add([nameText, priceText, btn]);
    return c;
  }

  destroy() {
    this.container.destroy();
  }
}
