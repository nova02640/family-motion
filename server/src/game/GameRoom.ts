import { Room, Client } from '@colyseus/core';
import { nanoid } from 'nanoid';
import {
  ClientMsg,
  ServerMsg,
  Direction,
  TileType,
  MOVE_RATE_LIMIT,
  ATTACK_RATE_LIMIT,
  INTERPOLATION_DELAY,
  VIEW_RANGE,
  type Vec2,
  type MapDefinition,
  type EquipSlot,
  type InventorySlotData,
  type EquipSlotData,
  type ChatMessage as ChatMsg,
  type MoveMessage,
  type AttackMessage,
  type UseItemMessage,
  type EquipItemMessage,
  type InteractNpcMessage,
  type InventorySnapshotMessage,
  type InventoryUpdateMessage,
} from '@mir/shared';
import { GameState } from './state/GameState.js';
import { PlayerState } from './state/PlayerState.js';
import { ItemDropState } from './state/ItemDropState.js';
import { NpcState } from './state/NpcState.js';
import { Vec2State } from './state/Vec2.js';
import { getMap, isWalkable } from './data/maps.js';
import { getMonster } from './data/monsters.js';
import { getItem } from './data/items.js';
import { findPath } from './pathfinding/astar.js';
import { calcDamage, calcDeathExpPenalty, type CombatActor } from './combat/combat.js';
import {
  loadCharacter,
  saveCharacter,
  grantExp,
  type CharacterData,
} from './persistence.js';
import {
  addItem,
  removeSlot,
  useConsumable,
  equipItem as equipInv,
  unequipItem as unequipInv,
  getEquippedItems,
  type PlayerInventory,
} from './inventory.js';
import { computeStats } from './stats.js';
import { verifyToken } from '../auth/jwt.js';
import {
  tickMonsters,
  onMonsterDeath,
  spawnMonster,
  pickSpawnAround,
  type MonsterRuntime,
} from './systems/MonsterSystem.js';

/** 房间内玩家运行时数据 */
export interface RoomPlayer {
  client: Client;
  data: CharacterData;
  player: PlayerState;
  path: Vec2[];
  lastMoveRequestAt: number;
  lastAttackAt: number;
  attackTargetId: string;
  /** 标记需要保存 */
  lastSaveAt: number;
}

/** 地图实例房间 */
export class GameRoom extends Room<GameState> {
  maxClients = 100;

  /** 当前地图定义 */
  map!: MapDefinition;
  /** 瓦片数据 */
  tiles!: TileType[];
  mapWidth = 0;
  mapHeight = 0;

  /** 运行时数据（不进 state） */
  players = new Map<string, RoomPlayer>();
  monsters = new Map<string, MonsterRuntime>();

  /** 全局聊天记录（最近 N 条） */
  chatHistory: Array<{
    channel: ChatMsg['channel'];
    from: string;
    fromName: string;
    text: string;
    timestamp: number;
  }> = [];
  private lastSaveAllAt = Date.now();
  private readonly SAVE_INTERVAL_MS = 30000; // 30 秒自动存档

  /** Colyseus 鉴权：从 query 中验证 token */
  async onAuth(client: Client, options: { token?: string; characterId?: string }) {
    if (!options.token) return false;
    try {
      const payload = verifyToken(options.token);
      return { userId: payload.sub, username: payload.username };
    } catch {
      return false;
    }
  }

  /** 房间创建：加载地图，生成怪物/NPC */
  onCreate(options: { mapId?: string }) {
    const mapId = options.mapId ?? 'village';
    const map = getMap(mapId);
    if (!map) throw new Error(`Map not found: ${mapId}`);

    this.map = map;
    this.tiles = [...map.tiles];
    this.mapWidth = map.width;
    this.mapHeight = map.height;
    this.setState(new GameState());

    this.state.mapId = map.id;
    this.state.mapName = map.name;
    this.state.width = map.width;
    this.state.height = map.height;

    // 生成 NPC
    for (const npc of map.npcs) {
      const n = new NpcState();
      n.id = npc.id;
      n.name = npc.name;
      n.position.set(npc.position.x, npc.position.y);
      n.dialog = npc.dialog;
      this.state.npcs.set(npc.id, n);
    }

    // 生成怪物
    for (const spawn of map.monsterSpawns) {
      const tpl = getMonster(spawn.monsterId);
      if (!tpl) continue;
      for (let i = 0; i < spawn.count; i++) {
        const pos = pickSpawnAround(spawn.position, 3);
        // 确保出生点可达
        if (!isWalkable(this.tiles, this.mapWidth, this.mapHeight, pos.x, pos.y)) {
          pos.x = spawn.position.x;
          pos.y = spawn.position.y;
        }
        const rt = spawnMonster(spawn.monsterId, pos);
        this.monsters.set(rt.state.id, rt);
        this.state.monsters.set(rt.state.id, rt.state);
      }
    }

    this.registerMessageHandlers();
    this.setSimulationInterval((dt) => this.tick(dt), 1000 / 20);
    console.log(`[GameRoom:${mapId}] created with ${this.monsters.size} monsters`);
  }

  /** 玩家加入 */
  async onJoin(client: Client, options: { characterId?: string }) {
    const auth = (client as unknown as { auth: { userId: string } }).auth;
    if (!options.characterId) {
      throw new Error('characterId required');
    }
    const data = await loadCharacter(options.characterId, auth.userId);
    if (!data) {
      throw new Error('character not found or not owned by user');
    }

    // 若角色所在地图与本房间不同，传送到出生点
    if (data.mapId !== this.map.id) {
      data.mapId = this.map.id;
      data.position = { ...this.map.spawnPoint };
    }
    // 确保位置可达
    if (!isWalkable(this.tiles, this.mapWidth, this.mapHeight, data.position.x, data.position.y)) {
      data.position = { ...this.map.spawnPoint };
    }

    const player = new PlayerState();
    player.id = data.id;
    player.name = data.name;
    player.classId = data.classId;
    player.level = data.level;
    player.exp = data.exp;
    player.expToNext = data.expToNext;
    player.position.set(data.position.x, data.position.y);
    player.direction = 'down';
    player.state = 'idle';
    player.hp = data.hp;
    player.maxHp = data.stats.maxHp;
    player.mp = data.mp;
    player.maxMp = data.stats.maxMp;
    player.attack = data.stats.attack;
    player.defense = data.stats.defense;
    player.magicAttack = data.stats.magicAttack;
    player.magicDefense = data.stats.magicDefense;
    player.moveSpeed = data.stats.moveSpeed;
    player.attackSpeed = data.stats.attackSpeed;
    player.gold = data.gold;
    this.state.players.set(client.sessionId, player);

    const rp: RoomPlayer = {
      client,
      data,
      player,
      path: [],
      lastMoveRequestAt: 0,
      lastAttackAt: 0,
      attackTargetId: '',
      lastSaveAt: Date.now(),
    };
    this.players.set(client.sessionId, rp);

    // 推送地图初始化（瓦片数据）
    client.send(ServerMsg.MapInit, {
      mapId: this.map.id,
      mapName: this.map.name,
      width: this.map.width,
      height: this.map.height,
      tiles: this.tiles,
      exits: this.map.exits,
    });

    // 推送背包快照
    this.sendInventorySnapshot(rp);
    // 推送最近聊天
    for (const msg of this.chatHistory.slice(-30)) {
      client.send(ServerMsg.ChatMessage, {
        channel: msg.channel,
        from: msg.from,
        fromName: msg.fromName,
        text: msg.text,
        timestamp: msg.timestamp,
      });
    }

    this.broadcastSystem(`${data.name} 加入了游戏`);
    console.log(`[GameRoom:${this.map.id}] ${data.name} joined (${client.sessionId})`);
  }

  onLeave(client: Client) {
    const rp = this.players.get(client.sessionId);
    if (!rp) return;
    // 保存角色
    rp.data.hp = Math.max(0, rp.player.hp);
    rp.data.mp = Math.max(0, rp.player.mp);
    rp.data.position = { x: Math.floor(rp.player.position.x), y: Math.floor(rp.player.position.y) };
    saveCharacter(rp.data).catch((err) => console.error('save on leave failed:', err));
    this.state.players.delete(client.sessionId);
    this.players.delete(client.sessionId);
    this.broadcastSystem(`${rp.data.name} 离开了游戏`);
  }

  onDispose() {
    console.log(`[GameRoom:${this.map.id}] disposed`);
  }

  // ==================== 消息处理 ====================

  private registerMessageHandlers() {
    this.onMessage(ClientMsg.Move, (client, msg: MoveMessage) => this.handleMove(client, msg));
    this.onMessage(ClientMsg.Attack, (client, msg: AttackMessage) => this.handleAttack(client, msg));
    this.onMessage(ClientMsg.PickupItem, (client, msg: { dropId?: string }) => this.handlePickup(client, msg));
    this.onMessage(ClientMsg.UseItem, (client, msg: UseItemMessage) => this.handleUseItem(client, msg));
    this.onMessage(ClientMsg.EquipItem, (client, msg: EquipItemMessage) => this.handleEquip(client, msg));
    this.onMessage(ClientMsg.UnequipItem, (client, msg: { slot: EquipSlot }) => this.handleUnequip(client, msg));
    this.onMessage(ClientMsg.DropItem, (client, msg: { index: number; count?: number }) => this.handleDropItem(client, msg));
    this.onMessage(ClientMsg.Chat, (client, msg: ChatMsg) => this.handleChat(client, msg));
    this.onMessage(ClientMsg.InteractNpc, (client, msg: InteractNpcMessage) => this.handleNpcInteract(client, msg));
    this.onMessage(ClientMsg.Respawn, (client) => this.handleRespawn(client));
    this.onMessage('ping', (client) => client.send('pong', { t: Date.now() }));
  }

  private handleMove(client: Client, msg: MoveMessage) {
    const rp = this.players.get(client.sessionId);
    if (!rp || rp.data.hp <= 0) return;

    const now = Date.now();
    const minInterval = 1000 / MOVE_RATE_LIMIT;
    if (now - rp.lastMoveRequestAt < minInterval) return; // 限流
    rp.lastMoveRequestAt = now;

    const tx = Math.floor(msg.x);
    const ty = Math.floor(msg.y);
    if (!isWalkable(this.tiles, this.mapWidth, this.mapHeight, tx, ty)) return;

    const startX = Math.floor(rp.player.position.x);
    const startY = Math.floor(rp.player.position.y);
    const path = findPath(this.tiles, this.mapWidth, this.mapHeight, { x: startX, y: startY }, { x: tx, y: ty });
    rp.path = path;
    rp.player.state = path.length > 0 ? 'moving' : 'idle';
  }

  private handleAttack(client: Client, msg: AttackMessage) {
    const rp = this.players.get(client.sessionId);
    if (!rp || rp.data.hp <= 0) return;
    const now = Date.now();
    if (now - rp.lastAttackAt < 1000 / ATTACK_RATE_LIMIT) return;
    // 设置目标（实际攻击在 tick 中执行，需要等到达射程）
    rp.attackTargetId = msg.targetId;
    rp.player.targetId = msg.targetId;
  }

  private handlePickup(client: Client, msg: { dropId?: string }) {
    const rp = this.players.get(client.sessionId);
    if (!rp || rp.data.hp <= 0) return;
    const px = Math.floor(rp.player.position.x);
    const py = Math.floor(rp.player.position.y);

    let target: ItemDropState | undefined;
    if (msg.dropId) {
      target = this.state.drops.get(msg.dropId);
    } else {
      // 找最近的（2 格内）
      let bestDist = 4;
      for (const [, d] of this.state.drops) {
        const dist = Math.max(Math.abs(d.position.x - px), Math.abs(d.position.y - py));
        if (dist < bestDist) { bestDist = dist; target = d; }
      }
    }
    if (!target) {
      rp.client.send(ServerMsg.PickupResult, { ok: false, itemId: '', count: 0, reason: '附近没有可拾取的物品' });
      return;
    }
    const dist = Math.max(Math.abs(target.position.x - px), Math.abs(target.position.y - py));
    if (dist > 2) {
      rp.client.send(ServerMsg.PickupResult, { ok: false, itemId: target.itemId, count: 0, reason: '距离太远' });
      return;
    }

    // 加入背包
    if (target.itemId === 'gold') {
      rp.data.inventory.gold += target.count;
      this.sendInventoryUpdate(rp, { op: 'gold', gold: rp.data.inventory.gold });
    } else {
      const added = addItem(rp.data.inventory, target.itemId, target.count);
      if (added <= 0) {
        rp.client.send(ServerMsg.PickupResult, { ok: false, itemId: target.itemId, count: 0, reason: '背包已满' });
        return;
      }
      this.sendInventorySnapshot(rp); // 简化：发完整快照
    }
    rp.data.dirty = true;
    this.state.drops.delete(target.id);
    rp.client.send(ServerMsg.PickupResult, { ok: true, itemId: target.itemId, count: target.count });
  }

  private handleUseItem(client: Client, msg: UseItemMessage) {
    const rp = this.players.get(client.sessionId);
    if (!rp || rp.data.hp <= 0) return;
    const slot = rp.data.inventory.slots.find((s) => s?.itemId === msg.itemId);
    if (!slot) {
      rp.client.send(ServerMsg.Error, { code: 'NOT_FOUND', message: '物品不存在' });
      return;
    }
    const result = useConsumable(rp.data.inventory, slot.index);
    if (!result.ok) {
      rp.client.send(ServerMsg.Error, { code: 'NOT_USABLE', message: '该物品无法使用' });
      return;
    }
    if (result.hp > 0) {
      rp.data.hp = Math.min(rp.data.stats.maxHp, rp.data.hp + result.hp);
      rp.player.hp = rp.data.hp;
    }
    if (result.mp > 0) {
      rp.data.mp = Math.min(rp.data.stats.maxMp, rp.data.mp + result.mp);
      rp.player.mp = rp.data.mp;
    }
    rp.data.dirty = true;
    this.sendInventorySnapshot(rp);
  }

  private handleEquip(client: Client, msg: EquipItemMessage) {
    const rp = this.players.get(client.sessionId);
    if (!rp) return;
    const slot = rp.data.inventory.slots.find((s) => s?.itemId === msg.itemId);
    if (!slot) {
      rp.client.send(ServerMsg.Error, { code: 'NOT_FOUND', message: '物品不存在' });
      return;
    }
    const result = equipInv(rp.data.inventory, slot.index);
    if (!result.ok) {
      rp.client.send(ServerMsg.Error, { code: 'EQUIP_FAILED', message: result.reason ?? '装备失败' });
      return;
    }
    this.recomputePlayerStats(rp);
    rp.data.dirty = true;
    this.sendInventorySnapshot(rp);
  }

  private handleUnequip(client: Client, msg: { slot: EquipSlot }) {
    const rp = this.players.get(client.sessionId);
    if (!rp) return;
    const result = unequipInv(rp.data.inventory, msg.slot);
    if (!result.ok) {
      rp.client.send(ServerMsg.Error, { code: 'UNEQUIP_FAILED', message: result.reason ?? '卸下失败' });
      return;
    }
    this.recomputePlayerStats(rp);
    rp.data.dirty = true;
    this.sendInventorySnapshot(rp);
  }

  private handleDropItem(client: Client, msg: { index: number; count?: number }) {
    const rp = this.players.get(client.sessionId);
    if (!rp) return;
    const slot = rp.data.inventory.slots[msg.index];
    if (!slot) return;
    const count = Math.min(msg.count ?? 1, slot.count);
    const tpl = getItem(slot.itemId);
    if (!tpl) return;
    if (!tpl.tradeable) {
      rp.client.send(ServerMsg.Error, { code: 'NOT_TRADEABLE', message: '该物品不可丢弃' });
      return;
    }
    removeSlot(rp.data.inventory, msg.index, count);
    // 在玩家位置生成掉落物
    this.spawnDrop({
      dropId: `drop_${nanoid(8)}`,
      itemId: slot.itemId,
      count,
      x: Math.floor(rp.player.position.x),
      y: Math.floor(rp.player.position.y),
    });
    rp.data.dirty = true;
    this.sendInventorySnapshot(rp);
  }

  private handleChat(client: Client, msg: ChatMsg) {
    const rp = this.players.get(client.sessionId);
    if (!rp) return;
    const text = (msg.text ?? '').slice(0, 200).trim();
    if (!text) return;
    const record = {
      channel: msg.channel,
      from: rp.player.id,
      fromName: rp.data.name,
      text,
      timestamp: Date.now(),
    };
    this.chatHistory.push(record);
    if (this.chatHistory.length > 100) this.chatHistory.shift();
    if (msg.channel === 'world') {
      // 广播到所有玩家
      this.broadcast(ServerMsg.ChatMessage, record);
    } else {
      // map/默认：本房间广播
      this.broadcast(ServerMsg.ChatMessage, record);
    }
  }

  private handleNpcInteract(client: Client, msg: InteractNpcMessage) {
    const rp = this.players.get(client.sessionId);
    if (!rp) return;
    const npc = this.state.npcs.get(msg.npcId);
    if (!npc) return;
    const dist = Math.max(
      Math.abs(npc.position.x - rp.player.position.x),
      Math.abs(npc.position.y - rp.player.position.y),
    );
    if (dist > 3) {
      rp.client.send(ServerMsg.Error, { code: 'TOO_FAR', message: '距离 NPC 太远' });
      return;
    }
    // MVP：仅返回对话文本
    rp.client.send(ServerMsg.Notification, { text: `[${npc.name}] ${npc.dialog}`, level: 'info' });
  }

  private handleRespawn(client: Client) {
    const rp = this.players.get(client.sessionId);
    if (!rp || rp.data.hp > 0) return;
    rp.data.hp = rp.data.stats.maxHp;
    rp.data.mp = rp.data.stats.maxMp;
    rp.data.position = { ...this.map.spawnPoint };
    rp.player.hp = rp.data.hp;
    rp.player.mp = rp.data.mp;
    rp.player.position.set(rp.data.position.x, rp.data.position.y);
    rp.player.state = 'idle';
    rp.path = [];
    rp.attackTargetId = '';
    rp.player.targetId = '';
    rp.data.dirty = true;
    rp.client.send(ServerMsg.RespawnResult, { ok: true, x: rp.data.position.x, y: rp.data.position.y });
    this.broadcastSystem(`${rp.data.name} 复活了`);
  }

  // ==================== 服务端逻辑（供 MonsterSystem 调用） ====================

  /** 生成掉落物并广播 */
  spawnDrop(opts: { dropId: string; itemId: string; count: number; x: number; y: number; sourceEntityId?: string }) {
    const d = new ItemDropState();
    d.id = opts.dropId;
    d.itemId = opts.itemId;
    d.count = opts.count;
    d.position.set(opts.x, opts.y);
    this.state.drops.set(opts.dropId, d);
    this.broadcast(ServerMsg.ItemDrop, {
      dropId: opts.dropId,
      itemId: opts.itemId,
      count: opts.count,
      x: opts.x,
      y: opts.y,
      sourceEntityId: opts.sourceEntityId,
    });
  }

  /** 广播伤害飘字 */
  broadcastDamage(targetId: string, sourceId: string, amount: number, type: 'physical' | 'magic' | 'true', crit: boolean, targetHp: number) {
    this.broadcast(ServerMsg.Damage, { targetId, sourceId, amount, type, crit, targetHp });
  }

  /** 给予玩家经验，处理升级 */
  grantPlayerExp(rp: RoomPlayer, amount: number) {
    const { leveledUp, newLevel } = grantExp(rp.data, amount);
    rp.player.exp = rp.data.exp;
    rp.player.expToNext = rp.data.expToNext;
    rp.player.level = rp.data.level;
    if (leveledUp) {
      rp.player.maxHp = rp.data.stats.maxHp;
      rp.player.maxMp = rp.data.stats.maxMp;
      rp.player.hp = rp.data.hp;
      rp.player.mp = rp.data.mp;
      rp.player.attack = rp.data.stats.attack;
      rp.player.defense = rp.data.stats.defense;
      rp.player.magicAttack = rp.data.stats.magicAttack;
      rp.player.magicDefense = rp.data.stats.magicDefense;
      rp.client.send(ServerMsg.LevelUp, { newLevel });
      this.broadcastSystem(`${rp.data.name} 升到了 ${newLevel} 级！`);
    }
    rp.client.send(ServerMsg.ExpGain, {
      amount,
      currentExp: rp.data.exp,
      expToNext: rp.data.expToNext,
    });
  }

  /** 玩家死亡 */
  onPlayerDeath(rp: RoomPlayer, killerId: string) {
    const penalty = calcDeathExpPenalty(rp.data.exp, 0.05);
    rp.data.exp = Math.max(0, rp.data.exp - penalty);
    rp.player.exp = rp.data.exp;
    rp.player.state = 'dead';
    rp.player.hp = 0;
    rp.path = [];
    rp.attackTargetId = '';
    rp.player.targetId = '';
    rp.data.dirty = true;
    rp.client.send(ServerMsg.Death, { killerId });
    this.broadcastSystem(`${rp.data.name} 被击败了`);
  }

  /** 系统消息广播 */
  broadcastSystem(text: string, level: 'info' | 'warn' | 'error' = 'info') {
    this.broadcast(ServerMsg.SystemMessage, { text, level });
  }

  /** 重算玩家属性（装备变更后） */
  recomputePlayerStats(rp: RoomPlayer) {
    const newStats = computeStats(rp.data.classId, rp.data.level, rp.data.inventory.equipment, getItem);
    rp.data.stats = newStats;
    rp.player.maxHp = newStats.maxHp;
    rp.player.maxMp = newStats.maxMp;
    rp.player.attack = newStats.attack;
    rp.player.defense = newStats.defense;
    rp.player.magicAttack = newStats.magicAttack;
    rp.player.magicDefense = newStats.magicDefense;
    rp.player.moveSpeed = newStats.moveSpeed;
    rp.player.attackSpeed = newStats.attackSpeed;
    // 当前 HP/MP 不超过新上限
    rp.data.hp = Math.min(rp.data.hp, newStats.maxHp);
    rp.data.mp = Math.min(rp.data.mp, newStats.maxMp);
    rp.player.hp = rp.data.hp;
    rp.player.mp = rp.data.mp;
  }

  /** 推送背包/装备完整快照 */
  sendInventorySnapshot(rp: RoomPlayer) {
    const inv = rp.data.inventory;
    const slots: InventorySlotData[] = [];
    for (let i = 0; i < inv.slots.length; i++) {
      const s = inv.slots[i];
      if (s) slots.push({ index: s.index, itemId: s.itemId, count: s.count });
    }
    const equipment: EquipSlotData[] = [];
    for (const e of getEquippedItems(inv)) {
      equipment.push({ slot: e.slot, itemId: e.itemId });
    }
    const msg: InventorySnapshotMessage = { gold: inv.gold, slots, equipment };
    rp.client.send(ServerMsg.InventorySnapshot, msg);
  }

  /** 推送背包局部变更 */
  sendInventoryUpdate(rp: RoomPlayer, msg: InventoryUpdateMessage) {
    rp.client.send(ServerMsg.InventoryUpdate, msg);
  }

  // ==================== 主循环 ====================

  private tick(dtMs: number) {
    const now = Date.now();
    // 1. 玩家移动 / 自动攻击
    for (const [, rp] of this.players) {
      if (rp.data.hp <= 0) continue;
      this.tickPlayerMovement(rp, dtMs);
      this.tickPlayerAttack(rp, now);
      this.tickCheckMapExit(rp);
    }
    // 2. 怪物 AI
    tickMonsters(this, dtMs);
    // 3. 周期存档
    if (now - this.lastSaveAllAt > this.SAVE_INTERVAL_MS) {
      this.lastSaveAllAt = now;
      this.saveAll();
    }
  }

  private tickPlayerMovement(rp: RoomPlayer, dtMs: number) {
    if (rp.path.length === 0) {
      if (rp.player.state === 'moving') rp.player.state = 'idle';
      return;
    }
    const speed = rp.data.stats.moveSpeed;
    const step = (speed * dtMs) / 1000;
    let remaining = step;
    while (remaining > 0 && rp.path.length > 0) {
      const next = rp.path[0];
      const dx = next.x - rp.player.position.x;
      const dy = next.y - rp.player.position.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= remaining) {
        rp.player.position.set(next.x, next.y);
        rp.path.shift();
        remaining -= dist;
      } else {
        rp.player.position.set(
          rp.player.position.x + (dx / dist) * remaining,
          rp.player.position.y + (dy / dist) * remaining,
        );
        remaining = 0;
      }
      rp.player.direction = this.dirFromDelta(dx, dy);
      rp.player.state = 'moving';
    }
    if (rp.path.length === 0) {
      rp.player.state = 'idle';
    }
  }

  private tickPlayerAttack(rp: RoomPlayer, now: number) {
    if (!rp.attackTargetId) return;
    const rt = this.monsters.get(rp.attackTargetId);
    if (!rt || rt.state.deadAt > 0) {
      rp.attackTargetId = '';
      rp.player.targetId = '';
      return;
    }
    const dist = Math.max(
      Math.abs(rt.state.position.x - rp.player.position.x),
      Math.abs(rt.state.position.y - rp.player.position.y),
    );
    // 攻击范围 = 1.5 格（近战）
    if (dist > 1.5) {
      // 距离不够，自动走向目标（重算路径）
      if (rp.path.length === 0 || now - rp.lastMoveRequestAt > 500) {
        const path = findPath(
          this.tiles, this.mapWidth, this.mapHeight,
          { x: Math.floor(rp.player.position.x), y: Math.floor(rp.player.position.y) },
          { x: Math.floor(rt.state.position.x), y: Math.floor(rt.state.position.y) },
        );
        if (path.length > 0) {
          // 留一格距离用于攻击
          if (path.length > 1) path.pop();
          rp.path = path;
          rp.player.state = 'moving';
        }
      }
      return;
    }
    // 在攻击范围：尝试攻击
    const interval = 1000 / Math.max(0.5, rp.data.stats.attackSpeed);
    if (now - rp.lastAttackAt < interval) return;
    rp.lastAttackAt = now;
    rp.player.state = 'attacking';

    const attacker: CombatActor = { id: rp.data.id, stats: rp.data.stats };
    const defender: CombatActor = { id: rt.state.id, stats: rt.template.stats };
    const result = calcDamage(attacker, defender, { type: 'physical' });
    if (!result.hit) {
      this.broadcastDamage(rt.state.id, rp.data.id, 0, 'physical', false, rt.state.hp);
      return;
    }
    rt.state.hp = Math.max(0, rt.state.hp - result.amount);
    this.broadcastDamage(rt.state.id, rp.data.id, result.amount, 'physical', result.crit, rt.state.hp);
    if (rt.state.hp <= 0) {
      onMonsterDeath(this, rt.state.id, rp.client.sessionId);
    }
  }

  private tickCheckMapExit(rp: RoomPlayer) {
    if (!this.map.exits || this.map.exits.length === 0) return;
    const px = Math.floor(rp.player.position.x);
    const py = Math.floor(rp.player.position.y);
    for (const exit of this.map.exits) {
      if (exit.position.x === px && exit.position.y === py) {
        // MVP：直接传送到目标地图出生点（同房间内的地图切换留待 v2）
        // 简化：传送到目标地图的出生点（仅当目标也是当前房间时；否则提示需要切换房间）
        const targetMap = getMap(exit.targetMapId);
        if (!targetMap) continue;
        // 更新角色目标地图并放置到出生点
        rp.data.mapId = targetMap.id;
        rp.data.position = { ...exit.targetPosition };
        if (!isWalkable(this.tiles, this.mapWidth, this.mapHeight, rp.data.position.x, rp.data.position.y)) {
          rp.data.position = { ...this.map.spawnPoint };
        }
        rp.player.position.set(rp.data.position.x, rp.data.position.y);
        rp.path = [];
        rp.attackTargetId = '';
        rp.player.targetId = '';
        rp.data.dirty = true;
        rp.client.send(ServerMsg.Notification, {
          text: `已切换到 ${targetMap.name}（MVP 阶段：地图实例切换待实现，先传送到出生点）`,
          level: 'info',
        });
        break;
      }
    }
  }

  private dirFromDelta(dx: number, dy: number): string {
    if (dx === 0 && dy < 0) return Direction.Up;
    if (dx === 0 && dy > 0) return Direction.Down;
    if (dx < 0 && dy === 0) return Direction.Left;
    if (dx > 0 && dy === 0) return Direction.Right;
    if (dx < 0 && dy < 0) return Direction.UpLeft;
    if (dx > 0 && dy < 0) return Direction.UpRight;
    if (dx < 0 && dy > 0) return Direction.DownLeft;
    if (dx > 0 && dy > 0) return Direction.DownRight;
    return 'down';
  }

  private async saveAll() {
    const tasks: Promise<void>[] = [];
    for (const [, rp] of this.players) {
      rp.data.hp = Math.max(0, rp.player.hp);
      rp.data.mp = Math.max(0, rp.player.mp);
      rp.data.position = { x: Math.floor(rp.player.position.x), y: Math.floor(rp.player.position.y) };
      tasks.push(saveCharacter(rp.data).catch((e) => console.error('save failed:', e)));
    }
    await Promise.all(tasks);
  }
}
