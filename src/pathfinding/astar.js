const MIN_STEP_COST = 0.5;

class MinHeap {
  constructor() {
    this.items = [];
  }

  get size() { return this.items.length; }

  push(item, priority) {
    this.items.push({ item, priority });
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.items[parent].priority <= this.items[i].priority) break;
      [this.items[parent], this.items[i]] = [this.items[i], this.items[parent]];
      i = parent;
    }
  }

  pop() {
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      while (true) {
        const left = i * 2 + 1;
        const right = i * 2 + 2;
        let smallest = i;
        if (left < this.items.length && this.items[left].priority < this.items[smallest].priority) smallest = left;
        if (right < this.items.length && this.items[right].priority < this.items[smallest].priority) smallest = right;
        if (smallest === i) break;
        [this.items[smallest], this.items[i]] = [this.items[i], this.items[smallest]];
        i = smallest;
      }
    }
    return top.item;
  }
}

function heuristic(x0, y0, x1, y1) {
  return (Math.abs(x0 - x1) + Math.abs(y0 - y1)) * MIN_STEP_COST;
}

function key(x, y) { return `${x},${y}`; }

export function findPath(grid, start, goal) {
  const [sx, sy] = start;
  const [gx, gy] = goal;

  if (!grid.isWalkable(sx, sy) || !grid.isWalkable(gx, gy)) return null;

  const open = new MinHeap();
  open.push([sx, sy], 0);

  const cameFrom = new Map();
  const costSoFar = new Map();
  costSoFar.set(key(sx, sy), 0);

  while (open.size > 0) {
    const [cx, cy] = open.pop();

    if (cx === gx && cy === gy) return _reconstructPath(cameFrom, [gx, gy]);

    for (const [nx, ny] of grid.neighbors(cx, cy)) {
      const stepCost = grid.moveCost(nx, ny);
      const newCost = costSoFar.get(key(cx, cy)) + stepCost;
      const nKey = key(nx, ny);

      if (!costSoFar.has(nKey) || newCost < costSoFar.get(nKey)) {
        costSoFar.set(nKey, newCost);
        const priority = newCost + heuristic(nx, ny, gx, gy);
        open.push([nx, ny], priority);
        cameFrom.set(nKey, [cx, cy]);
      }
    }
  }

  return null;
}

function _reconstructPath(cameFrom, goal) {
  const path = [goal];
  let currentKey = key(goal[0], goal[1]);

  while (cameFrom.has(currentKey)) {
    const prev = cameFrom.get(currentKey);
    path.push(prev);
    currentKey = key(prev[0], prev[1]);
  }

  return path.reverse();
}
