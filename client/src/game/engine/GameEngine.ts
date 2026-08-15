import {
  Direction,
  PlayerClass,
  expToNextLevel,
  getItem,
  getMap,
  getMonster,
  getSkill,
  getLearnedSkills,
  isWalkable,
  SHOP_ITEMS,
  type MapDefinition,
  type MonsterTemplate,
  type Stats,
  type Vec2,
  type SkillTemplate,
  type PlayerState,
  type MonsterState,
  type ItemDropState,
  type NpcState,
  type MapInitMessage,
  type InventorySnapshotMessage,
  type DamageMessage,
  type ExpGainMessage,
  type LevelUpMessage,
  type ItemDropMessage,
  type PickupResultMessage,
  type ChatBroadcastMessage,
  type SystemMessage,
  type ErrorMessage,
  type InventorySlotData,
  type EquipSlotData,
} from '@mir/shared';
import { findPath } from './astar.js';
import { calcDamage, calcExpReward, calcDeathExpPenalty, type CombatActor, type DamageResult } from './combat.js';
import { computeStats } from './stats.js';
import {
  type PlayerInventory,
  addItem,
  removeSlot,
  useConsumable,
  equipItem,
  unequipItem,
  getEquippedItems,
} from './inventory.js';
import type { CharacterSave } from '../save.js';
import { computeCharacterStats, loadInventory, serializeInventory, saveCharacter } from '../save.js';
import { TASKS, rewardLabel, type TaskState } from '../tasks.js';

export interface ShopInfo {
  npcId: string;
  npcName: string;
  buyList: Array<{ itemId: string; name: string; price: number }>;
}

export interface SkillEffectMessage {
  kind: string;
  x: number;
  y: number;
}

export interface ProjectileMessage {
  id: string;
  fromX: number;
  fromY: number;
  toId: string;
  duration: number;
  color: number;
}

/** 引擎对外事件（由 GameClient 转发给 UI） */
export interface EngineEvents {
  onDamage: (msg: DamageMessage) => void;
  onExpGain: (msg: ExpGainMessage) => void;
  onLevelUp: (msg: LevelUpMessage) => void;
  onItemDrop: (msg: ItemDropMessage) => void;
  onPickupResult: (msg: PickupResultMessage) => void;
  onChat: (msg: ChatBroadcastMessage) => void;
  onSystem: (msg: SystemMessage) => void;
  onNotification: (msg: { text: string; level: string }) => void;
  onDeath: (msg: { killerId: string }) => void;
  onRespawnResult: (msg: { ok: boolean; x: number; y: number }) => void;
  onError: (msg: ErrorMessage) => void;
  onInventorySnapshot: (msg: InventorySnapshotMessage) => void;
  onMapInit: (msg: MapInitMessage) => void;
  onOpenShop: (shop: ShopInfo) => void;
  onSkillEffect: (msg: SkillEffectMessage) => void;
  onProjectile: (msg: ProjectileMessage) => void;
  onOpenTasks: () => void;
  onTaskUpdate: () => void;
}

interface MonsterRuntime {
  state: MonsterState;
  template: MonsterTemplate;
  targetId: string;
  lastAttackAt: number;
  lastPathfindAt: number;
  nextPatrolAt: number;
  path: Vec2[];
}

interface Projectile {
  id: string;
  targetId: string;
  arriveAt: number;
  aoeRadius: number;
  multiplier: number;
  fallbackX: number;
  fallbackY: number;
}

interface DotState {
  damage: number;
  until: number;
  nextTick: number;
}

const PLAYER_ID = 'local';

export class GameEngine {
  map!: MapDefinition;
  tiles: number[] = [];
  mapWidth = 0;
  mapHeight = 0;

  player: PlayerState;
  inventory: PlayerInventory;
  stats: Stats;

  monsters = new Map<string, MonsterRuntime>();
  drops = new Map<string, ItemDropState>();
  npcs = new Map<string, NpcState>();

  view = {
    mapId: '',
    mapName: '',
    width: 0,
    height: 0,
    players: new Map<string, PlayerState>(),
    monsters: new Map<string, MonsterState>(),
    drops: new Map<string, ItemDropState>(),
    npcs: new Map<string, NpcState>(),
  };

  private events: EngineEvents = {
    onDamage: () => {}, onExpGain: () => {}, onLevelUp: () => {},
    onItemDrop: () => {}, onPickupResult: () => {}, onChat: () => {},
    onSystem: () => {}, onNotification: () => {}, onDeath: () => {},
    onRespawnResult: () => {}, onError: () => {}, onInventorySnapshot: () => {},
    onMapInit: () => {}, onOpenShop: () => {}, onSkillEffect: () => {},
    onProjectile: () => {}, onOpenTasks: () => {}, onTaskUpdate: () => {},
  };

  private save: CharacterSave;
  private username: string;
  private path: Vec2[] = [];
  private lastMoveRequestAt = 0;
  private lastAttackAt = 0;
  private attackTargetId = '';
  private lastSaveAt = Date.now();
  private seq = 0;
  private cooldowns = new Map<string, number>();
  private dots = new Map<string, DotState>();
  private projectiles: Projectile[] = [];
  private taskProgress: Record<string, number>;
  private taskCompleted: string[];

  constructor(save: CharacterSave, username: string) {
    this.save = save;
    this.username = username;
    this.inventory = loadInventory(save);
    this.stats = computeCharacterStats(save, this.inventory);

    // 兼容旧存档：补充任务字段
    if (!this.save.tasks) this.save.tasks = { progress: {}, completed: [] };
    this.taskProgress = { ...this.save.tasks.progress };
    this.taskCompleted = [...this.save.tasks.completed];

    this.player = this.buildPlayerState();

    const mapId = save.mapId || 'village';
    const pos = save.position;
    this.loadMap(mapId, pos);
  }

  setEvents(events: Partial<EngineEvents>) {
    this.events = { ...this.events, ...events };
  }

  /** 进入后首次推送：地图 / 背包 / 欢迎语 */
  emitInit() {
    this.emitMapInit();
    this.emitInventorySnapshot();
    this.system(`欢迎 ${this.player.name} 进入《传奇 Web》单机版！`);
    this.system('点击地面移动，点击怪物攻击，靠近怪物/NPC 后点击交互。', 'info');
  }

  private nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}_${this.seq}_${Math.floor(Math.random() * 1e6).toString(36)}`;
  }

  private buildPlayerState(): PlayerState {
    const s = this.stats;
    return {
      id: PLAYER_ID,
      name: this.save.name,
      classId: this.save.classId as string,
      level: this.save.level,
      exp: this.save.exp,
      expToNext: this.save.expToNext,
      position: { x: this.save.position.x, y: this.save.position.y },
      direction: 'down',
      state: 'idle',
      hp: this.save.hp,
      maxHp: s.maxHp,
      mp: this.save.mp,
      maxMp: s.maxMp,
      attack: s.attack,
      defense: s.defense,
      magicAttack: s.magicAttack,
      magicDefense: s.magicDefense,
      moveSpeed: s.moveSpeed,
      attackSpeed: s.attackSpeed,
      gold: this.inventory.gold,
      targetId: '',
    };
  }

  // ==================== 地图加载 ====================

  private loadMap(mapId: string, enterPos: Vec2) {
    const map = getMap(mapId) ?? getMap('village')!;
    this.map = map;
    this.tiles = [...map.tiles];
    this.mapWidth = map.width;
    this.mapHeight = map.height;

    this.view.mapId = map.id;
    this.view.mapName = map.name;
    this.view.width = map.width;
    this.view.height = map.height;

    // 玩家
    this.view.players.clear();
    this.view.players.set(PLAYER_ID, this.player);

    let px = Math.floor(enterPos.x);
    let py = Math.floor(enterPos.y);
    if (!isWalkable(this.tiles, this.mapWidth, this.mapHeight, px, py)) {
      px = map.spawnPoint.x;
      py = map.spawnPoint.y;
    }
    this.player.position = { x: px, y: py };
    this.save.mapId = map.id;
    this.save.position = { x: px, y: py };
    this.path = [];
    this.attackTargetId = '';
    this.player.targetId = '';

    // NPC
    this.npcs.clear();
    this.view.npcs.clear();
    for (const n of map.npcs) {
      const state: NpcState = {
        id: n.id, name: n.name, position: { x: n.position.x, y: n.position.y }, dialog: n.dialog,
      };
      this.npcs.set(n.id, state);
      this.view.npcs.set(n.id, state);
    }

    // 怪物
    this.monsters.clear();
    this.view.monsters.clear();
    for (const spawn of map.monsterSpawns) {
      const tpl = getMonster(spawn.monsterId);
      if (!tpl) continue;
      for (let i = 0; i < spawn.count; i++) {
        this.spawnMonster(spawn.monsterId, {
          x: spawn.position.x + Math.floor((Math.random() * 2 - 1) * 3),
          y: spawn.position.y + Math.floor((Math.random() * 2 - 1) * 3),
        });
      }
    }

    // 清空掉落
    this.drops.clear();
    this.view.drops.clear();
  }

  private spawnMonster(templateId: string, position: Vec2) {
    const tpl = getMonster(templateId);
    if (!tpl) return;
    const id = this.nextId('m');
    if (!isWalkable(this.tiles, this.mapWidth, this.mapHeight, position.x, position.y)) {
      position = this.findNearbyWalkable(position);
    }
    const state: MonsterState = {
      id,
      templateId,
      name: tpl.name,
      level: tpl.level,
      position: { x: position.x, y: position.y },
      spawnPosition: { x: position.x, y: position.y },
      direction: 'down',
      state: 'idle',
      hp: tpl.stats.maxHp,
      maxHp: tpl.stats.maxHp,
      attack: tpl.stats.attack,
      defense: tpl.stats.defense,
      targetId: '',
      deadAt: 0,
    };
    const rt: MonsterRuntime = {
      state, template: tpl, targetId: '', lastAttackAt: 0, lastPathfindAt: 0,
      nextPatrolAt: Date.now() + Math.random() * 3000, path: [],
    };
    this.monsters.set(id, rt);
    this.view.monsters.set(id, state);
  }

  private findNearbyWalkable(pos: Vec2): Vec2 {
    for (let r = 1; r <= 6; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const x = pos.x + dx;
          const y = pos.y + dy;
          if (isWalkable(this.tiles, this.mapWidth, this.mapHeight, x, y)) return { x, y };
        }
      }
    }
    return pos;
  }

  // ==================== 对外动作 ====================

  moveTo(x: number, y: number) {
    if (this.player.hp <= 0) return;
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    if (!isWalkable(this.tiles, this.mapWidth, this.mapHeight, tx, ty)) return;
    const startX = Math.floor(this.player.position.x);
    const startY = Math.floor(this.player.position.y);
    const path = findPath(this.tiles, this.mapWidth, this.mapHeight, { x: startX, y: startY }, { x: tx, y: ty });
    this.path = path;
    this.player.state = path.length > 0 ? 'moving' : 'idle';
  }

  setAttackTarget(id: string) {
    if (this.player.hp <= 0) return;
    this.attackTargetId = id;
    this.player.targetId = id;
  }

  pickup(dropId?: string) {
    if (this.player.hp <= 0) return;
    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);

    let target: ItemDropState | undefined;
    if (dropId) {
      target = this.drops.get(dropId);
    } else {
      let bestDist = 3;
      for (const [, d] of this.drops) {
        const dist = Math.max(Math.abs(d.position.x - px), Math.abs(d.position.y - py));
        if (dist < bestDist) { bestDist = dist; target = d; }
      }
    }
    if (!target) {
      this.events.onPickupResult({ ok: false, itemId: '', count: 0, reason: '附近没有可拾取的物品' });
      return;
    }
    const dist = Math.max(Math.abs(target.position.x - px), Math.abs(target.position.y - py));
    if (dist > 2) {
      this.events.onPickupResult({ ok: false, itemId: target.itemId, count: 0, reason: '距离太远' });
      return;
    }

    if (target.itemId === 'gold') {
      this.inventory.gold += target.count;
      this.player.gold = this.inventory.gold;
    } else {
      const added = addItem(this.inventory, target.itemId, target.count);
      if (added <= 0) {
        this.events.onPickupResult({ ok: false, itemId: target.itemId, count: 0, reason: '背包已满' });
        return;
      }
    }
    this.drops.delete(target.id);
    this.view.drops.delete(target.id);
    this.persist();
    this.events.onPickupResult({ ok: true, itemId: target.itemId, count: target.count });
    this.emitInventorySnapshot();
  }

  useItem(itemId: string) {
    if (this.player.hp <= 0) return;
    const slot = this.inventory.slots.find((s) => s?.itemId === itemId);
    if (!slot) {
      this.events.onError({ code: 'NOT_FOUND', message: '物品不存在' });
      return;
    }
    const tpl = getItem(itemId);
    if (tpl && tpl.requiredLevel > this.player.level) {
      this.events.onError({ code: 'LEVEL_TOO_LOW', message: `需要 ${tpl.requiredLevel} 级才能使用` });
      return;
    }
    const result = useConsumable(this.inventory, slot.index);
    if (!result.ok) {
      this.events.onError({ code: 'NOT_USABLE', message: '该物品无法使用' });
      return;
    }
    if (result.hp > 0) {
      this.player.hp = Math.min(this.stats.maxHp, this.player.hp + result.hp);
    }
    if (result.mp > 0) {
      this.player.mp = Math.min(this.stats.maxMp, this.player.mp + result.mp);
    }
    this.persist();
    this.emitInventorySnapshot();
  }

  equip(itemId: string) {
    const slot = this.inventory.slots.find((s) => s?.itemId === itemId);
    if (!slot) {
      this.events.onError({ code: 'NOT_FOUND', message: '物品不存在' });
      return;
    }
    const tpl = getItem(itemId);
    if (tpl && tpl.requiredLevel > this.player.level) {
      this.events.onError({ code: 'LEVEL_TOO_LOW', message: `需要 ${tpl.requiredLevel} 级才能装备` });
      return;
    }
    const result = equipItem(this.inventory, slot.index);
    if (!result.ok) {
      this.events.onError({ code: 'EQUIP_FAILED', message: result.reason ?? '装备失败' });
      return;
    }
    this.recomputeStats();
    this.emitInventorySnapshot();
  }

  unequip(slot: string) {
    const result = unequipItem(this.inventory, slot as never);
    if (!result.ok) {
      this.events.onError({ code: 'UNEQUIP_FAILED', message: result.reason ?? '卸下失败' });
      return;
    }
    this.recomputeStats();
    this.emitInventorySnapshot();
  }

  dropItem(index: number, count?: number) {
    const slot = this.inventory.slots[index];
    if (!slot) return;
    const tpl = getItem(slot.itemId);
    if (!tpl) return;
    if (!tpl.tradeable) {
      this.events.onError({ code: 'NOT_TRADEABLE', message: '该物品不可丢弃' });
      return;
    }
    const n = Math.min(count ?? 1, slot.count);
    removeSlot(this.inventory, index, n);
    this.spawnDrop(slot.itemId, n, Math.floor(this.player.position.x), Math.floor(this.player.position.y));
    this.persist();
    this.emitInventorySnapshot();
  }

  chat(channel: string, text: string) {
    const clean = (text ?? '').slice(0, 200).trim();
    if (!clean) return;
    const msg: ChatBroadcastMessage = {
      channel: channel as ChatBroadcastMessage['channel'],
      from: PLAYER_ID,
      fromName: this.player.name,
      text: clean,
      timestamp: Date.now(),
    };
    this.events.onChat(msg);
    this.respondToChat(clean);
  }

  private respondToChat(text: string) {
    const t = text.toLowerCase();
    if (t.startsWith('/help') || t === '/?') {
      this.system('命令：/help 帮助');
    } else if (t.startsWith('/time')) {
      this.system(`现在时间：${new Date().toLocaleTimeString()}`);
    }
  }

  interactNpc(npcId: string) {
    const npc = this.npcs.get(npcId);
    if (!npc) return;
    const dist = Math.max(
      Math.abs(npc.position.x - this.player.position.x),
      Math.abs(npc.position.y - this.player.position.y),
    );
    if (dist > 3) {
      this.events.onError({ code: 'TOO_FAR', message: '距离 NPC 太远' });
      return;
    }
    if (npc.id === 'shopkeeper') {
      this.events.onOpenShop(this.buildShopInfo(npc));
    } else if (npc.id === 'elder') {
      this.events.onOpenTasks();
    } else {
      this.events.onNotification({ text: `[${npc.name}] ${npc.dialog}`, level: 'info' });
    }
  }

  private buildShopInfo(npc: NpcState): ShopInfo {
    const buyList = SHOP_ITEMS.map((id) => {
      const item = getItem(id)!;
      return { itemId: id, name: item.name, price: Math.max(1, item.sellPrice * 2) };
    });
    return { npcId: npc.id, npcName: npc.name, buyList };
  }

  buy(itemId: string, count = 1) {
    const item = getItem(itemId);
    if (!item) return;
    const price = Math.max(1, item.sellPrice * 2) * count;
    if (this.inventory.gold < price) {
      this.events.onError({ code: 'NO_GOLD', message: '金币不足' });
      return;
    }
    const added = addItem(this.inventory, itemId, count);
    if (added <= 0) {
      this.events.onError({ code: 'BAG_FULL', message: '背包已满' });
      return;
    }
    this.inventory.gold -= price;
    this.player.gold = this.inventory.gold;
    this.persist();
    this.emitInventorySnapshot();
    this.events.onNotification({ text: `购买了 ${item.name} x${count}`, level: 'info' });
  }

  sell(itemId: string, count = 1) {
    const slot = this.inventory.slots.find((s) => s?.itemId === itemId);
    if (!slot) return;
    const item = getItem(itemId);
    if (!item || item.sellPrice <= 0) return;
    const n = Math.min(count, slot.count);
    removeSlot(this.inventory, slot.index, n);
    this.inventory.gold += item.sellPrice * n;
    this.player.gold = this.inventory.gold;
    this.persist();
    this.emitInventorySnapshot();
    this.events.onNotification({ text: `出售了 ${item.name} x${n}，获得 ${item.sellPrice * n} 金币`, level: 'info' });
  }

  allocate(statKey: keyof Stats, inc: number) {
    if (this.save.freePoints <= 0) {
      this.events.onError({ code: 'NO_POINTS', message: '没有可分配属性点' });
      return;
    }
    const bonus = { ...this.save.bonus };
    bonus[statKey] = ((bonus[statKey] as number) ?? 0) + inc;
    this.save.bonus = bonus;
    this.save.freePoints -= 1;
    this.recomputeStats();
    this.persist();
    this.events.onNotification({ text: '属性点已分配', level: 'info' });
  }

  respawn() {
    if (this.player.hp > 0) return;
    this.player.hp = this.stats.maxHp;
    this.player.mp = this.stats.maxMp;
    this.player.state = 'idle';
    this.save.hp = this.player.hp;
    this.save.mp = this.player.mp;
    const village = getMap('village')!;
    this.loadMap('village', village.spawnPoint);
    this.emitMapInit();
    this.persist();
    this.events.onRespawnResult({ ok: true, x: village.spawnPoint.x, y: village.spawnPoint.y });
    this.system(`${this.player.name} 在新手村复活了`);
  }

  getFreePoints(): number {
    return this.save.freePoints;
  }

  getBonus(): Partial<Stats> {
    return { ...this.save.bonus };
  }

  saveNow() {
    this.persist();
  }

  // ==================== 技能 ====================

  getSkills(): SkillTemplate[] {
    return getLearnedSkills(this.save.classId, this.player.level);
  }

  getCooldownRemaining(skillId: string): number {
    const skill = getSkill(skillId);
    if (!skill) return 0;
    const last = this.cooldowns.get(skillId) ?? -Infinity;
    return Math.max(0, skill.cooldown - (Date.now() - last));
  }

  castSkill(skillId: string, targetId?: string) {
    if (this.player.hp <= 0) return;
    const skill = getSkill(skillId);
    if (!skill) return;
    if (skill.level > this.player.level) {
      this.events.onError({ code: 'NOT_LEARNED', message: `尚未学会 ${skill.name}` });
      return;
    }
    const now = Date.now();
    const cdRemain = this.getCooldownRemaining(skillId);
    if (cdRemain > 0) {
      this.events.onNotification({ text: `${skill.name} 冷却中 (${Math.ceil(cdRemain / 1000)}s)`, level: 'warn' });
      return;
    }
    if (this.player.mp < skill.mpCost) {
      this.events.onError({ code: 'NO_MP', message: '魔法不足' });
      return;
    }
    this.player.mp -= skill.mpCost;
    this.save.mp = this.player.mp;
    this.cooldowns.set(skillId, now);
    this.player.state = 'attacking';

    switch (skill.kind) {
      case 'melee': this.castMelee(skill, targetId); break;
      case 'pierce': this.castPierce(skill, targetId); break;
      case 'projectile': this.castProjectile(skill, targetId); break;
      case 'bolt': this.castBolt(skill, targetId); break;
      case 'heal': this.castHeal(skill); break;
      case 'dot': this.castPoison(skill, targetId); break;
    }
  }

  private resolveTarget(skill: SkillTemplate, targetId?: string): MonsterRuntime | undefined {
    let rt = targetId ? this.monsters.get(targetId) : undefined;
    if (rt && rt.state.deadAt === 0) return rt;
    rt = this.attackTargetId ? this.monsters.get(this.attackTargetId) : undefined;
    if (rt && rt.state.deadAt === 0) return rt;

    let best: MonsterRuntime | undefined;
    let bestDist = skill.range;
    for (const [, m] of this.monsters) {
      if (m.state.deadAt > 0) continue;
      const d = chebyshev(this.player.position, m.state.position);
      if (d <= bestDist) { bestDist = d; best = m; }
    }
    return best;
  }

  private castMelee(skill: SkillTemplate, targetId?: string) {
    const rt = this.resolveTarget(skill, targetId);
    if (!rt) { this.events.onNotification({ text: '附近没有可攻击的目标', level: 'warn' }); return; }
    const d = chebyshev(this.player.position, rt.state.position);
    if (d > skill.range) { this.events.onNotification({ text: '目标距离太远', level: 'warn' }); return; }
    this.setAttackTarget(rt.state.id);
    this.applySkillDamage(rt, skill.multiplier, 'physical');
    this.emitSkillEffect('slash', rt.state.position.x, rt.state.position.y);
  }

  private castPierce(skill: SkillTemplate, targetId?: string) {
    const rt = this.resolveTarget(skill, targetId);
    if (!rt) { this.events.onNotification({ text: '附近没有可攻击的目标', level: 'warn' }); return; }
    this.setAttackTarget(rt.state.id);
    const dx = Math.sign(rt.state.position.x - this.player.position.x);
    const dy = Math.sign(rt.state.position.y - this.player.position.y);
    const hitIds = new Set<string>();
    for (let i = 1; i <= skill.range; i++) {
      const tx = Math.round(this.player.position.x + dx * i);
      const ty = Math.round(this.player.position.y + dy * i);
      for (const [, m] of this.monsters) {
        if (m.state.deadAt > 0 || hitIds.has(m.state.id)) continue;
        if (Math.floor(m.state.position.x) === tx && Math.floor(m.state.position.y) === ty) {
          hitIds.add(m.state.id);
          this.applySkillDamage(m, skill.multiplier, 'physical');
        }
      }
    }
    this.emitSkillEffect('assault', rt.state.position.x, rt.state.position.y);
  }

  private castProjectile(skill: SkillTemplate, targetId?: string) {
    const rt = this.resolveTarget(skill, targetId);
    if (!rt) { this.events.onNotification({ text: '附近没有可攻击的目标', level: 'warn' }); return; }
    this.faceTarget(rt.state.position);
    const dist = chebyshev(this.player.position, rt.state.position);
    const duration = Math.max(150, Math.min(800, dist * 90));
    const id = this.nextId('proj');
    this.projectiles.push({
      id,
      targetId: rt.state.id,
      arriveAt: Date.now() + duration,
      aoeRadius: skill.aoeRadius ?? 1.5,
      multiplier: skill.multiplier,
      fallbackX: rt.state.position.x,
      fallbackY: rt.state.position.y,
    });
    this.events.onProjectile({
      id,
      fromX: this.player.position.x,
      fromY: this.player.position.y,
      toId: rt.state.id,
      duration,
      color: skill.color,
    });
  }

  private castBolt(skill: SkillTemplate, targetId?: string) {
    const rt = this.resolveTarget(skill, targetId);
    if (!rt) { this.events.onNotification({ text: '附近没有可攻击的目标', level: 'warn' }); return; }
    this.faceTarget(rt.state.position);
    this.applySkillDamage(rt, skill.multiplier, 'magic');
    this.emitSkillEffect('lightning', rt.state.position.x, rt.state.position.y);
  }

  private castHeal(skill: SkillTemplate) {
    const amount = Math.max(1, Math.floor(this.stats.magicAttack * skill.multiplier));
    this.player.hp = Math.min(this.stats.maxHp, this.player.hp + amount);
    this.save.hp = this.player.hp;
    this.emitSkillEffect('heal', this.player.position.x, this.player.position.y);
    this.events.onNotification({ text: `治愈术回复了 ${amount} 点生命`, level: 'info' });
  }

  private castPoison(skill: SkillTemplate, targetId?: string) {
    const rt = this.resolveTarget(skill, targetId);
    if (!rt) { this.events.onNotification({ text: '附近没有可攻击的目标', level: 'warn' }); return; }
    this.faceTarget(rt.state.position);
    const dot = skill.dot!;
    this.dots.set(rt.state.id, {
      damage: dot.damage,
      until: Date.now() + dot.duration,
      nextTick: Date.now() + dot.tickInterval,
    });
    this.emitSkillEffect('poison', rt.state.position.x, rt.state.position.y);
  }

  private faceTarget(pos: { x: number; y: number }) {
    this.player.direction = dirFromDelta(pos.x - this.player.position.x, pos.y - this.player.position.y);
  }

  private applySkillDamage(rt: MonsterRuntime, multiplier: number, type: 'physical' | 'magic') {
    const stats: Stats = { ...this.stats };
    if (type === 'magic') stats.magicAttack = Math.max(1, Math.floor(this.stats.magicAttack * multiplier));
    else stats.attack = Math.max(1, Math.floor(this.stats.attack * multiplier));
    const result = calcDamage({ id: PLAYER_ID, stats }, { id: rt.state.id, stats: rt.template.stats }, { type });
    this.applyResultToMonster(rt, result);
  }

  private applyResultToMonster(rt: MonsterRuntime, result: DamageResult) {
    if (!result.hit) {
      this.events.onDamage({ targetId: rt.state.id, sourceId: PLAYER_ID, amount: 0, type: result.type, crit: false, skill: true, targetHp: rt.state.hp });
      return;
    }
    rt.state.hp = Math.max(0, rt.state.hp - result.amount);
    rt.targetId = PLAYER_ID;
    rt.state.targetId = PLAYER_ID;
    this.events.onDamage({ targetId: rt.state.id, sourceId: PLAYER_ID, amount: result.amount, type: result.type, crit: result.crit, skill: true, targetHp: rt.state.hp });
    if (rt.state.hp <= 0) this.onMonsterDeath(rt);
  }

  private emitSkillEffect(kind: string, x: number, y: number) {
    this.events.onSkillEffect({ kind, x, y });
  }

  private tickProjectiles(now: number) {
    if (this.projectiles.length === 0) return;
    const remaining: Projectile[] = [];
    for (const p of this.projectiles) {
      if (now >= p.arriveAt) this.resolveProjectile(p);
      else remaining.push(p);
    }
    this.projectiles = remaining;
  }

  private resolveProjectile(p: Projectile) {
    const rt = this.monsters.get(p.targetId);
    const pos = rt && rt.state.deadAt === 0
      ? { x: rt.state.position.x, y: rt.state.position.y }
      : { x: p.fallbackX, y: p.fallbackY };
    this.emitSkillEffect('fireball', pos.x, pos.y);
    for (const [, m] of this.monsters) {
      if (m.state.deadAt > 0) continue;
      const d = Math.hypot(m.state.position.x - pos.x, m.state.position.y - pos.y);
      if (d <= p.aoeRadius) {
        this.applySkillDamage(m, p.multiplier, 'magic');
      }
    }
  }

  private tickDots(now: number) {
    for (const [mid, dot] of this.dots) {
      if (now >= dot.until) {
        this.dots.delete(mid);
        continue;
      }
      if (now >= dot.nextTick) {
        dot.nextTick += 1000;
        const rt = this.monsters.get(mid);
        if (!rt || rt.state.deadAt > 0) {
          this.dots.delete(mid);
          continue;
        }
        rt.state.hp = Math.max(0, rt.state.hp - dot.damage);
        rt.targetId = PLAYER_ID;
        rt.state.targetId = PLAYER_ID;
        this.events.onDamage({ targetId: mid, sourceId: PLAYER_ID, amount: dot.damage, type: 'true', crit: false, skill: true, targetHp: rt.state.hp });
        if (rt.state.hp <= 0) this.onMonsterDeath(rt);
      }
    }
  }

  // ==================== 任务 ====================

  getTasks(): TaskState[] {
    return TASKS.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      targetCount: t.targetCount,
      current: Math.min(this.taskProgress[t.id] ?? 0, t.targetCount),
      done: this.taskCompleted.includes(t.id),
      rewardLabel: rewardLabel(t),
    }));
  }

  private onMonsterKilled(templateId: string) {
    for (const t of TASKS) {
      if (t.targetMonsterId !== templateId) continue;
      if (this.taskCompleted.includes(t.id)) continue;
      const cur = Math.min((this.taskProgress[t.id] ?? 0) + 1, t.targetCount);
      this.taskProgress[t.id] = cur;
      this.save.tasks.progress[t.id] = cur;
      if (cur >= t.targetCount) {
        this.taskCompleted.push(t.id);
        this.save.tasks.completed.push(t.id);
        this.grantTaskReward(t);
        this.system(`任务完成：${t.title}！奖励 ${rewardLabel(t)}`, 'warn');
      }
      this.events.onTaskUpdate();
    }
    this.persist();
  }

  private grantTaskReward(t: (typeof TASKS)[number]) {
    if (t.rewardType === 'gold') {
      this.inventory.gold += t.rewardGold ?? 0;
      this.player.gold = this.inventory.gold;
    } else {
      const added = addItem(this.inventory, t.rewardItemId ?? '', t.rewardCount ?? 1);
      if (added <= 0) {
        this.events.onNotification({ text: '任务奖励已发放，但背包已满！', level: 'warn' });
        return;
      }
    }
    this.emitInventorySnapshot();
  }

  // ==================== 内部：属性/背包/掉落 ====================

  private recomputeStats() {
    this.stats = computeStats(this.save.classId, this.save.level, this.inventory.equipment, this.save.bonus);
    this.player.maxHp = this.stats.maxHp;
    this.player.maxMp = this.stats.maxMp;
    this.player.attack = this.stats.attack;
    this.player.defense = this.stats.defense;
    this.player.magicAttack = this.stats.magicAttack;
    this.player.magicDefense = this.stats.magicDefense;
    this.player.moveSpeed = this.stats.moveSpeed;
    this.player.attackSpeed = this.stats.attackSpeed;
    this.player.hp = Math.min(this.player.hp, this.stats.maxHp);
    this.player.mp = Math.min(this.player.mp, this.stats.maxMp);
  }

  private spawnDrop(itemId: string, count: number, x: number, y: number) {
    const dropId = this.nextId('drop');
    const state: ItemDropState = { id: dropId, itemId, count, position: { x, y } };
    this.drops.set(dropId, state);
    this.view.drops.set(dropId, state);
    this.events.onItemDrop({ dropId, itemId, count, x, y });
  }

  private emitInventorySnapshot() {
    const slots: InventorySlotData[] = [];
    for (let i = 0; i < this.inventory.slots.length; i++) {
      const s = this.inventory.slots[i];
      if (s) slots.push({ index: s.index, itemId: s.itemId, count: s.count });
    }
    const equipment: EquipSlotData[] = getEquippedItems(this.inventory).map((e) => ({
      slot: e.slot, itemId: e.itemId,
    }));
    const msg: InventorySnapshotMessage = { gold: this.inventory.gold, slots, equipment };
    this.events.onInventorySnapshot(msg);
  }

  private emitMapInit() {
    const msg: MapInitMessage = {
      mapId: this.map.id,
      mapName: this.map.name,
      width: this.map.width,
      height: this.map.height,
      tiles: this.tiles,
      exits: this.map.exits,
    };
    this.events.onMapInit(msg);
  }

  private system(text: string, level: SystemMessage['level'] = 'info') {
    this.events.onSystem({ text, level });
  }

  private persist() {
    this.save.hp = Math.max(0, this.player.hp);
    this.save.mp = Math.max(0, this.player.mp);
    this.save.position = { x: Math.floor(this.player.position.x), y: Math.floor(this.player.position.y) };
    this.save.level = this.player.level;
    this.save.exp = this.player.exp;
    this.save.expToNext = this.player.expToNext;
    this.save.gold = this.inventory.gold;
    this.save.inventory = serializeInventory(this.inventory);
    saveCharacter(this.username, this.save);
  }

  // ==================== 主循环 ====================

  tick(dtMs: number) {
    const now = Date.now();
    if (this.player.hp > 0) {
      this.tickPlayerMovement(dtMs);
      this.tickPlayerAttack(now);
      this.tickCheckMapExit();
    }
    this.tickMonsters(dtMs);
    this.tickProjectiles(now);
    this.tickDots(now);
    if (now - this.lastSaveAt > 15000) {
      this.lastSaveAt = now;
      this.persist();
    }
  }

  private tickPlayerMovement(dtMs: number) {
    if (this.path.length === 0) {
      if (this.player.state === 'moving') this.player.state = 'idle';
      return;
    }
    const speed = this.stats.moveSpeed;
    const step = (speed * dtMs) / 1000;
    let remaining = step;
    while (remaining > 0 && this.path.length > 0) {
      const next = this.path[0];
      const dx = next.x - this.player.position.x;
      const dy = next.y - this.player.position.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= remaining) {
        this.player.position = { x: next.x, y: next.y };
        this.path.shift();
        remaining -= dist;
      } else {
        this.player.position = {
          x: this.player.position.x + (dx / dist) * remaining,
          y: this.player.position.y + (dy / dist) * remaining,
        };
        remaining = 0;
      }
      this.player.direction = dirFromDelta(dx, dy);
      this.player.state = 'moving';
    }
    if (this.path.length === 0) this.player.state = 'idle';
  }

  private tickPlayerAttack(now: number) {
    if (!this.attackTargetId) {
      if (this.player.state === 'attacking') this.player.state = 'idle';
      return;
    }
    const rt = this.monsters.get(this.attackTargetId);
    if (!rt || rt.state.deadAt > 0) {
      this.attackTargetId = '';
      this.player.targetId = '';
      if (this.player.state === 'attacking') this.player.state = 'idle';
      return;
    }
    const dist = Math.max(
      Math.abs(rt.state.position.x - this.player.position.x),
      Math.abs(rt.state.position.y - this.player.position.y),
    );
    if (dist > 1.5) {
      if (this.path.length === 0 || now - this.lastMoveRequestAt > 500) {
        this.lastMoveRequestAt = now;
        const path = findPath(
          this.tiles, this.mapWidth, this.mapHeight,
          { x: Math.floor(this.player.position.x), y: Math.floor(this.player.position.y) },
          { x: Math.floor(rt.state.position.x), y: Math.floor(rt.state.position.y) },
        );
        if (path.length > 0) {
          if (path.length > 1) path.pop();
          this.path = path;
          this.player.state = 'moving';
        }
      }
      return;
    }
    const interval = 1000 / Math.max(0.5, this.stats.attackSpeed);
    if (now - this.lastAttackAt < interval) return;
    this.lastAttackAt = now;
    this.player.state = 'attacking';

    const attacker: CombatActor = { id: PLAYER_ID, stats: this.stats };
    const defender: CombatActor = { id: rt.state.id, stats: rt.template.stats };
    const result = calcDamage(attacker, defender, { type: 'physical' });
    if (!result.hit) {
      this.events.onDamage({ targetId: rt.state.id, sourceId: PLAYER_ID, amount: 0, type: 'physical', crit: false, skill: false, targetHp: rt.state.hp });
      return;
    }
    rt.state.hp = Math.max(0, rt.state.hp - result.amount);
    // 受击反击：被动怪被攻击后也锁定玩家
    rt.targetId = PLAYER_ID;
    rt.state.targetId = PLAYER_ID;
    this.events.onDamage({ targetId: rt.state.id, sourceId: PLAYER_ID, amount: result.amount, type: 'physical', crit: result.crit, skill: false, targetHp: rt.state.hp });
    if (rt.state.hp <= 0) this.onMonsterDeath(rt);
  }

  private tickCheckMapExit() {
    if (!this.map.exits || this.map.exits.length === 0) return;
    const px = Math.floor(this.player.position.x);
    const py = Math.floor(this.player.position.y);
    for (const exit of this.map.exits) {
      if (exit.position.x === px && exit.position.y === py) {
        const targetMap = getMap(exit.targetMapId);
        if (!targetMap) continue;
        this.loadMap(targetMap.id, exit.targetPosition);
        this.emitMapInit();
        this.system(`已进入 ${targetMap.name}`, 'info');
        break;
      }
    }
  }

  private onMonsterDeath(rt: MonsterRuntime) {
    const m = rt.state;
    m.deadAt = Date.now();
    m.state = 'dead';
    m.hp = 0;
    m.targetId = '';
    rt.targetId = '';
    rt.path = [];

    this.grantExp(calcExpReward(this.player.level, m.level, rt.template.expReward));

    const [goldMin, goldMax] = rt.template.goldDrop;
    const gold = Math.floor(goldMin + Math.random() * (goldMax - goldMin + 1));
    if (gold > 0) {
      this.spawnDrop('gold', gold, Math.floor(m.position.x), Math.floor(m.position.y));
    }
    for (const drop of rt.template.dropTable) {
      if (Math.random() < drop.chance) {
        if (getItem(drop.itemId)) {
          this.spawnDrop(
            drop.itemId, 1,
            Math.floor(m.position.x + (Math.random() * 2 - 1)),
            Math.floor(m.position.y + (Math.random() * 2 - 1)),
          );
        }
      }
    }

    this.onMonsterKilled(m.templateId);
  }

  private grantExp(amount: number) {
    let leveledUp = false;
    this.player.exp += amount;
    while (this.player.exp >= this.player.expToNext) {
      this.player.exp -= this.player.expToNext;
      this.player.level += 1;
      this.player.expToNext = expToNextLevel(this.player.level);
      leveledUp = true;
    }
    this.save.level = this.player.level;
    this.save.exp = this.player.exp;
    this.save.expToNext = this.player.expToNext;

    if (leveledUp) {
      this.stats = computeStats(this.save.classId, this.player.level, this.inventory.equipment, this.save.bonus);
      this.save.freePoints += 2;
      this.player.maxHp = this.stats.maxHp;
      this.player.maxMp = this.stats.maxMp;
      this.player.attack = this.stats.attack;
      this.player.defense = this.stats.defense;
      this.player.magicAttack = this.stats.magicAttack;
      this.player.magicDefense = this.stats.magicDefense;
      this.player.moveSpeed = this.stats.moveSpeed;
      this.player.attackSpeed = this.stats.attackSpeed;
      this.player.hp = this.stats.maxHp;
      this.player.mp = this.stats.maxMp;
      this.save.hp = this.player.hp;
      this.save.mp = this.player.mp;
      this.events.onLevelUp({ newLevel: this.player.level });
      this.system(`${this.player.name} 升到了 ${this.player.level} 级！获得 2 点属性点（按 C 打开属性面板）`);
    }
    this.events.onExpGain({ amount, currentExp: this.player.exp, expToNext: this.player.expToNext });
  }

  private onPlayerDeath(killerId: string) {
    const penalty = calcDeathExpPenalty(this.player.exp, 0.05);
    this.player.exp = Math.max(0, this.player.exp - penalty);
    this.save.exp = this.player.exp;
    this.player.state = 'dead';
    this.player.hp = 0;
    this.save.hp = 0;
    this.path = [];
    this.attackTargetId = '';
    this.player.targetId = '';
    this.events.onDeath({ killerId });
    this.system(`${this.player.name} 被击败了`, 'error');
  }

  // ==================== 怪物 AI ====================

  private tickMonsters(dtMs: number) {
    const now = Date.now();
    for (const [, rt] of this.monsters) {
      const m = rt.state;

      if (m.deadAt > 0) {
        if (now - m.deadAt >= rt.template.respawnTime) {
          m.hp = m.maxHp;
          m.state = 'idle';
          m.targetId = '';
          m.deadAt = 0;
          m.position = { x: m.spawnPosition.x, y: m.spawnPosition.y };
          rt.path = [];
          rt.targetId = '';
          rt.nextPatrolAt = now + Math.random() * 3000;
        }
        continue;
      }

      // 主动寻敌（被动怪 aggroRange=0，不会主动出击）
      if (!rt.targetId && rt.template.aggroRange > 0) {
        const d = chebyshev(this.player.position, m.position);
        if (d <= rt.template.aggroRange && this.player.hp > 0) {
          rt.targetId = PLAYER_ID;
          m.targetId = PLAYER_ID;
        }
      }

      if (!rt.targetId) {
        this.tickPatrol(rt, now);
        continue;
      }

      // 目标为玩家
      if (rt.targetId === PLAYER_ID) {
        if (this.player.hp <= 0) {
          rt.targetId = '';
          m.targetId = '';
          continue;
        }
        const tp = this.player.position;
        const dist = chebyshev(tp, m.position);

        if (dist > rt.template.aggroRange + 4) {
          // 追击太远，放弃
          rt.targetId = '';
          m.targetId = '';
          rt.path = [];
          continue;
        } else if (dist <= rt.template.attackRange) {
          m.state = 'attacking';
          if (now - rt.lastAttackAt >= rt.template.attackInterval) {
            rt.lastAttackAt = now;
            this.monsterAttack(rt);
          }
          continue;
        } else if (now - rt.lastPathfindAt > 600) {
          rt.lastPathfindAt = now;
          rt.path = findPath(this.tiles, this.mapWidth, this.mapHeight, { x: m.position.x, y: m.position.y }, { x: Math.floor(tp.x), y: Math.floor(tp.y) });
        }
      }

      this.moveAlongPath(rt, dtMs);
    }
  }

  private tickPatrol(rt: MonsterRuntime, now: number) {
    const m = rt.state;
    if (now < rt.nextPatrolAt) {
      m.state = 'idle';
      return;
    }
    // 在出生点附近随机巡逻
    const home = m.spawnPosition;
    const px = home.x + Math.floor((Math.random() * 2 - 1) * 3);
    const py = home.y + Math.floor((Math.random() * 2 - 1) * 3);
    if (isWalkable(this.tiles, this.mapWidth, this.mapHeight, px, py)) {
      rt.path = findPath(this.tiles, this.mapWidth, this.mapHeight, { x: Math.floor(m.position.x), y: Math.floor(m.position.y) }, { x: px, y: py });
    }
    rt.nextPatrolAt = now + 3000 + Math.random() * 4000;
  }

  private monsterAttack(rt: MonsterRuntime) {
    const m = rt.state;
    if (this.player.hp <= 0) return;
    const attacker: CombatActor = { id: m.id, stats: rt.template.stats };
    const defender: CombatActor = { id: PLAYER_ID, stats: this.stats };
    const result = calcDamage(attacker, defender, { type: 'physical' });
    if (!result.hit) {
      this.events.onDamage({ targetId: PLAYER_ID, sourceId: m.id, amount: 0, type: 'physical', crit: false, targetHp: this.player.hp });
      return;
    }
    this.player.hp = Math.max(0, this.player.hp - result.amount);
    this.save.hp = this.player.hp;
    this.events.onDamage({ targetId: PLAYER_ID, sourceId: m.id, amount: result.amount, type: 'physical', crit: result.crit, targetHp: this.player.hp });
    if (this.player.hp <= 0) this.onPlayerDeath(m.id);
  }

  private moveAlongPath(rt: MonsterRuntime, dtMs: number) {
    const m = rt.state;
    if (rt.path.length === 0) {
      m.state = 'idle';
      return;
    }
    m.state = 'moving';
    const next = rt.path[0];
    const stepDist = (rt.template.stats.moveSpeed * dtMs) / 1000;
    const dx = next.x - m.position.x;
    const dy = next.y - m.position.y;
    const d = Math.hypot(dx, dy);
    if (d <= stepDist) {
      m.position = { x: next.x, y: next.y };
      rt.path.shift();
    } else {
      m.position = {
        x: m.position.x + (dx / d) * stepDist,
        y: m.position.y + (dy / d) * stepDist,
      };
    }
    m.direction = dirFromDelta(dx, dy);
  }
}

function chebyshev(a: Vec2, b: Vec2): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function dirFromDelta(dx: number, dy: number): string {
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
