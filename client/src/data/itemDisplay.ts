import { ItemType, Rarity, ITEM_TEMPLATES } from '@mir/shared';

export interface ItemDisplay {
  name: string;
  color: string;
  type: '消耗品' | '装备' | '材料' | '货币';
}

const RARITY_COLOR: Record<Rarity, string> = {
  [Rarity.Common]: '#e5e7eb',
  [Rarity.Uncommon]: '#34d399',
  [Rarity.Rare]: '#60a5fa',
  [Rarity.Epic]: '#a78bfa',
  [Rarity.Legendary]: '#fbbf24',
};

function typeLabel(t: ItemType): ItemDisplay['type'] {
  if (t === ItemType.Consumable) return '消耗品';
  if (t === ItemType.Currency) return '货币';
  if (t === ItemType.Material) return '材料';
  return '装备';
}

const MAP: Record<string, ItemDisplay> = {};
for (const item of ITEM_TEMPLATES) {
  MAP[item.id] = {
    name: item.name,
    color: RARITY_COLOR[item.rarity] ?? '#e5e7eb',
    type: typeLabel(item.type),
  };
}

export const ITEM_DISPLAY: Record<string, ItemDisplay> = MAP;
