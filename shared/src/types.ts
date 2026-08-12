/**
 * 共享数据模型 - 前后端通用
 */

/** 玩家职业 */
export enum PlayerClass {
  Warrior = 'warrior',   // 战士：高血量、近战
  Mage = 'mage',          // 法师：高魔攻、低血量
  Taoist = 'taoist',       // 道士：召唤、辅助
}

/** 实体方向（8 方向） */
export enum Direction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
  UpLeft = 'up_left',
  UpRight = 'up_right',
  DownLeft = 'down_left',
  DownRight = 'down_right',
}

/** 实体状态机 */
export enum EntityState {
  Idle = 'idle',
  Moving = 'moving',
  Attacking = 'attacking',
  Dead = 'dead',
}

/** 物品类型 */
export enum ItemType {
  Weapon = 'weapon',
  Armor = 'armor',
  Helmet = 'helmet',
  Necklace = 'necklace',
  Ring = 'ring',
  Boots = 'boots',
  Belt = 'belt',
  Consumable = 'consumable',
  Material = 'material',
  Currency = 'currency',
}

/** 装备槽位 */
export enum EquipSlot {
  Weapon = 'weapon',
  Armor = 'armor',
  Helmet = 'helmet',
  Necklace = 'necklace',
  RingLeft = 'ring_left',
  RingRight = 'ring_right',
  Boots = 'boots',
  Belt = 'belt',
}

/** 品质 */
export enum Rarity {
  Common = 'common',
  Uncommon = 'uncommon',
  Rare = 'rare',
  Epic = 'epic',
  Legendary = 'legendary',
}

/** 属性 */
export interface Stats {
  maxHp: number;
  maxMp: number;
  attack: number;      // 物攻
  defense: number;     // 物防
  magicAttack: number; // 魔攻
  magicDefense: number; // 魔防
  accuracy: number;    // 命中
  evasion: number;     // 闪避
  critRate: number;    // 暴击率 0-1
  critDamage: number;  // 暴击倍率
  moveSpeed: number;   // 移动速度 (格/秒)
  attackSpeed: number; // 攻击速度 (次/秒)
  luck: number;        // 幸运值（影响掉落）
}

/** 物品模板 */
export interface ItemTemplate {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  /** 装备才需要：占用槽位 */
  slot?: EquipSlot;
  /** 装备属性加成 */
  statsBonus?: Partial<Stats>;
  /** 消耗品：使用效果 */
  useEffect?: {
    hp?: number;
    mp?: number;
  };
  /** 堆叠上限 */
  stack: number;
  /** 是否可交易 */
  tradeable: boolean;
  /** 出售价格（金币） */
  sellPrice: number;
  /** 模型/贴图 key */
  icon: string;
  /** 等级需求 */
  requiredLevel: number;
  /** 描述 */
  description: string;
}

/** 怪物模板 */
export interface MonsterTemplate {
  id: string;
  name: string;
  level: number;
  stats: Stats;
  /** 攻击范围（格） */
  attackRange: number;
  /** 视野范围（格） */
  aggroRange: number;
  /** 攻击间隔（毫秒） */
  attackInterval: number;
  /** 经验奖励 */
  expReward: number;
  /** 金币掉落范围 */
  goldDrop: [number, number];
  /** 掉落表 [{itemId, chance}] */
  dropTable: Array<{ itemId: string; chance: number }>;
  /** 复活时间（毫秒） */
  respawnTime: number;
  /** 贴图 key */
  sprite: string;
}

/** 地图瓦片类型 */
export enum TileType {
  Empty = 0,
  Floor = 1,
  Wall = 2,
  Water = 3,
  Tree = 4,
  Door = 5,
}

/** 2D 坐标（网格） */
export interface Vec2 {
  x: number;
  y: number;
}

/** 地图定义 */
export interface MapDefinition {
  id: string;
  name: string;
  width: number;   // 网格宽
  height: number;  // 网格高
  /** 瓦片数据，height 行 width 列，行优先 */
  tiles: TileType[];
  /** 怪物刷新点 */
  monsterSpawns: Array<{
    monsterId: string;
    position: Vec2;
    count: number;
  }>;
  /** NPC 列表 */
  npcs: Array<{
    id: string;
    name: string;
    position: Vec2;
    dialog: string;
  }>;
  /** 出生点 */
  spawnPoint: Vec2;
  /** 出口（通往其他地图） */
  exits: Array<{
    position: Vec2;
    targetMapId: string;
    targetPosition: Vec2;
  }>;
}

/** 玩家公共信息（可见给其他玩家） */
export interface PlayerPublicInfo {
  id: string;
  name: string;
  classId: PlayerClass;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
}

/** 网格坐标（同步状态用，对应服务端 Vec2State） */
export interface Vec2StateLike {
  x: number;
  y: number;
}

/** 玩家同步状态（客户端视角，对应服务端 PlayerState） */
export interface PlayerState {
  id: string;
  name: string;
  classId: string;
  level: number;
  exp: number;
  expToNext: number;
  position: Vec2StateLike;
  direction: string;
  state: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  magicAttack: number;
  magicDefense: number;
  moveSpeed: number;
  attackSpeed: number;
  gold: number;
  targetId: string;
}

/** 怪物同步状态（客户端视角，对应服务端 MonsterState） */
export interface MonsterState {
  id: string;
  templateId: string;
  name: string;
  level: number;
  position: Vec2StateLike;
  spawnPosition: Vec2StateLike;
  direction: string;
  state: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  targetId: string;
  deadAt: number;
}

/** 掉落物同步状态（客户端视角，对应服务端 ItemDropState） */
export interface ItemDropState {
  id: string;
  itemId: string;
  count: number;
  position: Vec2StateLike;
}

/** NPC 同步状态（客户端视角，对应服务端 NpcState） */
export interface NpcState {
  id: string;
  name: string;
  position: Vec2StateLike;
  dialog: string;
}
