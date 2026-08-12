/**
 * Colyseus 游戏客户端封装
 *
 * 负责：
 * - 建立 WebSocket 连接（joinOrCreate 'game' 房间）
 * - 订阅 state 变更 → 通过回调通知 GameScene
 * - 接收服务端消息 → 通过回调分发
 * - 提供发送消息的辅助方法
 */
import { Client, type Room } from 'colyseus.js';
import { wsUrl } from '../config.js';
import { localState } from '../state/LocalState.js';
import {
  ClientMsg,
  ServerMsg,
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
} from '@mir/shared';

export interface GameClientCallbacks {
  onMapInit?: (msg: MapInitMessage) => void;
  onInventorySnapshot?: (msg: InventorySnapshotMessage) => void;
  onDamage?: (msg: DamageMessage) => void;
  onExpGain?: (msg: ExpGainMessage) => void;
  onLevelUp?: (msg: LevelUpMessage) => void;
  onItemDrop?: (msg: ItemDropMessage) => void;
  onPickupResult?: (msg: PickupResultMessage) => void;
  onChat?: (msg: ChatBroadcastMessage) => void;
  onSystem?: (msg: SystemMessage) => void;
  onNotification?: (msg: { text: string; level: string }) => void;
  onDeath?: (msg: { killerId: string }) => void;
  onRespawnResult?: (msg: { ok: boolean; x: number; y: number }) => void;
  onError?: (msg: ErrorMessage) => void;
  onStateChange?: () => void;
  onDisconnect?: () => void;
}

export class GameClient {
  private client: Client;
  room: Room | null = null;
  private callbacks: GameClientCallbacks = {};

  constructor() {
    this.client = new Client(wsUrl());
  }

  setCallbacks(cb: GameClientCallbacks) {
    this.callbacks = cb;
  }

  /** 加入或创建游戏房间 */
  async join(characterId: string, mapId?: string): Promise<void> {
    if (!localState.token) throw new Error('未登录');

    this.room = await this.client.joinOrCreate('game', {
      token: localState.token,
      characterId,
      mapId,
    });

    localState.localSessionId = this.room.sessionId;

    this.room.onStateChange(() => {
      this.callbacks.onStateChange?.();
    });

    this.room.onMessage(ServerMsg.MapInit, (m: MapInitMessage) => this.callbacks.onMapInit?.(m));
    this.room.onMessage(ServerMsg.InventorySnapshot, (m: InventorySnapshotMessage) => {
      localState.inventory = m;
      this.callbacks.onInventorySnapshot?.(m);
    });
    this.room.onMessage(ServerMsg.Damage, (m: DamageMessage) => this.callbacks.onDamage?.(m));
    this.room.onMessage(ServerMsg.ExpGain, (m: ExpGainMessage) => this.callbacks.onExpGain?.(m));
    this.room.onMessage(ServerMsg.LevelUp, (m: LevelUpMessage) => this.callbacks.onLevelUp?.(m));
    this.room.onMessage(ServerMsg.ItemDrop, (m: ItemDropMessage) => this.callbacks.onItemDrop?.(m));
    this.room.onMessage(ServerMsg.PickupResult, (m: PickupResultMessage) => this.callbacks.onPickupResult?.(m));
    this.room.onMessage(ServerMsg.ChatMessage, (m: ChatBroadcastMessage) => this.callbacks.onChat?.(m));
    this.room.onMessage(ServerMsg.SystemMessage, (m: SystemMessage) => this.callbacks.onSystem?.(m));
    this.room.onMessage(ServerMsg.Notification, (m: { text: string; level: string }) => this.callbacks.onNotification?.(m));
    this.room.onMessage(ServerMsg.Death, (m: { killerId: string }) => this.callbacks.onDeath?.(m));
    this.room.onMessage(ServerMsg.RespawnResult, (m: { ok: boolean; x: number; y: number }) => this.callbacks.onRespawnResult?.(m));
    this.room.onMessage(ServerMsg.Error, (m: ErrorMessage) => this.callbacks.onError?.(m));

    this.room.onLeave(() => {
      this.callbacks.onDisconnect?.();
      this.room = null;
    });
  }

  sendMove(x: number, y: number) {
    this.room?.send(ClientMsg.Move, { x, y });
  }

  sendAttack(targetId: string) {
    this.room?.send(ClientMsg.Attack, { targetId });
  }

  sendPickup(dropId?: string) {
    this.room?.send(ClientMsg.PickupItem, { dropId });
  }

  sendUseItem(itemId: string) {
    this.room?.send(ClientMsg.UseItem, { itemId });
  }

  sendEquip(itemId: string) {
    this.room?.send(ClientMsg.EquipItem, { itemId });
  }

  sendUnequip(slot: string) {
    this.room?.send(ClientMsg.UnequipItem, { slot });
  }

  sendDropItem(index: number, count?: number) {
    this.room?.send(ClientMsg.DropItem, { index, count });
  }

  sendChat(channel: 'world' | 'map' | 'private' | 'guild', text: string, to?: string) {
    this.room?.send(ClientMsg.Chat, { channel, text, to });
  }

  sendInteractNpc(npcId: string) {
    this.room?.send(ClientMsg.InteractNpc, { npcId });
  }

  sendRespawn() {
    this.room?.send(ClientMsg.Respawn, {});
  }

  leave() {
    this.room?.leave();
    this.room = null;
  }
}

export const gameClient = new GameClient();
