const CACHE_NAME = "anonchat-pro-v2";
const urlsToCache = [
  "/",
  "/index.html",
  "/index.css",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// Install Service Worker
self.addEventListener("install", (event) => {
  console.log("⚡ Service Worker installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("📦 Opened cache");
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker activated");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("🗑️ Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Strategy: Network First, fallback to Cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone();

        // Only cache GET requests (caching POST/PUT/DELETE can fail)
        if (event.request.method === "GET") {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // If not in cache, return offline page
          return new Response("Offline - Please check your connection", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
      })
  );
});

// ====================
// PUSH NOTIFICATIONS
// ====================

// Handle Push Notifications
self.addEventListener("push", (event) => {
  console.log("🔔 Push notification received");

  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || "New notification from AnonChat Pro",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    tag: data.tag || "default",
    requireInteraction: false,
    data: {
      url: data.url || "/",
      timestamp: Date.now(),
      type: data.type || "default",
    },
    actions: [
      { action: "open", title: "Open" },
      { action: "close", title: "Dismiss" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "AnonChat Pro", options)
  );
});

// Handle Notification Click
self.addEventListener("notificationclick", (event) => {
  console.log("🖱️ Notification clicked:", event.action);

  event.notification.close();

  if (event.action === "open" || !event.action) {
    // Open the app when notification is clicked
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (let client of clientList) {
            if (
              client.url === event.notification.data.url &&
              "focus" in client
            ) {
              return client.focus();
            }
          }
          // If not open, open new window
          if (clients.openWindow) {
            return clients.openWindow(event.notification.data.url || "/");
          }
        })
    );
  }
});

// Handle Notification Close
self.addEventListener("notificationclose", (event) => {
  console.log("❌ Notification closed:", event.notification.tag);
  // Optional: Track notification dismissal analytics here
});

// Handle messages from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  // Handle refresh request
  if (event.data && event.data.type === "REFRESH") {
    console.log("🔄 Refreshing cache...");
    caches.open(CACHE_NAME).then((cache) => {
      cache.keys().then((keys) => {
        keys.forEach((key) => cache.delete(key));
      });
    });
  }
});
