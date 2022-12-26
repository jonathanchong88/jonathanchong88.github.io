'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "version.json": "f2776bb7204e9a0562dd988f37ad84b5",
"index.html": "8d99fdcbd91ee39b20c6b1e1b76b9fd6",
"/": "8d99fdcbd91ee39b20c6b1e1b76b9fd6",
"main.dart.js": "f461889b6b7d0096172e50085e8e9bd8",
"flutter.js": "f85e6fb278b0fd20c349186fb46ae36d",
"favicon.png": "e6fa2dd2fed08ebaf6c517c71ae2fc82",
"icons/Icon-192.png": "989931a8e92b5447aea3224ddcb98ba1",
"icons/Icon-maskable-192.png": "989931a8e92b5447aea3224ddcb98ba1",
"icons/Icon-maskable-512.png": "f405d7bfe4afed741ab0588e88fb7c0a",
"icons/Icon-512.png": "f405d7bfe4afed741ab0588e88fb7c0a",
"manifest.json": "dd8ed880b6cfb669e618291d3019f25c",
"assets/AssetManifest.json": "5eeac452577f9122969e427c5d3506d2",
"assets/NOTICES": "1584ab51e210c1c8116a4c7877f62467",
"assets/FontManifest.json": "3339101697bcdca790ca8864ebb8239e",
"assets/shaders/ink_sparkle.frag": "5e48fdb891782e1d5a46fd4443a002d6",
"assets/fonts/MaterialIcons-Regular.otf": "95db9098c58fd6db106f1116bae85a0b",
"assets/assets/products/plate-and-bowl.jpg": "0ca460fd44b7bd9df6b4aa4555eb7b11",
"assets/assets/products/piggy-green.jpg": "8fb36574293f4645814d235546eaeeb3",
"assets/assets/products/pasta-plate.jpg": "20b26160ffafa84079e716e0c6eda6e0",
"assets/assets/products/flowers-plate.jpg": "d9f8b4637080cc558a61d5e6cc0fb703",
"assets/assets/products/pizza-plate.jpg": "f412807166f70f755a7305e27496d80e",
"assets/assets/products/mozzarella-plate.jpg": "3db9f7b08270ddd9e231ea960991fc4d",
"assets/assets/products/salt-pepper-lemon.jpg": "b8f82e660bb957f610de17cce195bc1c",
"assets/assets/products/bruschetta-plate.jpg": "6c3f90646092436bb38211c7c65c6137",
"assets/assets/products/snacks-plate.jpg": "b9d5d03238db372b6701e6d50ab7ed1f",
"assets/assets/products/piggy-blue.jpg": "9ce95150fdf6ba4d548560769c7ffbba",
"assets/assets/products/piggy-pink.jpg": "30dbb0b23668b52f8bd8f94cf2d9c3e7",
"assets/assets/products/honey-pot.jpg": "cc30c607c726780473239e72ae9aa7f2",
"assets/assets/products/salt-pepper-olives.jpg": "fb2a42970907bcf151778094772c6c00",
"assets/assets/products/juicer-citrus-fruits.jpg": "91f38234964068d3289fd177c6e0a9a4",
"assets/assets/fonts/Roboto-Regular.ttf": "8a36205bd9b83e03af0591a004bc97f4",
"canvaskit/canvaskit.js": "2bc454a691c631b07a9307ac4ca47797",
"canvaskit/profiling/canvaskit.js": "38164e5a72bdad0faa4ce740c9b8e564",
"canvaskit/profiling/canvaskit.wasm": "95a45378b69e77af5ed2bc72b2209b94",
"canvaskit/canvaskit.wasm": "bf50631470eb967688cca13ee181af62"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "main.dart.js",
"index.html",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
