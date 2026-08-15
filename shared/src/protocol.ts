/**
 * 网络协议 - 客户端 <-> 服务端消息类型
 *
 * 设计原则：
 * - 客户端只发"意图"，不直接改状态
 * - 服务端权威，结果通过 state change 或 server->client 消息下发
 */

// ==================== 客户端 -> 服务端 ====================

/** 客户端请求消息类型枚举 */
export enum ClientMsg {
  Move = 'move',           // 移动请求（目标点）
  StopMove = 'stop_move',  // 停止移动
  Attack = 'attack',       // 攻击目标
  UseSkill = 'use_skill',  // 使用技能
  PickupItem = 'pickup',   // 拾取地上物品
  UseItem = 'use_item',    // 使用背包物品
  EquipItem = 'equip',     // 装备物品
  UnequipItem = 'unequip', // 卸下装备
  DropItem = 'drop_item',  // 丢弃物品
  Chat = 'chat',           // 发送聊天
  InteractNpc = 'npc',     // 与 NPC 交互
  Respawn = 'respawn',     // 复活
}

export interface MoveMessage {
  /** 目标网格坐标 */
  x: number;
  y: number;
}

export interface AttackMessage {
  /** 目标实体 ID */
  targetId: string;
}

export interface UseSkillMessage {
  skillId: string;
  /** 可选：目标 ID（单体技能）或目标坐标（范围技能） */
  targetId?: string;
  x?: number;
  y?: number;
}

export interface UseItemMessage {
  itemId: string;
  count?: number;
}

export interface EquipItemMessage {
  itemId: string;
}

export interface ChatMessage {
  channel: 'world' | 'map' | 'private' | 'guild';
  /** 私聊目标 */
  to?: string;
  text: string;
}

export interface InteractNpcMessage {
  npcId: string;
  /** 选项 ID（用于对话选项） */
  optionId?: string;
}

// ==================== 服务端 -> 客户端 ====================

/** 服务端推送消息类型枚举 */
export enum ServerMsg {
  Damage = 'damage',           // 伤害飘字
  ExpGain = 'exp_gain',         // 经验获得
  LevelUp = 'level_up',        // 升级
  ItemDrop = 'item_drop',      // 物品掉落
  PickupResult = 'pickup_result', // 拾取结果
  SystemMessage = 'system',    // 系统消息
  ChatMessage = 'chat_msg',    // 聊天消息
  Notification = 'notify',     // 通知
  Death = 'death',             // 死亡
  RespawnResult = 'respawn_result',
  MapInit = 'map_init',          // 进入地图时下发瓦片数据
  InventorySnapshot = 'inv_snap', // 背包/装备完整快照（仅本机）
  InventoryUpdate = 'inv_update', // 背包局部变更（仅本机）
  Error = 'error',
}

export interface DamageMessage {
  targetId: string;
  sourceId: string;
  amount: number;
  type: 'physical' | 'magic' | 'true';
  crit: boolean;
  /** 是否由技能造成（客户端用于区分飘字颜色） */
  skill?: boolean;
  /** 受击方剩余 HP，便于客户端立即刷新 */
  targetHp: number;
}

export interface ExpGainMessage {
  amount: number;
  currentExp: number;
  expToNext: number;
}

export interface LevelUpMessage {
  newLevel: number;
}

export interface ItemDropMessage {
  dropId: string;     // 地上物品实例 ID
  itemId: string;
  count: number;
  x: number;
  y: number;
  sourceEntityId?: string;
}

export interface PickupResultMessage {
  ok: boolean;
  itemId: string;
  count: number;
  reason?: string;
}

export interface ChatBroadcastMessage {
  channel: 'world' | 'map' | 'private' | 'guild';
  from: string;
  fromName: string;
  text: string;
  timestamp: number;
}

export interface SystemMessage {
  text: string;
  level: 'info' | 'warn' | 'error';
}

export interface ErrorMessage {
  code: string;
  message: string;
}

/** 地图初始化：进入地图时一次性下发瓦片数据 */
export interface MapInitMessage {
  mapId: string;
  mapName: string;
  width: number;
  height: number;
  /** 瓦片数据（数字数组） */
  tiles: number[];
  /** 出口信息 */
  exits: Array<{
    position: { x: number; y: number };
    targetMapId: string;
    targetPosition: { x: number; y: number };
  }>;
}

/** 背包槽 */
export interface InventorySlotData {
  index: number;
  itemId: string;
  count: number;
}

/** 装备槽 */
export interface EquipSlotData {
  slot: string;
  itemId: string;
}

/** 背包/装备完整快照 */
export interface InventorySnapshotMessage {
  gold: number;
  slots: InventorySlotData[];
  equipment: EquipSlotData[];
}

/** 背包局部变更（增量更新） */
export interface InventoryUpdateMessage {
  /** 变更类型 */
  op: 'add' | 'remove' | 'update' | 'gold' | 'equip' | 'unequip';
  /** affected slot index (for add/remove/update) */
  index?: number;
  itemId?: string;
  count?: number;
  /** gold 变更 */
  gold?: number;
  /** 装备槽变更 */
  slot?: string;
}


// ==================== REST API 协议 ====================

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

export interface CharacterInfo {
  id: string;
  name: string;
  classId: import('./types.js').PlayerClass;
  level: number;
  /** 最近登录地图 */
  mapId: string;
}

export interface CreateCharacterRequest {
  name: string;
  classId: import('./types.js').PlayerClass;
}

export interface CharacterListResponse {
  characters: CharacterInfo[];
}
