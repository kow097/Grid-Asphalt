import { AssetLoader } from './assetLoader.js';
import { resolveAsset } from './assetManifest.js';

export class AssetRegistry {
  constructor() {
    this.loader = new AssetLoader();
    this.sprites = new Map();
  }

  async preload(keys) {
    await Promise.all(keys.map(async (key) => {
      const descriptor = resolveAsset(key);
      if (!descriptor) return;

      try {
        const sprite = await this.loader.load(descriptor);
        this.sprites.set(key, sprite);
      } catch (err) {
        console.warn(`Asset '${key}' nije ucitan (${descriptor.path}), koristim fallback boju.`, err.message);
      }
    }));
  }

  get(key) {
    return this.sprites.get(key);
  }
}
