const BELT_SPEED = 1;
const ITEM_SPACING = 0.25;

export class ConveyorSegment {
  constructor(id, x, y, direction) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.items = [];
    this.next = null;
  }

  canAccept() {
    if (this.items.length === 0) return true;
    const newest = this.items[this.items.length - 1];
    return newest.progress >= ITEM_SPACING;
  }

  push(type) {
    if (!this.canAccept()) return false;
    this.items.push({ type, progress: 0 });
    return true;
  }

  update(deltaTime) {
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const ahead = this.items[i - 1];
      const maxProgress = ahead ? ahead.progress - ITEM_SPACING : 1;
      item.progress = Math.min(item.progress + BELT_SPEED * deltaTime, maxProgress);
    }

    if (this.items.length > 0 && this.items[0].progress >= 1) {
      if (this.next && this.next.canAccept()) {
        const item = this.items.shift();
        this.next.push(item.type);
      }
    }
  }
}
