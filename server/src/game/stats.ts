import {
  CLASS_BASE_STATS,
  CLASS_GROWTH,
  ItemType,
  type Stats,
  type PlayerClass,
  type EquipSlot,
  type ItemTemplate,
} from '@mir/shared';

/**
 * 计算角色属性 = 职业基础 + 等级成长 + 装备加成
 */
export function computeStats(
  classId: PlayerClass,
  level: number,
  equipment: Partial<Record<EquipSlot, string | undefined>>,
  itemLookup: (id: string) => ItemTemplate | undefined,
): Stats {
  const base = { ...CLASS_BASE_STATS[classId] };
  const growth = CLASS_GROWTH[classId];
  for (const k in growth) {
    const key = k as keyof Stats;
    const grow = growth[key] ?? 0;
    base[key] = Math.round((base[key] + grow * (level - 1)) * 10) / 10;
  }

  // 整数化基础
  const stats: Stats = {
    ...base,
    maxHp: Math.floor(base.maxHp),
    maxMp: Math.floor(base.maxMp),
    attack: Math.floor(base.attack),
    defense: Math.floor(base.defense),
    magicAttack: Math.floor(base.magicAttack),
    magicDefense: Math.floor(base.magicDefense),
    accuracy: Math.floor(base.accuracy),
    evasion: Math.floor(base.evasion),
  };

  // 装备加成
  for (const slotKey in equipment) {
    const itemId = equipment[slotKey as EquipSlot];
    if (!itemId) continue;
    const item = itemLookup(itemId);
    if (!item || !item.statsBonus) continue;
    if (item.type !== ItemType.Weapon && item.type !== ItemType.Armor &&
        item.type !== ItemType.Helmet && item.type !== ItemType.Necklace &&
        item.type !== ItemType.Ring && item.type !== ItemType.Boots &&
        item.type !== ItemType.Belt) continue;
    for (const k in item.statsBonus) {
      const key = k as keyof Stats;
      stats[key] = (stats[key] ?? 0) + (item.statsBonus[key] ?? 0);
    }
  }

  return stats;
}
