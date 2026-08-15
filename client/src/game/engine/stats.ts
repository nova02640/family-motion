import {
  CLASS_BASE_STATS,
  CLASS_GROWTH,
  ItemType,
  type Stats,
  type PlayerClass,
  type EquipSlot,
  type ItemTemplate,
} from '@mir/shared';
import { getItem } from '@mir/shared';

const EQUIP_TYPES = new Set<ItemType>([
  ItemType.Weapon,
  ItemType.Armor,
  ItemType.Helmet,
  ItemType.Necklace,
  ItemType.Ring,
  ItemType.Boots,
  ItemType.Belt,
]);

/**
 * 计算角色属性 = 职业基础 + 等级成长 + 自由加点 + 装备加成
 */
export function computeStats(
  classId: PlayerClass,
  level: number,
  equipment: Partial<Record<EquipSlot, string | undefined>>,
  bonus: Partial<Stats> = {},
): Stats {
  const base: Stats = { ...CLASS_BASE_STATS[classId] };
  const growth = CLASS_GROWTH[classId];
  for (const k in growth) {
    const key = k as keyof Stats;
    base[key] = (base[key] ?? 0) + (growth[key] ?? 0) * (level - 1);
  }

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

  // 自由加点
  for (const k in bonus) {
    const key = k as keyof Stats;
    stats[key] = (stats[key] ?? 0) + (bonus[key] ?? 0);
  }

  // 装备加成
  for (const slotKey in equipment) {
    const itemId = equipment[slotKey as EquipSlot];
    if (!itemId) continue;
    const item: ItemTemplate | undefined = getItem(itemId);
    if (!item || !item.statsBonus || !EQUIP_TYPES.has(item.type)) continue;
    for (const k in item.statsBonus) {
      const key = k as keyof Stats;
      stats[key] = (stats[key] ?? 0) + (item.statsBonus[key] ?? 0);
    }
  }

  return stats;
}
