// components/mapping/CachedTileLayer.tsx
import React, { useEffect } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

interface CachedTileLayerProps {
  url?: string;
  attribution?: string;
  maxZoom?: number;
  minZoom?: number;
}

// Dubai-specific tile bounds for preloading
const DUBAI_TILE_BOUNDS = {
  minLat: 24.8,
  maxLat: 25.4,
  minLng: 54.9,
  maxLng: 55.6,
  minZoom: 10,
  maxZoom: 16
};

export const CachedTileLayer: React.FC<CachedTileLayerProps> = ({
  url = "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom = 18,
  minZoom = 9
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Create a custom tile layer with caching
    const cachedTileLayer = L.tileLayer(url, {
      attribution,
      maxZoom,
      minZoom,
      // Performance optimizations
      keepBuffer: 4, // Keep more tiles in memory
      updateWhenIdle: true,
      updateWhenZooming: false,
      updateInterval: 150,
      // Caching options
      crossOrigin: 'anonymous',
      // Load tiles more aggressively
      bounds: L.latLngBounds([DUBAI_TILE_BOUNDS.minLat, DUBAI_TILE_BOUNDS.minLng], [DUBAI_TILE_BOUNDS.maxLat, DUBAI_TILE_BOUNDS.maxLng])
    });

    // Override the tile loading to add caching
    const originalCreateTile = cachedTileLayer.createTile;
    cachedTileLayer.createTile = function(coords: any, done: Function) {
      const tile = originalCreateTile.call(this, coords, done);
      const url = this.getTileUrl(coords);
      
      // Try to load from cache first
      const cachedTile = getCachedTile(url);
      if (cachedTile) {
        tile.src = cachedTile;
        return tile;
      }

      // Cache the tile when it loads
      tile.addEventListener('load', () => {
        cacheTile(url, tile.src);
      });

      return tile;
    };

    // Add to map
    cachedTileLayer.addTo(map);

    // Preload Dubai area tiles
    preloadDubaiTiles(cachedTileLayer);

    return () => {
      if (map.hasLayer(cachedTileLayer)) {
        map.removeLayer(cachedTileLayer);
      }
    };
  }, [map, url, attribution, maxZoom, minZoom]);

  return null;
};

// Cache management functions
function getCachedTile(url: string): string | null {
  try {
    const cached = localStorage.getItem(`tile_${btoa(url)}`);
    if (cached) {
      const data = JSON.parse(cached);
      // Check if cache is still valid (24 hours)
      if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        return data.dataUrl;
      } else {
        localStorage.removeItem(`tile_${btoa(url)}`);
      }
    }
  } catch (error) {
    console.warn('Error reading cached tile:', error);
  }
  return null;
}

function cacheTile(url: string, imageSrc: string): void {
  try {
    // Convert image to data URL for caching
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const cacheData = {
        dataUrl,
        timestamp: Date.now()
      };
      
      // Check storage size before caching
      if (getStorageSize() < 10 * 1024 * 1024) { // 10MB limit
        localStorage.setItem(`tile_${btoa(url)}`, JSON.stringify(cacheData));
      }
    };
    img.src = imageSrc;
  } catch (error) {
    console.warn('Error caching tile:', error);
  }
}

function getStorageSize(): number {
  let size = 0;
  try {
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith('tile_')) {
        size += localStorage[key].length;
      }
    }
  } catch (error) {
    console.warn('Error calculating storage size:', error);
  }
  return size;
}

function preloadDubaiTiles(tileLayer: any): void {
  // Preload key Dubai area tiles at zoom levels 11-13
  setTimeout(() => {
    for (let z = 11; z <= 13; z++) {
      const bounds = L.latLngBounds([24.95, 55.0], [25.35, 55.5]);
      const tileBounds = tileLayer._pxBoundsToTileRange(tileLayer._latLngBoundsToPixelBounds(bounds, z));
      
      for (let x = tileBounds.min.x; x <= tileBounds.max.x; x++) {
        for (let y = tileBounds.min.y; y <= tileBounds.max.y; y++) {
          const coords = { x, y, z };
          const url = tileLayer.getTileUrl(coords);
          
          // Preload in background if not cached
          if (!getCachedTile(url)) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => cacheTile(url, img.src);
            img.src = url;
          }
        }
      }
    }
  }, 2000); // Start preloading after 2 seconds
}