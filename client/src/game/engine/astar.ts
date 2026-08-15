import { TileType, type Vec2 } from '@mir/shared';

/**
 * 网格 A* 寻路（8 方向）。可走格为 Floor / Door。
 */
export function findPath(
  tiles: TileType[],
  width: number,
  height: number,
  start: Vec2,
  goal: Vec2,
  allowDiagonal = true,
): Vec2[] {
  if (start.x === goal.x && start.y === goal.y) return [];

  const isWalkable = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    const t = tiles[y * width + x];
    return t === TileType.Floor || t === TileType.Door;
  };

  if (!isWalkable(goal.x, goal.y)) return [];

  const idx = (x: number, y: number) => y * width + x;
  const heuristic = (x: number, y: number) => {
    const dx = Math.abs(x - goal.x);
    const dy = Math.abs(y - goal.y);
    return allowDiagonal ? (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy) : dx + dy;
  };

  const open = new MinHeap();
  const startIdx = idx(start.x, start.y);
  const gScore = new Map<number, number>();
  const cameFrom = new Map<number, number>();
  const closed = new Set<number>();
  gScore.set(startIdx, 0);
  open.push({ id: startIdx, x: start.x, y: start.y, f: heuristic(start.x, start.y) });

  const neighbors = allowDiagonal
    ? [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]]
    : [[0, -1], [0, 1], [-1, 0], [1, 0]];

  let iterations = 0;
  const MAX_ITER = 5000;

  while (open.size > 0 && iterations++ < MAX_ITER) {
    const current = open.pop()!;
    const curIdx = current.id;
    if (current.x === goal.x && current.y === goal.y) {
      const path: Vec2[] = [];
      let cur: number | undefined = curIdx;
      while (cur !== undefined && cur !== startIdx) {
        path.push({ x: cur % width, y: Math.floor(cur / width) });
        cur = cameFrom.get(cur);
      }
      return path.reverse();
    }
    if (closed.has(curIdx)) continue;
    closed.add(curIdx);

    const cx = current.x;
    const cy = current.y;
    const cg = gScore.get(curIdx) ?? Infinity;

    for (const [dx, dy] of neighbors) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!isWalkable(nx, ny)) continue;
      if (dx !== 0 && dy !== 0) {
        if (!isWalkable(cx + dx, cy) && !isWalkable(cx, cy + dy)) continue;
      }
      const nIdx = idx(nx, ny);
      if (closed.has(nIdx)) continue;
      const cost = dx !== 0 && dy !== 0 ? Math.SQRT2 : 1;
      const tentativeG = cg + cost;
      const existingG = gScore.get(nIdx) ?? Infinity;
      if (tentativeG < existingG) {
        cameFrom.set(nIdx, curIdx);
        gScore.set(nIdx, tentativeG);
        open.push({ id: nIdx, x: nx, y: ny, f: tentativeG + heuristic(nx, ny) });
      }
    }
  }
  return [];
}

interface HeapNode {
  id: number;
  x: number;
  y: number;
  f: number;
}

class MinHeap {
  private heap: HeapNode[] = [];

  get size(): number {
    return this.heap.length;
  }

  push(node: HeapNode) {
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): HeapNode | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(i: number) {
    const h = this.heap;
    const node = h[i];
    while (i > 0) {
      const parentIdx = (i - 1) >> 1;
      const parent = h[parentIdx];
      if (node.f >= parent.f) break;
      h[i] = parent;
      i = parentIdx;
    }
    h[i] = node;
  }

  private sinkDown(i: number) {
    const h = this.heap;
    const n = h.length;
    const node = h[i];
    while (true) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let smallest = i;
      if (left < n && h[left].f < h[smallest].f) smallest = left;
      if (right < n && h[right].f < h[smallest].f) smallest = right;
      if (smallest === i) break;
      h[i] = h[smallest];
      i = smallest;
      h[i] = node;
    }
  }
}
