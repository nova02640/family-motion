import { queryOne } from '../auth/db.js';
import {
  CLASS_BASE_STATS,
  PlayerClass,
  expToNextLevel,
  type Stats,
} from '@mir/shared';
import {
  type PlayerInventory,
  createEmptyInventory,
  serializeInventory,
  deserializeInventory,
} from './inventory.js';
import { computeStats } from './stats.js';
import { getItemTemplate } from './inventory.js';

export interface CharacterData {
  id: string;
  userId: string;
  name: string;
  classId: PlayerClass;
  level: number;
  exp: number;
  expToNext: number;
  mapId: string;
  position: { x: number; y: number };
  hp: number;
  mp: number;
  gold: number;
  inventory: PlayerInventory;
  stats: Stats;
  dirty: boolean;
}

interface CharacterRow {
  id: string;
  user_id: string;
  name: string;
  class: string;
  level: number;
  exp: number;
  map_id: string;
  pos_x: number;
  pos_y: number;
  hp: number;
  mp: number;
  gold: number;
  inventory: unknown;
  equipment: unknown;
}

/** 从数据库加载角色（含背包与装备） */
export async function loadCharacter(characterId: string, userId: string): Promise<CharacterData | null> {
  const row = await queryOne<CharacterRow>(
    'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
    [characterId, userId],
  );
  if (!row) return null;

  const classId = row.class as PlayerClass;
  const inv = deserializeInventory({
    gold: row.gold,
    slots: (row.inventory as { slots?: unknown[] } | null)?.slots ?? [],
    equipment: (row.equipment as Partial<Record<string, string>> | null) ?? {},
  });
  const stats = computeStats(classId, row.level, inv.equipment, getItemTemplate);
  const maxHp = Math.max(stats.maxHp, row.hp);
  const maxMp = Math.max(stats.maxMp, row.mp);

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    classId,
    level: row.level,
    exp: row.exp,
    expToNext: expToNextLevel(row.level),
    mapId: row.map_id,
    position: { x: row.pos_x, y: row.pos_y },
    hp: Math.min(row.hp, maxHp),
    mp: Math.min(row.mp, maxMp),
    gold: row.gold,
    inventory: inv,
    stats,
    dirty: false,
  };
}

/** 保存角色到数据库（位置/血量/经验/等级/背包/装备） */
export async function saveCharacter(data: CharacterData): Promise<void> {
  const serialized = serializeInventory(data.inventory);
  await queryOne(
    `UPDATE characters SET
      level = $2, exp = $3, map_id = $4, pos_x = $5, pos_y = $6,
      hp = $7, mp = $8, gold = $9, inventory = $10, equipment = $11,
      last_login = NOW()
     WHERE id = $1`,
    [
      data.id,
      data.level,
      data.exp,
      data.mapId,
      data.position.x,
      data.position.y,
      data.hp,
      data.mp,
      data.gold,
      JSON.stringify({ slots: serialized.slots }),
      JSON.stringify(serialized.equipment),
    ],
  );
  data.dirty = false;
}

/** 给予经验并处理升级，返回是否升级及新等级 */
export function grantExp(data: CharacterData, amount: number): { leveledUp: boolean; newLevel: number } {
  data.exp += amount;
  let leveledUp = false;
  while (data.exp >= data.expToNext) {
    data.exp -= data.expToNext;
    data.level += 1;
    leveledUp = true;
    data.expToNext = expToNextLevel(data.level);
  }
  if (leveledUp) {
    // 重算属性并满血满蓝
    const newStats = computeStats(data.classId, data.level, data.inventory.equipment, getItemTemplate);
    data.stats = newStats;
    data.hp = newStats.maxHp;
    data.mp = newStats.maxMp;
    data.dirty = true;
  }
  return { leveledUp, newLevel: data.level };
}
