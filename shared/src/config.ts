/**
 * 游戏平衡配置 - 前后端共享
 */
import { PlayerClass, type Stats } from './types.js';

/** 服务端默认端口 */
export const SERVER_PORT = 2567;

/** 客户端默认端口 */
export const CLIENT_PORT = 5173;

/** 网格大小（像素） */
export const TILE_SIZE = 32;

/** 服务端 tick 频率 (Hz) */
export const TICK_RATE = 20;

/** 客户端插值缓冲（毫秒） */
export const INTERPOLATION_DELAY = 100;

/** 心跳间隔（毫秒） */
export const HEARTBEAT_INTERVAL = 5000;

/** 断线超时（毫秒） */
export const CONNECTION_TIMEOUT = 30000;

/** 视野范围（格数），AOI 兴趣范围 */
export const VIEW_RANGE = 12;

/** 单房间最大玩家 */
export const MAX_PLAYERS_PER_ROOM = 100;

/** 移动请求速率限制（次/秒） */
export const MOVE_RATE_LIMIT = 10;

/** 攻击请求速率限制（次/秒） */
export const ATTACK_RATE_LIMIT = 4;

/** 背包格数 */
export const INVENTORY_SIZE = 40;

/** 最大角色数 */
export const MAX_CHARACTERS_PER_USER = 3;

/** 各职业基础属性（1 级） */
export const CLASS_BASE_STATS: Record<PlayerClass, Stats> = {
  [PlayerClass.Warrior]: {
    maxHp: 80,
    maxMp: 20,
    attack: 12,
    defense: 8,
    magicAttack: 2,
    magicDefense: 4,
    accuracy: 80,
    evasion: 5,
    critRate: 0.05,
    critDamage: 1.5,
    moveSpeed: 4,
    attackSpeed: 1.0,
    luck: 0,
  },
  [PlayerClass.Mage]: {
    maxHp: 40,
    maxMp: 80,
    attack: 4,
    defense: 3,
    magicAttack: 14,
    magicDefense: 10,
    accuracy: 85,
    evasion: 8,
    critRate: 0.08,
    critDamage: 1.6,
    moveSpeed: 4,
    attackSpeed: 0.8,
    luck: 0,
  },
  [PlayerClass.Taoist]: {
    maxHp: 55,
    maxMp: 55,
    attack: 7,
    defense: 5,
    magicAttack: 8,
    magicDefense: 7,
    accuracy: 80,
    evasion: 7,
    critRate: 0.06,
    critDamage: 1.5,
    moveSpeed: 4,
    attackSpeed: 0.9,
    luck: 0,
  },
};

/** 每级属性成长系数 */
export const CLASS_GROWTH: Record<PlayerClass, Partial<Stats>> = {
  [PlayerClass.Warrior]: {
    maxHp: 12, maxMp: 2, attack: 2, defense: 1.5,
  },
  [PlayerClass.Mage]: {
    maxHp: 5, maxMp: 12, magicAttack: 2.5, magicDefense: 1,
  },
  [PlayerClass.Taoist]: {
    maxHp: 8, maxMp: 8, attack: 1, magicAttack: 1.2, defense: 0.8,
  },
};

/** 升级所需经验公式：expToNext(level) = floor(80 * level^1.5) */
export function expToNextLevel(level: number): number {
  return Math.floor(80 * Math.pow(level, 1.5));
}

/** 死亡惩罚：掉落当前经验 5% */
export const DEATH_EXP_PENALTY = 0.05;

/** 复活点（新手村） */
export const REVIVE_POINT = { x: 25, y: 25 };

/** 经验获取距离衰减（同屏内不衰减，超出按距离衰减） */
export const EXP_SHARE_RANGE = 8;
