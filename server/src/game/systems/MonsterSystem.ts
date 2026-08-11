import { nanoid } from 'nanoid';
import {
  Direction,
  type MonsterTemplate,
  type Vec2,
} from '@mir/shared';
import { findPath } from '../pathfinding/astar.js';
import { MonsterState } from '../state/MonsterState.js';
import { calcDamage, type CombatActor } from '../combat/combat.js';
import { getMonster } from '../data/monsters.js';
import { getItem } from '../data/items.js';
import type { GameRoom } from '../GameRoom.js';

/** 单只怪物的运行时数据（不进 state） */
export interface MonsterRuntime {
  state: MonsterState;
  template: MonsterTemplate;
  targetId: string;        // 玩家 ID
  lastAttackAt: number;
  lastPathfindAt: number;
  path: Vec2[];
}

/** 8 方向枚举 */
function dirFromDelta(dx: number, dy: number): Direction {
  if (dx === 0 && dy < 0) return Direction.Up;
  if (dx === 0 && dy > 0) return Direction.Down;
  if (dx < 0 && dy === 0) return Direction.Left;
  if (dx > 0 && dy === 0) return Direction.Right;
  if (dx < 0 && dy < 0) return Direction.UpLeft;
  if (dx > 0 && dy < 0) return Direction.UpRight;
  if (dx < 0 && dy > 0) return Direction.DownLeft;
  if (dx > 0 && dy > 0) return Direction.DownRight;
  return Direction.Down;
}

/** 生成一只怪物 */
export function spawnMonster(templateId: string, position: Vec2): MonsterRuntime {
  const tpl = getMonster(templateId);
  if (!tpl) throw new Error(`Unknown monster: ${templateId}`);
  const id = `m_${nanoid(8)}`;
  const state = new MonsterState();
  state.id = id;
  state.templateId = templateId;
  state.name = tpl.name;
  state.level = tpl.level;
  state.hp = tpl.stats.maxHp;
  state.maxHp = tpl.stats.maxHp;
  state.attack = tpl.stats.attack;
  state.defense = tpl.stats.defense;
  state.position.set(position.x, position.y);
  state.spawnPosition.set(position.x, position.y);
  state.direction = 'down';
  state.state = 'idle';
  return { state, template: tpl, targetId: '', lastAttackAt: 0, lastPathfindAt: 0, path: [] };
}

/** 在半径内选一个随机可达点（怪物刷新用） */
export function pickSpawnAround(center: Vec2, radius: number): Vec2 {
  return {
    x: center.x + Math.floor((Math.random() * 2 - 1) * radius),
    y: center.y + Math.floor((Math.random() * 2 - 1) * radius),
  };
}

/** Chebyshev 距离（8 方向格距） */
function chebyshev(a: Vec2, b: Vec2): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

/** 怪物 AI 主循环：每个 tick 调用 */
export function tickMonsters(room: GameRoom, dtMs: number) {
  const now = Date.now();
  for (const [monsterId, rt] of room.monsters) {
    const m = rt.state;

    // 死亡：检查是否到复活时间
    if (m.deadAt > 0) {
      if (now - m.deadAt >= rt.template.respawnTime) {
        // 复活：回到出生点
        m.hp = m.maxHp;
        m.state = 'idle';
        m.targetId = '';
        m.deadAt = 0;
        m.position.set(m.spawnPosition.x, m.spawnPosition.y);
        rt.path = [];
        rt.targetId = '';
      }
      continue;
    }

    // 寻找/切换目标
    if (!rt.targetId) {
      let bestPlayerId = '';
      let bestDist = rt.template.aggroRange;
      for (const [pid, pd] of room.players) {
        if (pd.data.hp <= 0) continue;
        const d = chebyshev(pd.player.position, m.position);
        if (d < bestDist) {
          bestDist = d;
          bestPlayerId = pid;
        }
      }
      if (bestPlayerId) {
        rt.targetId = bestPlayerId;
        m.targetId = bestPlayerId;
      }
    }

    if (!rt.targetId) {
      // 闲置状态：保持原位（也可加入小范围游走）
      m.state = 'idle';
      continue;
    }

    const target = room.players.get(rt.targetId);
    if (!target || target.data.hp <= 0) {
      rt.targetId = '';
      m.targetId = '';
      continue;
    }

    const tp = target.player.position;
    const dist = chebyshev(tp, m.position);

    // 超出追击范围（aggroRange + 4）：放弃目标，返回出生点附近
    if (dist > rt.template.aggroRange + 4) {
      rt.targetId = '';
      m.targetId = '';
      rt.path = [];
      // 走回出生点
      const home = m.spawnPosition;
      if (chebyshev(home, m.position) > 1) {
        if (now - rt.lastPathfindAt > 800) {
          rt.lastPathfindAt = now;
          rt.path = findPath(room.tiles, room.mapWidth, room.mapHeight, { x: m.position.x, y: m.position.y }, { x: home.x, y: home.y });
        }
      } else {
        m.state = 'idle';
        continue;
      }
    } else if (dist <= rt.template.attackRange) {
      // 在攻击范围内：尝试攻击
      m.state = 'attacking';
      if (now - rt.lastAttackAt >= rt.template.attackInterval) {
        rt.lastAttackAt = now;
        performMonsterAttack(room, rt, target.data.id);
      }
      continue;
    } else {
      // 追击：周期性重算路径
      if (now - rt.lastPathfindAt > 600) {
        rt.lastPathfindAt = now;
        rt.path = findPath(room.tiles, room.mapWidth, room.mapHeight, { x: m.position.x, y: m.position.y }, { x: tp.x, y: tp.y });
      }
    }

    // 沿路径移动
    if (rt.path.length > 0) {
      m.state = 'moving';
      const next = rt.path[0];
      const stepDist = (rt.template.stats.moveSpeed * dtMs) / 1000;
      const dx = next.x - m.position.x;
      const dy = next.y - m.position.y;
      const d = Math.hypot(dx, dy);
      if (d <= stepDist) {
        m.position.set(next.x, next.y);
        rt.path.shift();
      } else {
        m.position.set(m.position.x + (dx / d) * stepDist, m.position.y + (dy / d) * stepDist);
      }
      m.direction = dirFromDelta(dx, dy) as string;
    } else {
      m.state = 'idle';
    }
  }
}

/** 怪物攻击玩家 */
function performMonsterAttack(room: GameRoom, rt: MonsterRuntime, targetPlayerId: string) {
  const pd = room.players.get(targetPlayerId);
  if (!pd || pd.data.hp <= 0) return;

  const attacker: CombatActor = { id: rt.state.id, stats: rt.template.stats };
  const defender: CombatActor = { id: pd.data.id, stats: pd.data.stats };
  const result = calcDamage(attacker, defender, { type: 'physical' });

  if (!result.hit) {
    room.broadcastDamage(pd.data.id, rt.state.id, 0, 'physical', false, pd.data.hp);
    return;
  }

  pd.data.hp = Math.max(0, pd.data.hp - result.amount);
  pd.player.hp = pd.data.hp;
  room.broadcastDamage(pd.data.id, rt.state.id, result.amount, 'physical', result.crit, pd.data.hp);
  pd.data.dirty = true;

  if (pd.data.hp <= 0) {
    room.onPlayerDeath(pd, rt.state.id);
  }
}

/** 怪物死亡：处理掉落、经验、移除 */
export function onMonsterDeath(room: GameRoom, monsterId: string, killerId: string) {
  const rt = room.monsters.get(monsterId);
  if (!rt || rt.state.deadAt > 0) return;

  const m = rt.state;
  m.deadAt = Date.now();
  m.state = 'dead';
  m.hp = 0;
  m.targetId = '';
  rt.targetId = '';
  rt.path = [];

  // 经验奖励给击杀者
  const pd = room.players.get(killerId);
  if (pd) {
    const exp = Math.floor(rt.template.expReward);
    room.grantPlayerExp(pd, exp);
  }

  // 金币掉落
  const [goldMin, goldMax] = rt.template.goldDrop;
  const gold = Math.floor(goldMin + Math.random() * (goldMax - goldMin + 1));
  if (gold > 0) {
    room.spawnDrop({
      dropId: `drop_${nanoid(8)}`,
      itemId: 'gold',
      count: gold,
      x: Math.floor(m.position.x),
      y: Math.floor(m.position.y),
      sourceEntityId: m.id,
    });
  }

  // 物品掉落
  for (const drop of rt.template.dropTable) {
    if (Math.random() < drop.chance) {
      const tpl = getItem(drop.itemId);
      if (tpl) {
        room.spawnDrop({
          dropId: `drop_${nanoid(8)}`,
          itemId: drop.itemId,
          count: 1,
          x: Math.floor(m.position.x + (Math.random() * 2 - 1)),
          y: Math.floor(m.position.y + (Math.random() * 2 - 1)),
          sourceEntityId: m.id,
        });
      }
    }
  }
}
