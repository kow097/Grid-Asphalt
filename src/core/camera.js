export class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
  }

  worldToScreen(wx, wy, tileSize) {
    return {
      x: (wx * tileSize - this.x) * this.zoom + this.canvas.width / 2,
      y: (wy * tileSize - this.y) * this.zoom + this.canvas.height / 2,
    };
  }

  screenToWorld(sx, sy, tileSize) {
    return {
      x: ((sx - this.canvas.width / 2) / this.zoom + this.x) / tileSize,
      y: ((sy - this.canvas.height / 2) / this.zoom + this.y) / tileSize,
    };
  }

  pan(dx, dy) {
    this.x -= dx / this.zoom;
    this.y -= dy / this.zoom;
  }

  zoomAt(factor, min, max) {
    this.zoom = Math.min(max, Math.max(min, this.zoom * factor));
  }
}
