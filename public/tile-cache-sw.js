// public/tile-cache-sw.js
const CACHE_NAME = 'dubai-map-tiles-v1';
const TILE_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// Install event - cache core tiles
self.addEventListener('install', (event) => {
  console.log('Tile cache service worker installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Tile cache service worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('dubai-map-tiles-') && cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - intercept tile requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle tile requests
  if (isTileRequest(url)) {
    event.respondWith(handleTileRequest(event.request));
  }
});

function isTileRequest(url) {
  return (
    (url.hostname === 'tile.openstreetmap.org' || 
     url.hostname.includes('openstreetmap.org')) &&
    url.pathname.match(/\/\d+\/\d+\/\d+\.png$/)
  );
}

async function handleTileRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try to get from cache first
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const cachedAt = cachedResponse.headers.get('x-cached-at');
      if (cachedAt && Date.now() - parseInt(cachedAt) < TILE_CACHE_EXPIRY) {
        return cachedResponse;
      } else {
        // Expired, delete from cache
        await cache.delete(request);
      }
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone the response to cache it
      const responseToCache = networkResponse.clone();
      
      // Add caching headers
      const headers = new Headers(responseToCache.headers);
      headers.set('x-cached-at', Date.now().toString());
      headers.set('cache-control', 'max-age=604800'); // 7 days
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      // Cache the response
      await cache.put(request, cachedResponse);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.warn('Tile fetch failed:', error);
    
    // Try to return stale cache if available
    const staleResponse = await cache.match(request);
    if (staleResponse) {
      return staleResponse;
    }
    
    // Return a placeholder tile if all else fails
    return new Response(createPlaceholderTile(), {
      headers: { 'Content-Type': 'image/png' }
    });
  }
}

function createPlaceholderTile() {
  // Create a simple gray tile as placeholder
  const canvas = new OffscreenCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, 256, 256);
  
  ctx.strokeStyle = '#ddd';
  ctx.strokeRect(0, 0, 256, 256);
  
  ctx.fillStyle = '#999';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Map Unavailable', 128, 128);
  
  return canvas.convertToBlob({ type: 'image/png' });
}