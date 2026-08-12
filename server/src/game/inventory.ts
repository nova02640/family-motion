import {
  INVENTORY_SIZE,
  ItemType,
  type EquipSlot,
  type ItemTemplate,
} from '@mir/shared';
import { getItem } from './data/items.js';

/** 背包槽（运行时模型） */
export interface InvSlot {
  index: number;
  itemId: string;
  count: number;
}

export interface PlayerInventory {
  gold: number;
  slots: (InvSlot | null)[];     // 固定长度 INVENTORY_SIZE
  equipment: Partial<Record<EquipSlot, string | undefined>>;
}

export function createEmptyInventory(): PlayerInventory {
  return {
    gold: 0,
    slots: new Array<InvSlot | null>(INVENTORY_SIZE).fill(null),
    equipment: {},
  };
}

/** 查找可堆叠的现有槽位 */
function findStackSlot(inv: PlayerInventory, itemId: string): InvSlot | null {
  const tpl = getItem(itemId);
  if (!tpl) return null;
  for (const slot of inv.slots) {
    if (slot && slot.itemId === itemId && slot.count < tpl.stack) {
      return slot;
    }
  }
  return null;
}

/** 查找空槽 */
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
  // 先尝试堆叠
  const stackSlot = findStackSlot(inv, itemId);
  if (stackSlot) {
    const canAdd = Math.min(tpl.stack - stackSlot.count, remaining);
    stackSlot.count += canAdd;
    remaining -= canAdd;
  }
  // 再开新槽
  while (remaining > 0) {
    if (findStackSlot(inv, itemId)) {
      const s = findStackSlot(inv, itemId)!;
      const canAdd = Math.min(tpl.stack - s.count, remaining);
      s.count += canAdd;
      remaining -= canAdd;
    } else {
      const idx = findEmptySlot(inv);
      if (idx < 0) break;
      const canAdd = Math.min(tpl.stack, remaining);
      inv.slots[idx] = { index: idx, itemId, count: canAdd };
      remaining -= canAdd;
    }
  }
  return count - remaining;
}

/** 删除指定槽位的物品 */
export function removeSlot(inv: PlayerInventory, index: number, count = 1): boolean {
  const slot = inv.slots[index];
  if (!slot) return false;
  if (slot.count < count) return false;
  slot.count -= count;
  if (slot.count <= 0) {
    inv.slots[index] = null;
  }
  return true;
}

/** 使用物品（消耗品），返回使用效果 */
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

/** 装备物品：从背包移除并穿上 */
export function equipItem(inv: PlayerInventory, index: number): { ok: boolean; reason?: string } {
  const slot = inv.slots[index];
  if (!slot) return { ok: false, reason: '槽位为空' };
  const tpl = getItem(slot.itemId);
  if (!tpl || !tpl.slot) return { ok: false, reason: '该物品无法装备' };
  const existing = inv.equipment[tpl.slot];
  // 卸下旧装备到背包
  if (existing) {
    if (findEmptySlot(inv) < 0) return { ok: false, reason: '背包已满' };
    inv.equipment[tpl.slot] = undefined;
    addItem(inv, existing, 1);
  }
  // 装备新物品
  removeSlot(inv, index, 1);
  inv.equipment[tpl.slot] = slot.itemId;
  return { ok: true };
}

/** 卸下装备到背包 */
export function unequipItem(inv: PlayerInventory, slot: EquipSlot): { ok: boolean; reason?: string } {
  const itemId = inv.equipment[slot];
  if (!itemId) return { ok: false, reason: '该槽位无装备' };
  if (findEmptySlot(inv) < 0) return { ok: false, reason: '背包已满' };
  inv.equipment[slot] = undefined;
  addItem(inv, itemId, 1);
  return { ok: true };
}

/** 计算装备加成汇总 */
export function getEquippedItems(inv: PlayerInventory): Array<{ slot: EquipSlot; itemId: string }> {
  const result: Array<{ slot: EquipSlot; itemId: string }> = [];
  for (const k in inv.equipment) {
    const slot = k as EquipSlot;
    const itemId = inv.equipment[slot];
    if (itemId) result.push({ slot, itemId });
  }
  return result;
}

/** 序列化为 DB JSON 格式 */
export function serializeInventory(inv: PlayerInventory) {
  return {
    gold: inv.gold,
    slots: inv.slots.filter((s) => s !== null) as InvSlot[],
    equipment: inv.equipment,
  };
}

/** 反序列化 DB JSON */
export function deserializeInventory(data: unknown): PlayerInventory {
  const inv = createEmptyInventory();
  if (!data || typeof data !== 'object') return inv;
  const obj = data as { gold?: number; slots?: InvSlot[]; equipment?: Partial<Record<EquipSlot, string>> };
  inv.gold = obj.gold ?? 0;
  if (Array.isArray(obj.slots)) {
    for (const s of obj.slots) {
      if (s && typeof s.index === 'number' && s.index < INVENTORY_SIZE) {
        inv.slots[s.index] = { index: s.index, itemId: s.itemId, count: s.count };
      }
    }
  }
  if (obj.equipment) {
    inv.equipment = { ...obj.equipment };
  }
  return inv;
}

/** 重新计算所有 item ID 的模板列表（用于 stats 计算） */
export function getItemTemplate(itemId: string): ItemTemplate | undefined {
  return getItem(itemId);
}
