import { Schema, type, MapSchema } from '@colyseus/schema';
import { PlayerState } from './PlayerState.js';
import { MonsterState } from './MonsterState.js';
import { ItemDropState } from './ItemDropState.js';
import { NpcState } from './NpcState.js';

/**
 * 房间根状态。
 *
 * 注意：背包/装备属于私有数据，**不**放在共享 state 中（否则会广播给所有玩家）。
 * 服务端通过私有消息 InventorySnapshot / InventoryUpdate 推送给所属玩家。
 */
export class GameState extends Schema {
  @type('string') mapId = '';
  @type('string') mapName = '';
  @type('number') width = 0;
  @type('number') height = 0;

  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: MonsterState }) monsters = new MapSchema<MonsterState>();
  @type({ map: ItemDropState }) drops = new MapSchema<ItemDropState>();
  @type({ map: NpcState }) npcs = new MapSchema<NpcState>();
}
