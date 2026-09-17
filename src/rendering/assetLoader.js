import { Sprite } from './sprite.js';
import { MultiPartSprite } from './multiPartSprite.js';

export class AssetLoader {
  constructor() {
    this.cache = new Map();
  }

  async load(descriptor) {
    if (this.cache.has(descriptor.path)) return this.cache.get(descriptor.path);
    const sprite = await this._loadManifest(descriptor.path);
    this.cache.set(descriptor.path, sprite);
    return sprite;
  }

  async _loadManifest(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Asset manifest nije pronaden: ${path}`);

    const json = await response.json();
    // Putanje unutar manifesta (npr. "extractor/base.png") su relativne na
    // mapu u kojoj je SAM manifest (npr. assets/sprites/), ne na cwd stranice.
    const baseDir = path.slice(0, path.lastIndexOf('/') + 1);

    if (Array.isArray(json.parts)) {
      return this._loadMultiPartSprite(json, baseDir);
    }

    if (!json.image) throw new Error(`Asset manifest na ${path} nema 'image' polje`);
    const img = await this._loadImage(baseDir + json.image);
    return new Sprite(img, json.width ?? img.width, json.height ?? img.height);
  }

  async _loadMultiPartSprite(json, baseDir) {
    const layers = [];
    for (const part of json.parts) {
      if (!part.image) throw new Error(`Dio '${part.id}' nema 'image' polje`);
      const image = await this._loadImage(baseDir + part.image);
      layers.push({
        id: part.id,
        image,
        pivot: part.pivot ?? { x: json.width / 2, y: json.height / 2 },
        anim: part.anim ?? { type: 'static' },
      });
    }
    return new MultiPartSprite(layers, json.width, json.height);
  }

  _loadImage(path) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Slika nije ucitana: ${path}`));
      img.src = path;
    });
  }
}
