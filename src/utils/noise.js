export class SeededRandom {
  constructor(seed) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}

export class ValueNoise2D {
  constructor(seed, gridSize = 32) {
    this.rand = new SeededRandom(seed);
    this.gridSize = gridSize;
    this.cache = new Map();
  }

  _key(x, y) { return `${x},${y}`; }

  _valueAt(x, y) {
    const key = this._key(x, y);
    if (!this.cache.has(key)) this.cache.set(key, this.rand.next());
    return this.cache.get(key);
  }

  _smooth(t) { return t * t * (3 - 2 * t); }
  _lerp(a, b, t) { return a + (b - a) * t; }

  sample(x, y) {
    const gx = x / this.gridSize;
    const gy = y / this.gridSize;
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const sx = this._smooth(gx - x0);
    const sy = this._smooth(gy - y0);

    const n00 = this._valueAt(x0, y0);
    const n10 = this._valueAt(x0 + 1, y0);
    const n01 = this._valueAt(x0, y0 + 1);
    const n11 = this._valueAt(x0 + 1, y0 + 1);

    const ix0 = this._lerp(n00, n10, sx);
    const ix1 = this._lerp(n01, n11, sx);
    return this._lerp(ix0, ix1, sy);
  }
}

export function fbm(noise, x, y, octaves = 4, persistence = 0.5) {
  let total = 0;
  let amplitude = 1;
  let maxAmplitude = 0;
  let frequency = 1;

  for (let i = 0; i < octaves; i++) {
    total += noise.sample(x * frequency, y * frequency) * amplitude;
    maxAmplitude += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  return total / maxAmplitude;
}
