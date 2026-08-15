import {
  INVENTORY_SIZE,
  ItemType,
  type EquipSlot,
  type ItemTemplate,
} from '@mir/shared';
import { getItem } from '@mir/shared';

export interface InvSlot {
  index: number;
  itemId: string;
  count: number;
}

export interface PlayerInventory {
  gold: number;
  slots: (InvSlot | null)[];
  equipment: Partial<Record<EquipSlot, string | undefined>>;
}

export function createEmptyInventory(): PlayerInventory {
  return {
    gold: 0,
    slots: new Array<InvSlot | null>(INVENTORY_SIZE).fill(null),
    equipment: {},
  };
}

function findStackSlot(inv: PlayerInventory, itemId: string): InvSlot | null {
  const tpl = getItem(itemId);
  if (!tpl) return null;
  for (const slot of inv.slots) {
    if (slot && slot.itemId === itemId && slot.count < tpl.stack) return slot;
  }
  return null;
}

function findEmptySlot(inv: PlayerInventory): number {
  return inv.slots.findIndex((s) => s === null);
}

/** 添加物品，返回实际添加数量 */
export function addItem(inv: PlayerInventory, itemId: string, count: number): number {
  const tpl = getItem(itemId);
  if (!tpl) return 0;

  if (tpl.type === ItemType.Currency) {
    inv.gold += count;
    return count;
  }

  let remaining = count;
  let stackSlot = findStackSlot(inv, itemId);
  while (remaining > 0 && stackSlot) {
    const canAdd = Math.min(tpl.stack - stackSlot.count, remaining);
    stackSlot.count += canAdd;
    remaining -= canAdd;
    stackSlot = findStackSlot(inv, itemId);
  }
  while (remaining > 0) {
    const idx = findEmptySlot(inv);
    if (idx < 0) break;
    const canAdd = Math.min(tpl.stack, remaining);
    inv.slots[idx] = { index: idx, itemId, count: canAdd };
    remaining -= canAdd;
  }
  return count - remaining;
}

export function removeSlot(inv: PlayerInventory, index: number, count = 1): boolean {
  const slot = inv.slots[index];
  if (!slot || slot.count < count) return false;
  slot.count -= count;
  if (slot.count <= 0) inv.slots[index] = null;
  return true;
}

/** 使用消耗品 */
export function useConsumable(inv: PlayerInventory, index: number): { hp: number; mp: number; ok: boolean } {
  const slot = inv.slots[index];
  if (!slot) return { hp: 0, mp: 0, ok: false };
  const tpl = getItem(slot.itemId);
  if (!tpl || tpl.type !== ItemType.Consumable || !tpl.useEffect) {
    return { hp: 0, mp: 0, ok: false };
  }
  removeSlot(inv, index, 1);
  return { hp: tpl.useEffect.hp ?? 0, mp: tpl.useEffect.mp ?? 0, ok: true };
}

/** 装备物品 */
export function equipItem(inv: PlayerInventory, index: number): { ok: boolean; reason?: string } {
  const slot = inv.slots[index];
  if (!slot) return { ok: false, reason: '槽位为空' };
  const tpl = getItem(slot.itemId);
  if (!tpl || !tpl.slot) return { ok: false, reason: '该物品无法装备' };
  if (tpl.requiredLevel > 0) {
    // requiredLevel 校验由调用方基于玩家等级执行，这里仅做装备槽处理
  }
  const existing = inv.equipment[tpl.slot];
  if (existing) {
    if (findEmptySlot(inv) < 0) return { ok: false, reason: '背包已满' };
    inv.equipment[tpl.slot] = undefined;
    addItem(inv, existing, 1);
  }
  removeSlot(inv, index, 1);
  inv.equipment[tpl.slot] = slot.itemId;
  return { ok: true };
}

/** 卸下装备 */
export function unequipItem(inv: PlayerInventory, slot: EquipSlot): { ok: boolean; reason?: string } {
  const itemId = inv.equipment[slot];
  if (!itemId) return { ok: false, reason: '该槽位无装备' };
  if (findEmptySlot(inv) < 0) return { ok: false, reason: '背包已满' };
  inv.equipment[slot] = undefined;
  addItem(inv, itemId, 1);
  return { ok: true };
}

export function getEquippedItems(inv: PlayerInventory): Array<{ slot: EquipSlot; itemId: string }> {
  const result: Array<{ slot: EquipSlot; itemId: string }> = [];
  for (const k in inv.equipment) {
    const slot = k as EquipSlot;
    const itemId = inv.equipment[slot];
    if (itemId) result.push({ slot, itemId });
  }
  return result;
}
