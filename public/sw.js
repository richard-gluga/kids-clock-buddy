/**
 * Service Worker used to implement offline mode for PWA.
 * Adapted from https://medium.com/swlh/how-to-make-your-web-apps-work-offline-be6f27dd28e
 */



const CACHE_NAME = "KidsClockBuddy"; // The string used to identify our cache

/** 
 * Cache-first-network-fallback auto-update dynamic caching strategy.
 * 
 * Tries to always return the cached version of a request as soon as possible,
 * to minimize user latency. However, if a result is not in the cache, it will
 * make a network call and wait for the network response, add that to cache, 
 * and return it.
 * 
 * If a result is already in the cache, it still triggers a network call in 
 * the background, which will update the cache with the latest response, but
 * this doesn't block the immediate response, which is the cached version.
 */
self.addEventListener('fetch', async (event) => {
    console.warn('ServiceWorker fetch', event.request)
    event.respondWith(async function () {
        console.warn('Starting Fetch', event.request);
        // First, try to get a response from the cache and store it.  
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);

        // Make network request and store response in cache if possible.
        // This is a non-blocking async call for now.
        const networkResponsePromise = fetch(event.request).then(async (response) => {
            console.warn('...updating cache from network', event.request);
            await cache.put(event.request, response);
        });

        // Now if we already have a cache response, return it. The network call
        // will continue in background and update the cache for the next request.
        if (cachedResponse) {
            console.warn('...returning cached response', event.request);
            return cachedResponse;
        }

        // Otherwise if cache was empty, wait for the network response to complete,
        // which will update the cache, so we can return the fresh cached response.
        await networkResponsePromise;
        const newCachedResponse = await cache.match(event.request);
        console.warn('...returning network response', event.request);
        return newCachedResponse;
    }());
});