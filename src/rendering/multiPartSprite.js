export class MultiPartSprite {
  constructor(layers, width, height) {
    this.layers = layers;
    this.width = width;
    this.height = height;
  }

  draw(ctx, x, y, width, height = width, animState = {}) {
    const scaleX = width / this.width;
    const scaleY = height / this.height;

    for (const layer of this.layers) {
      if (layer.anim?.type === 'scroll') {
        this._drawScroll(ctx, layer, x, y, width, height, scaleX, animState);
        continue;
      }

      const angle = this._angleFor(layer, animState);
      const jitter = this._jitterFor(layer, animState);
      const pivotX = layer.pivot.x * scaleX;
      const pivotY = layer.pivot.y * scaleY;

      ctx.save();
      ctx.translate(x + pivotX + jitter.x, y + pivotY + jitter.y);
      ctx.rotate(angle);
      ctx.translate(-pivotX, -pivotY);
      ctx.drawImage(layer.image, 0, 0, this.width * scaleX, this.height * scaleY);
      ctx.restore();
    }
  }

  _angleFor(layer, animState) {
    const type = layer.anim?.type;
    if (type !== 'rotate' && type !== 'rotate+shake') return 0;
    if (!animState.active) return 0;
    const speed = layer.anim.speed ?? 180;
    return ((animState.time * speed) % 360) * (Math.PI / 180);
  }

  _jitterFor(layer, animState) {
    const type = layer.anim?.type;
    if (type !== 'shake' && type !== 'rotate+shake') return { x: 0, y: 0 };
    if (!animState.active) return { x: 0, y: 0 };
    const amplitude = layer.anim.amplitude ?? 1;
    return {
      x: Math.sin(animState.time * 40) * amplitude,
      y: Math.cos(animState.time * 37) * amplitude,
    };
  }

  // Beskonacno vodoravno "kliženje" teksture (npr. strelice na traci) unutar
  // vlastite pravokutne povrsine, bez rotacije/pivota. Slika layera MORA biti
  // bešavno poplocana po širini (lijevi rub se nastavlja na desni) - inace
  // ce se vidjeti "šav" na svakom ponavljanju.
  _drawScroll(ctx, layer, x, y, width, height, scaleX, animState) {
    const img = layer.image;
    const speed = layer.anim.speed ?? 60; // px/s u nerazvucenim (izvornim) koordinatama slike
    const dir = layer.anim.direction === 'left' ? -1 : 1;
    const period = img.width;
    const time = animState.active ? animState.time ?? 0 : 0;
    const rawOffset = ((time * speed * dir) % period + period) % period;
    const offset = rawOffset * scaleX;
    const tileW = img.width * scaleX;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    for (let dx = -offset; dx < width; dx += tileW) {
      ctx.drawImage(img, x + dx, y, tileW, height);
    }
    ctx.restore();
  }
}
