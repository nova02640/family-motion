import { TileType, type MapDefinition, type Vec2 } from '../types.js';

/**
 * 地图定义 —— 程序化生成（确定性种子），前后端一致。
 * 两张地图：新手村(village) 与 荒野(wilderness)，通过出口互通。
 */

/** 简易确定性 PRNG（mulberry32） */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface MapSpec {
  id: string;
  name: string;
  width: number;
  height: number;
  seed: number;
  trees: number;
  ponds: number;
  spawnPoint: Vec2;
  npcs: MapDefinition['npcs'];
  monsterSpawns: MapDefinition['monsterSpawns'];
  exits: MapDefinition['exits'];
}

function buildMap(spec: MapSpec): MapDefinition {
  const { width, height } = spec;
  const tiles: TileType[] = new Array<TileType>(width * height).fill(TileType.Floor);
  const rand = mulberry32(spec.seed);

  const idx = (x: number, y: number) => y * width + x;
  const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height;
  const setTile = (x: number, y: number, t: TileType) => {
    if (inBounds(x, y)) tiles[idx(x, y)] = t;
  };

  // 边框墙体
  for (let x = 0; x < width; x++) {
    setTile(x, 0, TileType.Wall);
    setTile(x, height - 1, TileType.Wall);
  }
  for (let y = 0; y < height; y++) {
    setTile(0, y, TileType.Wall);
    setTile(width - 1, y, TileType.Wall);
  }

  // 保护区：出生点/NPC/刷新点/出口附近保持空旷
  const protectedIdxs = new Set<number>();
  const protect = (cx: number, cy: number, r: number) => {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (inBounds(x, y)) protectedIdxs.add(idx(x, y));
      }
    }
  };
  protect(spec.spawnPoint.x, spec.spawnPoint.y, 3);
  for (const n of spec.npcs) protect(n.position.x, n.position.y, 2);
  for (const s of spec.monsterSpawns) protect(s.position.x, s.position.y, 2);
  for (const e of spec.exits) protect(e.position.x, e.position.y, 1);

  // 撒草丛
  let planted = 0;
  let guard = 0;
  while (planted < spec.trees && guard++ < 5000) {
    const x = 1 + Math.floor(rand() * (width - 2));
    const y = 1 + Math.floor(rand() * (height - 2));
    const i = idx(x, y);
    if (tiles[i] !== TileType.Floor || protectedIdxs.has(i)) continue;
    tiles[i] = TileType.Tree;
    planted++;
  }

  // 撒水塘（3x3）
  let ponds = 0;
  guard = 0;
  while (ponds < spec.ponds && guard++ < 5000) {
    const x = 2 + Math.floor(rand() * (width - 4));
    const y = 2 + Math.floor(rand() * (height - 4));
    let ok = true;
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        const i = idx(x + dx, y + dy);
        if (tiles[i] !== TileType.Floor || protectedIdxs.has(i)) { ok = false; break; }
      }
      if (!ok) break;
    }
    if (!ok) continue;
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) setTile(x + dx, y + dy, TileType.Water);
    }
    ponds++;
  }

  return {
    id: spec.id,
    name: spec.name,
    width,
    height,
    tiles,
    monsterSpawns: spec.monsterSpawns,
    npcs: spec.npcs,
    spawnPoint: spec.spawnPoint,
    exits: spec.exits,
  };
}

const MAPS: MapDefinition[] = [
  buildMap({
    id: 'village',
    name: '新手村',
    width: 40,
    height: 40,
    seed: 20240815,
    trees: 26,
    ponds: 2,
    spawnPoint: { x: 20, y: 18 },
    npcs: [
      {
        id: 'shopkeeper',
        name: '杂货店老板',
        position: { x: 24, y: 18 },
        dialog: '欢迎光临！我可以卖给你药水和装备，也回收你不要的物品。',
      },
      {
        id: 'elder',
        name: '村长',
        position: { x: 20, y: 24 },
        dialog: '年轻的冒险者，村外的荒野有骷髅和僵尸出没，多备些药水再出发吧。',
      },
    ],
    monsterSpawns: [
      { monsterId: 'chicken', position: { x: 8, y: 8 }, count: 5 },
      { monsterId: 'deer', position: { x: 30, y: 8 }, count: 4 },
      { monsterId: 'scarecrow', position: { x: 8, y: 30 }, count: 2 },
    ],
    exits: [
      {
        position: { x: 38, y: 20 },
        targetMapId: 'wilderness',
        targetPosition: { x: 2, y: 20 },
      },
    ],
  }),
  buildMap({
    id: 'wilderness',
    name: '荒野',
    width: 40,
    height: 40,
    seed: 20240901,
    trees: 34,
    ponds: 3,
    spawnPoint: { x: 20, y: 20 },
    npcs: [],
    monsterSpawns: [
      { monsterId: 'hook_cat', position: { x: 8, y: 8 }, count: 4 },
      { monsterId: 'skeleton', position: { x: 30, y: 12 }, count: 3 },
      { monsterId: 'zombie', position: { x: 10, y: 30 }, count: 2 },
      { monsterId: 'red_snake', position: { x: 32, y: 30 }, count: 1 },
      { monsterId: 'woma_warrior', position: { x: 20, y: 36 }, count: 1 },
    ],
    exits: [
      {
        position: { x: 1, y: 20 },
        targetMapId: 'village',
        targetPosition: { x: 37, y: 20 },
      },
    ],
  }),
];

const BY_ID = new Map<string, MapDefinition>(MAPS.map((m) => [m.id, m]));

/** 按 id 获取地图 */
export function getMap(id: string): MapDefinition | undefined {
  return BY_ID.get(id);
}

/** 全部地图 */
export const ALL_MAPS: MapDefinition[] = MAPS;

/** 默认出生地图 */
export const DEFAULT_MAP_ID = 'village';

/** 判断某格是否可走（地板或门） */
export function isWalkable(tiles: TileType[], width: number, height: number, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= width || y >= height) return false;
  const t = tiles[y * width + x];
  return t === TileType.Floor || t === TileType.Door;
}
