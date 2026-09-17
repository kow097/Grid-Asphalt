export class Sprite {
  constructor(source, width, height) {
    this.source = source;
    this.width = width;
    this.height = height;
  }

  draw(ctx, x, y, width, height = width) {
    ctx.drawImage(this.source, x, y, width, height);
  }
}
