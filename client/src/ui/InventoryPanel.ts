import Phaser from 'phaser';
import { localState } from '../state/LocalState.js';
import { gameClient } from '../net/GameClient.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { INVENTORY_SIZE, type EquipSlot, EquipSlot as ES } from '@mir/shared';
import { ITEM_DISPLAY } from '../data/itemDisplay.js';

interface SlotView {
  index: number;
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

const SLOTS_PER_ROW = 8;
const SLOT_SIZE = 56;

export class InventoryPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private goldText!: Phaser.GameObjects.Text;
  private slots: SlotView[] = [];
  private visible = false;
  private equipSlots = new Map<EquipSlot, Phaser.GameObjects.Text>();
  private contextMenu?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(300).setScrollFactor(0).setVisible(false);

    // 背景面板
    const panelW = SLOTS_PER_ROW * SLOT_SIZE + 200;
    const panelH = Math.ceil(INVENTORY_SIZE / SLOTS_PER_ROW) * SLOT_SIZE + 200;
    const bg = scene.add.rectangle(0, 0, panelW, panelH, 0x111827, 0.97).setStrokeStyle(2, 0x4b5563);
    this.container.add(bg);

    // 标题
    this.container.add(scene.add.text(0, -panelH / 2 + 20, '背包', {
      fontFamily: 'monospace', fontSize: '18px', color: '#fbbf24',
    }).setOrigin(0.5));

    this.goldText = scene.add.text(0, -panelH / 2 + 50, '金币: 0', {
      fontFamily: 'monospace', fontSize: '14px', color: '#fde047',
    }).setOrigin(0.5);
    this.container.add(this.goldText);

    // 装备槽（左侧）
    const equipSlotList: EquipSlot[] = [
      ES.Helmet, ES.Necklace, ES.Weapon, ES.Armor, ES.Belt, ES.Boots, ES.RingLeft, ES.RingRight,
    ];
    const equipLabels: Record<EquipSlot, string> = {
      [ES.Helmet]: '头盔', [ES.Necklace]: '项链', [ES.Weapon]: '武器', [ES.Armor]: '衣服',
      [ES.Belt]: '腰带', [ES.Boots]: '鞋子', [ES.RingLeft]: '左戒', [ES.RingRight]: '右戒',
    };
    const equipStartY = -panelH / 2 + 80;
    this.container.add(scene.add.text(-panelW / 2 + 30, equipStartY - 20, '装备', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af',
    }).setOrigin(0, 0.5));
    equipSlotList.forEach((slot, i) => {
      const y = equipStartY + i * 36;
      const label = scene.add.text(-panelW / 2 + 30, y, equipLabels[slot], {
        fontFamily: 'monospace', fontSize: '11px', color: '#9ca3af',
      }).setOrigin(0, 0.5);
      const slotText = scene.add.text(-panelW / 2 + 80, y, '— 空 —', {
        fontFamily: 'monospace', fontSize: '11px', color: '#6b7280',
      }).setOrigin(0, 0.5);
      slotText.setInteractive({ useHandCursor: true });
      slotText.on('pointerdown', () => {
        const itemId = this.equipSlots.get(slot)?.text;
        if (itemId && itemId !== '— 空 —') {
          gameClient.sendUnequip(slot);
        }
      });
      this.equipSlots.set(slot, slotText);
      this.container.add([label, slotText]);
    });

    // 背包格（右侧）
    const slotStartX = -50;
    const slotStartY = -panelH / 2 + 80;
    this.container.add(scene.add.text(slotStartX, slotStartY - 20, '物品', {
      fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af',
    }).setOrigin(0, 0.5));

    for (let i = 0; i < INVENTORY_SIZE; i++) {
      const col = i % SLOTS_PER_ROW;
      const row = Math.floor(i / SLOTS_PER_ROW);
      const x = slotStartX + col * SLOT_SIZE;
      const y = slotStartY + row * SLOT_SIZE;
      const bgRect = scene.add.rectangle(x, y, SLOT_SIZE - 4, SLOT_SIZE - 4, 0x1f2937, 0.9)
        .setStrokeStyle(1, 0x374151).setOrigin(0, 0);
      const text = scene.add.text(x + (SLOT_SIZE - 4) / 2, y + (SLOT_SIZE - 4) / 2, '', {
        fontFamily: 'monospace', fontSize: '9px', color: '#e5e7eb',
        align: 'center', wordWrap: { width: SLOT_SIZE - 8 },
      }).setOrigin(0.5);
      bgRect.setInteractive({ useHandCursor: true });
      const slotIndex = i;
      bgRect.on('pointerdown', () => this.showContextMenu(slotIndex, x, y));
      this.slots.push({ index: slotIndex, bg: bgRect, text });
      this.container.add([bgRect, text]);
    }

    // 关闭按钮
    const closeBtn = scene.add.text(panelW / 2 - 50, -panelH / 2 + 20, '×', {
      fontFamily: 'monospace', fontSize: '22px', color: '#f87171',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.toggle());
    this.container.add(closeBtn);

    // 点击面板外部关闭（简化：监听场景点击 - 但与游戏点击冲突，所以仅靠按钮/Esc/B 关闭）
    scene.input.keyboard?.on('keydown-B', () => this.toggle());
    scene.input.keyboard?.on('keydown-I', () => this.toggle());
    scene.input.keyboard?.on('keydown-ESC', () => { if (this.visible) this.toggle(); });
  }

  toggle() {
    this.visible = !this.visible;
    this.container.setVisible(this.visible);
    if (this.visible) this.refresh();
  }

  refresh() {
    const inv = localState.inventory;
    this.goldText.setText(`金币: ${inv.gold}`);
    // 背包格
    for (const slot of this.slots) {
      const data = inv.slots.find((s) => s.index === slot.index);
      if (data) {
        const display = ITEM_DISPLAY[data.itemId] ?? { name: data.itemId, color: '#e5e7eb' };
        slot.text.setText(`${display.name}\nx${data.count}`);
        slot.bg.setFillStyle(0x374151, 0.9);
      } else {
        slot.text.setText('');
        slot.bg.setFillStyle(0x1f2937, 0.9);
      }
    }
    // 装备槽
    for (const [slot, text] of this.equipSlots) {
      const e = inv.equipment.find((x) => x.slot === slot);
      if (e) {
        const display = ITEM_DISPLAY[e.itemId] ?? { name: e.itemId, color: '#e5e7eb' };
        text.setText(display.name).setColor('#fbbf24');
      } else {
        text.setText('— 空 —').setColor('#6b7280');
      }
    }
  }

  private showContextMenu(slotIndex: number, x: number, y: number) {
    this.contextMenu?.destroy();
    const inv = localState.inventory;
    const slotData = inv.slots.find((s) => s.index === slotIndex);
    if (!slotData) return;

    const display = ITEM_DISPLAY[slotData.itemId] ?? { name: slotData.itemId, color: '#e5e7eb' };
    // 容器坐标 → 场景坐标
    const panelX = GAME_WIDTH / 2;
    const panelY = GAME_HEIGHT / 2;
    const menu = this.scene.add.container(panelX + x + SLOT_SIZE, panelY + y).setDepth(310).setScrollFactor(0);
    const items = [
      { label: display.type === '消耗品' ? '使用' : '装备', action: () => {
        if (display.type === '消耗品') gameClient.sendUseItem(slotData.itemId);
        else gameClient.sendEquip(slotData.itemId);
      }},
      { label: '丢弃 1 个', action: () => gameClient.sendDropItem(slotIndex, 1) },
      { label: '关闭', action: () => {} },
    ];
    items.forEach((item, i) => {
      const t = this.scene.add.text(0, i * 22, item.label, {
        fontFamily: 'monospace', fontSize: '12px', color: '#e5e7eb',
        backgroundColor: '#1f2937', padding: { x: 8, y: 4 },
      }).setOrigin(0, 0).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => { item.action(); menu.destroy(); this.contextMenu = undefined; this.refresh(); });
      menu.add(t);
    });
    this.contextMenu = menu;
    this.scene.time.delayedCall(5000, () => { menu.destroy(); this.contextMenu = undefined; });
  }

  destroy() {
    this.container.destroy();
    this.contextMenu?.destroy();
  }
}
