/**
 * 本地单机游戏客户端 —— 替代 Colyseus 网络层。
 *
 * 保留原有公开接口（sendMove/sendAttack/... 与 GameClientCallbacks），
 * 但改为本地模拟：收到 sendXxx 时在本地游戏引擎上演算，并同步触发对应回调，
 * 就像服务器发回消息一样。GameScene/HudScene 几乎无需改动。
 */
import { localState } from '../state/LocalState.js';
import type { Stats, SkillTemplate } from '@mir/shared';
import {
  GameEngine,
  type ShopInfo,
  type SkillEffectMessage,
  type ProjectileMessage,
} from '../game/engine/GameEngine.js';
import type { TaskState } from '../game/tasks.js';
import { getCharacter } from '../game/save.js';

export interface GameClientCallbacks {
  onMapInit?: (msg: import('@mir/shared').MapInitMessage) => void;
  onInventorySnapshot?: (msg: import('@mir/shared').InventorySnapshotMessage) => void;
  onDamage?: (msg: import('@mir/shared').DamageMessage) => void;
  onExpGain?: (msg: import('@mir/shared').ExpGainMessage) => void;
  onLevelUp?: (msg: import('@mir/shared').LevelUpMessage) => void;
  onItemDrop?: (msg: import('@mir/shared').ItemDropMessage) => void;
  onPickupResult?: (msg: import('@mir/shared').PickupResultMessage) => void;
  onChat?: (msg: import('@mir/shared').ChatBroadcastMessage) => void;
  onSystem?: (msg: import('@mir/shared').SystemMessage) => void;
  onNotification?: (msg: { text: string; level: string }) => void;
  onDeath?: (msg: { killerId: string }) => void;
  onRespawnResult?: (msg: { ok: boolean; x: number; y: number }) => void;
  onError?: (msg: import('@mir/shared').ErrorMessage) => void;
  onOpenShop?: (shop: ShopInfo) => void;
  onSkillEffect?: (msg: SkillEffectMessage) => void;
  onProjectile?: (msg: ProjectileMessage) => void;
  onOpenTasks?: () => void;
  onTaskUpdate?: () => void;
  onStateChange?: () => void;
  onDisconnect?: () => void;
}

export class GameClient {
  /** 模拟 Colyseus Room：仅暴露 .state 供 GameScene/HudScene 读取 */
  room: { state: GameEngine['view'] } | null = null;
  private callbacks: GameClientCallbacks = {};
  private engine: GameEngine | null = null;
  private tickTimer?: number;

  setCallbacks(cb: GameClientCallbacks) {
    this.callbacks = cb;
  }

  /** 本地加载角色并开始游戏（不再连接 Colyseus） */
  async join(characterId: string, _mapId?: string): Promise<void> {
    const username = localState.username;
    if (!username) throw new Error('未登录');
    const save = getCharacter(username, characterId);
    if (!save) throw new Error('角色不存在或已删除');

    this.engine = new GameEngine(save, username);
    this.engine.setEvents({
      onDamage: (m) => this.callbacks.onDamage?.(m),
      onExpGain: (m) => this.callbacks.onExpGain?.(m),
      onLevelUp: (m) => this.callbacks.onLevelUp?.(m),
      onItemDrop: (m) => this.callbacks.onItemDrop?.(m),
      onPickupResult: (m) => this.callbacks.onPickupResult?.(m),
      onChat: (m) => this.callbacks.onChat?.(m),
      onSystem: (m) => this.callbacks.onSystem?.(m),
      onNotification: (m) => this.callbacks.onNotification?.(m),
      onDeath: (m) => this.callbacks.onDeath?.(m),
      onRespawnResult: (m) => this.callbacks.onRespawnResult?.(m),
      onError: (m) => this.callbacks.onError?.(m),
      onMapInit: (m) => this.callbacks.onMapInit?.(m),
      onInventorySnapshot: (m) => {
        localState.inventory = m;
        this.callbacks.onInventorySnapshot?.(m);
      },
      onOpenShop: (s) => this.callbacks.onOpenShop?.(s),
      onSkillEffect: (m) => this.callbacks.onSkillEffect?.(m),
      onProjectile: (m) => this.callbacks.onProjectile?.(m),
      onOpenTasks: () => this.callbacks.onOpenTasks?.(),
      onTaskUpdate: () => this.callbacks.onTaskUpdate?.(),
    });

    localState.localSessionId = 'local';
    this.room = { state: this.engine.view };

    this.engine.emitInit();
    this.startTick();
    this.callbacks.onStateChange?.();
  }

  private startTick() {
    let last = Date.now();
    this.tickTimer = window.setInterval(() => {
      if (!this.engine) return;
      const now = Date.now();
      const dt = Math.min(120, now - last);
      last = now;
      this.engine.tick(dt);
      this.callbacks.onStateChange?.();
    }, 50);
  }

  sendMove(x: number, y: number) {
    this.engine?.moveTo(x, y);
  }

  sendAttack(targetId: string) {
    this.engine?.setAttackTarget(targetId);
  }

  sendPickup(dropId?: string) {
    this.engine?.pickup(dropId);
  }

  sendUseItem(itemId: string) {
    this.engine?.useItem(itemId);
  }

  sendEquip(itemId: string) {
    this.engine?.equip(itemId);
  }

  sendUnequip(slot: string) {
    this.engine?.unequip(slot);
  }

  sendDropItem(index: number, count?: number) {
    this.engine?.dropItem(index, count);
  }

  sendChat(channel: 'world' | 'map' | 'private' | 'guild', text: string, _to?: string) {
    this.engine?.chat(channel, text);
  }

  sendInteractNpc(npcId: string) {
    this.engine?.interactNpc(npcId);
  }

  sendRespawn() {
    this.engine?.respawn();
  }

  /** 使用技能 */
  sendUseSkill(skillId: string, targetId?: string) {
    this.engine?.castSkill(skillId, targetId);
  }

  /** 当前学会的技能列表 */
  getSkills(): SkillTemplate[] {
    return this.engine?.getSkills() ?? [];
  }

  /** 技能剩余冷却（毫秒） */
  getCooldownRemaining(skillId: string): number {
    return this.engine?.getCooldownRemaining(skillId) ?? 0;
  }

  /** 任务列表（含进度） */
  getTasks(): TaskState[] {
    return this.engine?.getTasks() ?? [];
  }

  /** 商店购买 */
  sendBuyItem(itemId: string, count = 1) {
    this.engine?.buy(itemId, count);
  }

  /** 商店出售 */
  sendSellItem(itemId: string, count = 1) {
    this.engine?.sell(itemId, count);
  }

  /** 分配属性点 */
  sendAllocate(statKey: keyof Stats, inc: number) {
    this.engine?.allocate(statKey, inc);
  }

  getFreePoints(): number {
    return this.engine?.getFreePoints() ?? 0;
  }

  getBonus(): Partial<Stats> {
    return this.engine?.getBonus() ?? {};
  }

  leave() {
    if (this.tickTimer !== undefined) {
      window.clearInterval(this.tickTimer);
      this.tickTimer = undefined;
    }
    this.engine?.saveNow();
    this.engine = null;
    this.room = null;
  }
}

export const gameClient = new GameClient();
