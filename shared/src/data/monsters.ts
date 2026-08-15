import { type MonsterTemplate } from '../types.js';

/**
 * 怪物模板 —— 传奇(Mir2) 风格：低级→高级。
 * aggressive=false 表示被动怪（不会主动追击，被攻击后才反击）。
 */

const MONSTERS: MonsterTemplate[] = [
  {
    id: 'chicken',
    name: '鸡',
    level: 1,
    aggressive: false,
    attackRange: 1,
    aggroRange: 0,
    attackInterval: 1500,
    expReward: 10,
    goldDrop: [1, 3],
    dropTable: [{ itemId: 'hp_potion_small', chance: 0.2 }],
    respawnTime: 8000,
    sprite: 'monster_chicken',
    stats: {
      maxHp: 15, maxMp: 0, attack: 3, defense: 0, magicAttack: 0, magicDefense: 0,
      accuracy: 70, evasion: 3, critRate: 0, critDamage: 1.5, moveSpeed: 2.5, attackSpeed: 1, luck: 0,
    },
  },
  {
    id: 'deer',
    name: '鹿',
    level: 2,
    aggressive: false,
    attackRange: 1,
    aggroRange: 0,
    attackInterval: 1400,
    expReward: 18,
    goldDrop: [2, 4],
    dropTable: [{ itemId: 'hp_potion_small', chance: 0.25 }],
    respawnTime: 10000,
    sprite: 'monster_deer',
    stats: {
      maxHp: 25, maxMp: 0, attack: 5, defense: 1, magicAttack: 0, magicDefense: 0,
      accuracy: 75, evasion: 5, critRate: 0, critDamage: 1.5, moveSpeed: 3, attackSpeed: 1, luck: 0,
    },
  },
  {
    id: 'scarecrow',
    name: '稻草人',
    level: 3,
    aggressive: false,
    attackRange: 1,
    aggroRange: 0,
    attackInterval: 1600,
    expReward: 30,
    goldDrop: [3, 6],
    dropTable: [
      { itemId: 'hp_potion', chance: 0.2 },
      { itemId: 'cloth_boots', chance: 0.05 },
    ],
    respawnTime: 12000,
    sprite: 'monster_scarecrow',
    stats: {
      maxHp: 40, maxMp: 0, attack: 7, defense: 2, magicAttack: 0, magicDefense: 0,
      accuracy: 78, evasion: 4, critRate: 0, critDamage: 1.5, moveSpeed: 1.5, attackSpeed: 1, luck: 0,
    },
  },
  {
    id: 'hook_cat',
    name: '多钩猫',
    level: 5,
    aggressive: true,
    attackRange: 1,
    aggroRange: 5,
    attackInterval: 1200,
    expReward: 55,
    goldDrop: [6, 12],
    dropTable: [
      { itemId: 'wood_sword', chance: 0.1 },
      { itemId: 'hp_potion', chance: 0.2 },
    ],
    respawnTime: 15000,
    sprite: 'monster_hookcat',
    stats: {
      maxHp: 70, maxMp: 0, attack: 12, defense: 4, magicAttack: 0, magicDefense: 0,
      accuracy: 80, evasion: 6, critRate: 0.03, critDamage: 1.5, moveSpeed: 3.2, attackSpeed: 1, luck: 0,
    },
  },
  {
    id: 'skeleton',
    name: '骷髅',
    level: 8,
    aggressive: true,
    attackRange: 1,
    aggroRange: 6,
    attackInterval: 1200,
    expReward: 95,
    goldDrop: [10, 20],
    dropTable: [
      { itemId: 'iron_sword', chance: 0.05 },
      { itemId: 'hp_potion', chance: 0.25 },
      { itemId: 'iron_ring', chance: 0.08 },
    ],
    respawnTime: 18000,
    sprite: 'monster_skeleton',
    stats: {
      maxHp: 120, maxMp: 0, attack: 18, defense: 8, magicAttack: 0, magicDefense: 0,
      accuracy: 82, evasion: 8, critRate: 0.04, critDamage: 1.5, moveSpeed: 2.8, attackSpeed: 1, luck: 0,
    },
  },
  {
    id: 'zombie',
    name: '僵尸',
    level: 12,
    aggressive: true,
    attackRange: 1,
    aggroRange: 7,
    attackInterval: 1600,
    expReward: 160,
    goldDrop: [18, 35],
    dropTable: [
      { itemId: 'bronze_sword', chance: 0.03 },
      { itemId: 'hp_potion_large', chance: 0.25 },
      { itemId: 'jade_necklace', chance: 0.05 },
      { itemId: 'magic_necklace', chance: 0.02 },
    ],
    respawnTime: 22000,
    sprite: 'monster_zombie',
    stats: {
      maxHp: 200, maxMp: 0, attack: 26, defense: 12, magicAttack: 0, magicDefense: 0,
      accuracy: 85, evasion: 6, critRate: 0.05, critDamage: 1.6, moveSpeed: 2.2, attackSpeed: 1, luck: 0,
    },
  },
  {
    id: 'red_snake',
    name: '红蛇',
    level: 15,
    aggressive: true,
    attackRange: 1,
    aggroRange: 7,
    attackInterval: 1300,
    expReward: 260,
    goldDrop: [30, 60],
    dropTable: [
      { itemId: 'bronze_sword', chance: 0.15 },
      { itemId: 'jade_necklace', chance: 0.12 },
      { itemId: 'hp_potion_large', chance: 0.35 },
      { itemId: 'power_ring', chance: 0.06 },
    ],
    respawnTime: 30000,
    sprite: 'monster_redsnake',
    stats: {
      maxHp: 320, maxMp: 0, attack: 34, defense: 16, magicAttack: 0, magicDefense: 10,
      accuracy: 88, evasion: 12, critRate: 0.06, critDamage: 1.6, moveSpeed: 3.2, attackSpeed: 1, luck: 0,
    },
  },
  {
    id: 'woma_warrior',
    name: '沃玛勇士',
    level: 18,
    aggressive: true,
    attackRange: 1,
    aggroRange: 8,
    attackInterval: 1400,
    expReward: 380,
    goldDrop: [45, 90],
    dropTable: [
      { itemId: 'asura_sword', chance: 0.08 },
      { itemId: 'heavy_armor', chance: 0.1 },
      { itemId: 'magic_necklace', chance: 0.1 },
      { itemId: 'power_ring', chance: 0.12 },
      { itemId: 'mp_potion_large', chance: 0.3 },
    ],
    respawnTime: 40000,
    sprite: 'monster_woma',
    stats: {
      maxHp: 500, maxMp: 0, attack: 44, defense: 22, magicAttack: 0, magicDefense: 14,
      accuracy: 90, evasion: 10, critRate: 0.08, critDamage: 1.7, moveSpeed: 2.8, attackSpeed: 1, luck: 0,
    },
  },
];

const BY_ID = new Map<string, MonsterTemplate>(MONSTERS.map((m) => [m.id, m]));

/** 按 id 获取怪物模板 */
export function getMonster(id: string): MonsterTemplate | undefined {
  return BY_ID.get(id);
}

/** 全部怪物模板 */
export const MONSTER_TEMPLATES: MonsterTemplate[] = MONSTERS;
