export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
  scale(s) { return new Vector2(this.x * s, this.y * s); }
  length() { return Math.sqrt(this.x * this.x + this.y * this.y); }

  normalized() {
    const len = this.length();
    return len === 0 ? new Vector2(0, 0) : this.scale(1 / len);
  }

  distanceTo(v) { return this.sub(v).length(); }
}
