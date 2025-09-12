// services/mapTileService.ts
export class MapTileService {
  private static readonly CACHE_NAME = 'pie-dash-map-tiles';
  private static readonly TILE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private static readonly DUBAI_BOUNDS = {
    north: 25.4,
    south: 24.8,
    east: 55.6,
    west: 54.9
  };

  // Fast tile servers (multiple fallbacks)
  private static readonly TILE_SERVERS = [
    {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
      subdomains: ['a', 'b', 'c']
    },
    {
      url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
      attribution: '© CartoDB © OpenStreetMap contributors',
      maxZoom: 18,
      subdomains: ['a', 'b', 'c', 'd']
    },
    {
      url: 'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png',
      attribution: '© Stadia Maps © OpenStreetMap contributors',
      maxZoom: 20,
      subdomains: []
    }
  ];

  // Get optimized tile layer configuration
  static getTileLayerConfig() {
    return {
      url: this.TILE_SERVERS[0].url,
      attribution: this.TILE_SERVERS[0].attribution,
      maxZoom: 16, // Reduced for Dubai area
      minZoom: 10, // Start higher for Dubai
      zoomOffset: 0,
      zoomReverse: false,
      detectRetina: true,
      crossOrigin: true,
      // Performance optimizations
      updateWhenIdle: true,
      updateWhenZooming: false,
      keepBuffer: 4, // Keep more tiles in memory
      // Bounds for Dubai area only
      bounds: [
        [this.DUBAI_BOUNDS.south, this.DUBAI_BOUNDS.west],
        [this.DUBAI_BOUNDS.north, this.DUBAI_BOUNDS.east]
      ],
      // Cache settings
      useCache: true,
      cacheMaxAge: this.TILE_CACHE_DURATION,
      // Error handling
      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      // Loading optimization
      subdomains: this.TILE_SERVERS[0].subdomains
    };
  }

  // Preload tiles for Dubai area
  static async preloadDubaiTiles(): Promise<void> {
    console.log('Preloading Dubai map tiles...');
    
    // Define zoom levels to preload (focus on most used zoom levels)
    const zoomLevels = [11, 12, 13];
    
    for (const zoom of zoomLevels) {
      const tiles = this.getTilesForBounds(
        this.DUBAI_BOUNDS.south,
        this.DUBAI_BOUNDS.north,
        this.DUBAI_BOUNDS.west,
        this.DUBAI_BOUNDS.east,
        zoom
      );
      
      // Preload in batches to avoid overwhelming the browser
      const batchSize = 10;
      for (let i = 0; i < tiles.length; i += batchSize) {
        const batch = tiles.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map(tile => this.preloadTile(tile.x, tile.y, tile.z))
        );
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('Dubai tiles preloaded successfully');
  }

  // Calculate tile coordinates for given bounds
  private static getTilesForBounds(south: number, north: number, west: number, east: number, zoom: number) {
    const tiles = [];
    
    const northWestTile = this.deg2tile(north, west, zoom);
    const southEastTile = this.deg2tile(south, east, zoom);
    
    for (let x = northWestTile.x; x <= southEastTile.x; x++) {
      for (let y = northWestTile.y; y <= southEastTile.y; y++) {
        tiles.push({ x, y, z: zoom });
      }
    }
    
    return tiles;
  }

  // Convert degrees to tile coordinates
  private static deg2tile(lat: number, lon: number, zoom: number) {
    const latRad = lat * Math.PI / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor((lon + 180) / 360 * n);
    const y = Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n);
    return { x, y };
  }

  // Preload individual tile
  private static async preloadTile(x: number, y: number, z: number): Promise<void> {
    const url = this.TILE_SERVERS[0].url
      .replace('{z}', z.toString())
      .replace('{x}', x.toString())
      .replace('{y}', y.toString())
      .replace('{s}', this.TILE_SERVERS[0].subdomains[0]);
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        // Store in cache if Cache API is available
        if ('caches' in window) {
          const cache = await caches.open(this.CACHE_NAME);
          await cache.put(url, new Response(blob));
        }
      }
    } catch (error) {
      console.warn(`Failed to preload tile ${z}/${x}/${y}:`, error);
    }
  }

  // Get cached tile or fetch from network
  static async getCachedTile(url: string): Promise<Response | null> {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.CACHE_NAME);
        const cachedResponse = await cache.match(url);
        
        if (cachedResponse) {
          // Check if cache is still valid
          const cacheTime = new Date(cachedResponse.headers.get('date') || '').getTime();
          const now = Date.now();
          
          if (now - cacheTime < this.TILE_CACHE_DURATION) {
            return cachedResponse;
          } else {
            // Cache expired, delete it
            await cache.delete(url);
          }
        }
      } catch (error) {
        console.warn('Cache access failed:', error);
      }
    }
    
    return null;
  }

  // Clear old cache data
  static async clearOldCache(): Promise<void> {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.CACHE_NAME);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const cacheTime = new Date(response.headers.get('date') || '').getTime();
            const now = Date.now();
            
            if (now - cacheTime >= this.TILE_CACHE_DURATION) {
              await cache.delete(request);
            }
          }
        }
      } catch (error) {
        console.warn('Cache cleanup failed:', error);
      }
    }
  }

  // Initialize map tile optimization
  static async initialize(): Promise<void> {
    console.log('Initializing map tile service...');
    
    // Clear old cache
    await this.clearOldCache();
    
    // Start preloading in background (non-blocking)
    this.preloadDubaiTiles().catch(error => {
      console.warn('Tile preloading failed:', error);
    });
  }
}