// services/tileCache.ts
export class TileCache {
  private static readonly CACHE_NAME = 'dubai-map-tiles';
  private static readonly CACHE_VERSION = 'v1';
  private static readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly TILE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  static async initialize(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/tile-cache-sw.js');
        console.log('Tile cache service worker registered');
      } catch (error) {
        console.warn('Failed to register tile cache service worker:', error);
      }
    }
  }

  static async cacheTile(url: string, blob: Blob): Promise<void> {
    try {
      if ('caches' in window) {
        const cache = await caches.open(`${this.CACHE_NAME}-${this.CACHE_VERSION}`);
        const response = new Response(blob, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'max-age=604800', // 7 days
            'X-Cached-At': Date.now().toString()
          }
        });
        await cache.put(url, response);
      }
    } catch (error) {
      console.warn('Failed to cache tile:', error);
    }
  }

  static async getCachedTile(url: string): Promise<Blob | null> {
    try {
      if ('caches' in window) {
        const cache = await caches.open(`${this.CACHE_NAME}-${this.CACHE_VERSION}`);
        const response = await cache.match(url);
        
        if (response) {
          const cachedAt = response.headers.get('X-Cached-At');
          if (cachedAt && Date.now() - parseInt(cachedAt) < this.TILE_EXPIRY) {
            return await response.blob();
          } else {
            // Expired, remove from cache
            await cache.delete(url);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get cached tile:', error);
    }
    return null;
  }

  static async preloadDubaiTiles(): Promise<void> {
    const tiles = this.generateDubaiTileUrls();
    const batchSize = 5;
    
    for (let i = 0; i < tiles.length; i += batchSize) {
      const batch = tiles.slice(i, i + batchSize);
      await Promise.all(batch.map(url => this.fetchAndCacheTile(url)));
      
      // Small delay between batches to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private static async fetchAndCacheTile(url: string): Promise<void> {
    try {
      // Check if already cached
      const cached = await this.getCachedTile(url);
      if (cached) return;

      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        await this.cacheTile(url, blob);
      }
    } catch (error) {
      console.warn('Failed to fetch and cache tile:', url, error);
    }
  }

  private static generateDubaiTileUrls(): string[] {
    const urls: string[] = [];
    const baseUrl = 'https://tile.openstreetmap.org';
    
    // Dubai area bounds
    const bounds = {
      minLat: 24.9,
      maxLat: 25.3,
      minLng: 55.0,
      maxLng: 55.5
    };

    // Generate tiles for zoom levels 10-15
    for (let z = 10; z <= 15; z++) {
      const minX = Math.floor(((bounds.minLng + 180) / 360) * Math.pow(2, z));
      const maxX = Math.floor(((bounds.maxLng + 180) / 360) * Math.pow(2, z));
      const minY = Math.floor((1 - Math.log(Math.tan(bounds.maxLat * Math.PI / 180) + 1 / Math.cos(bounds.maxLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
      const maxY = Math.floor((1 - Math.log(Math.tan(bounds.minLat * Math.PI / 180) + 1 / Math.cos(bounds.minLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          urls.push(`${baseUrl}/${z}/${x}/${y}.png`);
        }
      }
    }

    return urls;
  }

  static async clearCache(): Promise<void> {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => name.startsWith(this.CACHE_NAME))
            .map(name => caches.delete(name))
        );
      }
    } catch (error) {
      console.warn('Failed to clear tile cache:', error);
    }
  }

  static async getCacheSize(): Promise<number> {
    try {
      if ('caches' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.usage || 0;
      }
    } catch (error) {
      console.warn('Failed to get cache size:', error);
    }
    return 0;
  }
}