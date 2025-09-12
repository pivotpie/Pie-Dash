// components/mapping/MapPreloader.tsx
import { useEffect, useState } from 'react';

interface MapPreloaderProps {
  onPreloadComplete?: () => void;
}

export const MapPreloader: React.FC<MapPreloaderProps> = ({ onPreloadComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isPreloading, setIsPreloading] = useState(false);

  useEffect(() => {
    // Check if we need to preload
    const hasPreloaded = localStorage.getItem('map_tiles_preloaded');
    const lastPreload = hasPreloaded ? parseInt(hasPreloaded) : 0;
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

    if (!hasPreloaded || lastPreload < oneDayAgo) {
      startPreloading();
    } else {
      onPreloadComplete?.();
    }
  }, [onPreloadComplete]);

  const startPreloading = async () => {
    setIsPreloading(true);
    
    try {
      // Preload key Dubai area tiles
      const dubaiTiles = generateDubaiTileUrls();
      const totalTiles = dubaiTiles.length;
      let loadedTiles = 0;

      const preloadPromises = dubaiTiles.map((url, index) => 
        new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          const onLoad = () => {
            loadedTiles++;
            setProgress(Math.round((loadedTiles / totalTiles) * 100));
            
            // Cache the tile
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = img.width;
              canvas.height = img.height;
              ctx?.drawImage(img, 0, 0);
              
              const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
              const cacheKey = `tile_${btoa(url)}`;
              const cacheData = { dataUrl, timestamp: Date.now() };
              
              localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            } catch (error) {
              console.warn('Failed to cache tile:', error);
            }
            
            resolve();
          };

          const onError = () => {
            loadedTiles++;
            setProgress(Math.round((loadedTiles / totalTiles) * 100));
            resolve();
          };

          img.onload = onLoad;
          img.onerror = onError;
          
          // Add delay to avoid overwhelming the server
          setTimeout(() => {
            img.src = url;
          }, index * 50);
        })
      );

      await Promise.all(preloadPromises);
      
      // Mark as preloaded
      localStorage.setItem('map_tiles_preloaded', Date.now().toString());
      
      setIsPreloading(false);
      onPreloadComplete?.();
      
    } catch (error) {
      console.error('Preloading failed:', error);
      setIsPreloading(false);
      onPreloadComplete?.();
    }
  };

  if (!isPreloading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="text-center">
          <div className="mb-4">
            <div className="text-2xl mb-2">🗺️</div>
            <h3 className="text-lg font-semibold mb-2">Preparing Maps</h3>
            <p className="text-sm text-gray-600 mb-4">
              Downloading Dubai map tiles for faster performance...
            </p>
          </div>
          
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600 mt-2">{progress}% complete</div>
          </div>
          
          <div className="text-xs text-gray-500">
            This will make maps load much faster on subsequent visits
          </div>
        </div>
      </div>
    </div>
  );
};

function generateDubaiTileUrls(): string[] {
  const urls: string[] = [];
  const baseUrl = 'https://tile.openstreetmap.org';
  
  // Dubai bounds
  const bounds = {
    minLat: 24.9,
    maxLat: 25.3,
    minLng: 55.0,
    maxLng: 55.5
  };

  // Generate tiles for zoom levels 11-14
  for (let z = 11; z <= 14; z++) {
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

  // Limit to most important tiles (center of Dubai)
  return urls.slice(0, 150);
}