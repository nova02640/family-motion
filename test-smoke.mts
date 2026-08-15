/**
 * GameEngine 引擎烟雾测试：mock localStorage + 直接构造引擎 + 跑 500 tick。
 * 目标：验证引擎层是否有死循环/异常（排除/确认引擎问题）。
 */
import { PlayerClass } from '@mir/shared';
import { GameEngine } from './client/src/game/engine/GameEngine.ts';
import type { CharacterSave } from './client/src/game/save.ts';

// ---- mock localStorage ----
const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, String(v)); },
  removeItem: (k: string) => { store.delete(k); },
};
(globalThis as any).window = { setInterval: () => 0, clearInterval: () => {} };

const save: CharacterSave = {
  id: 'c_test',
  name: '测试者',
  classId: PlayerClass.Warrior,
  level: 1,
  exp: 0,
  expToNext: 100,
  mapId: 'village',
  position: { x: 20, y: 20 },
  hp: 100,
  mp: 20,
  gold: 100,
  inventory: { gold: 100, slots: [], equipment: {} },
  freePoints: 0,
  bonus: {},
  tasks: { progress: {}, completed: [] },
};

const events: Record<string, number> = {};
const engine = new GameEngine(save, 'tester');
engine.setEvents({
  onMapInit: () => { events.mapInit = (events.mapInit ?? 0) + 1; },
  onInventorySnapshot: () => { events.inv = (events.inv ?? 0) + 1; },
  onDamage: () => { events.damage = (events.damage ?? 0) + 1; },
  onSystem: () => { events.system = (events.system ?? 0) + 1; },
});

engine.emitInit();
console.log('[1] emitInit 后事件:', events);

const view = engine.view;
console.log('[2] view 结构:', {
  mapId: view.mapId,
  players: view.players?.size,
  monsters: view.monsters?.size,
  drops: view.drops?.size,
  npcs: view.npcs?.size,
});

// 玩家位置有效性
const player = view.players.get('local');
console.log('[3] 玩家:', player?.name, 'pos:', player?.position, 'hp:', player?.hp);

// 跑 500 tick（模拟 25 秒 @50ms）
const t0 = Date.now();
let err: Error | null = null;
try {
  for (let i = 0; i < 500; i++) {
    engine.tick(50);
  }
} catch (e) {
  err = e as Error;
}
const dt = Date.now() - t0;
console.log('[4] 500 tick 耗时:', dt, 'ms | 异常:', err?.message ?? '无');

if (err) {
  console.error('❌ 引擎层有异常!');
  process.exit(1);
}
if (dt > 3000) {
  console.error(`❌ 引擎层疑似卡顿（500 tick 耗时 ${dt}ms 异常长）`);
  process.exit(1);
}
console.log('✅ 引擎层健康（500 tick 无异常、无卡顿）');
