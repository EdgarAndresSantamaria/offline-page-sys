'use strict';

var cacheVersion = 1;
var currentCache = {
  offline: 'offline-cache' + cacheVersion
};
const offlineUrl = 'damas/offline-page.html';

function createCacheBustedRequest(url){
  let request = new Request(url,{cache:'reload'});
  if('cache' in request){
    return request;
  }
  let bustedUrl = new URL(url,self.location.href);
  bustedUrl.search = (bustedUrl.search ? '&':'') + 'cacheBust='+Date.now();
  return new Request(bustedUrl);
}

this.addEventListener('install', event => {
  event.waitUntil(
    caches.open(currentCache.offline).then(function(cache) {
      cache.add(new Request(offlineUrl, {credentials: 'same-origin', redirect: 'follow'}));
      cache.add(new Request('damas/img/offline.svg', {credentials: 'same-origin', redirect: 'follow'}));
      return cache;
    })
  );
});

this.addEventListener('fetch', event => {
  // request.mode = navigate isn't supported in all browsers
  // so include a check for Accept: text/html header.
  if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
        event.respondWith(
          fetch( new Request(createCacheBustedRequest(event.request.url),{credentials: 'same-origin', redirect: 'follow'}))
          .catch(error => {
            console.log('Fetch failed; returning offline page instead.', error);
            console.log(caches.match(offlineUrl))
            return caches.match(offlineUrl);
          })
    );
  }
  else{
        // Respond with everything else if we can
        event.respondWith(caches.match(event.request)
                        .then(function (response) {
                        return response || fetch(event.request);
                    })
            );
      }
});
