const CACHE_NAME = "warraq-shell-v20";
const RUNTIME_CACHE = "warraq-runtime-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./app.js?v=20260918-17",
  "./styles.css?v=20260918-17",
  "./privacy.html",
  "./terms.html"
];

const RUNTIME_ASSETS = [
  "https://cdn.tailwindcss.com",
  "https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js",
  "https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const shell = await caches.open(CACHE_NAME);
    await shell.addAll(APP_SHELL);

    const runtime = await caches.open(RUNTIME_CACHE);
    await Promise.allSettled(
      RUNTIME_ASSETS.map(url => runtime.add(new Request(url, { mode: "cors" })))
    );
  })());
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => ![CACHE_NAME, RUNTIME_CACHE].includes(key))
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isRuntimeAsset = RUNTIME_ASSETS.includes(event.request.url);

  if (event.request.mode === "navigate" && isSameOrigin) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  if (isRuntimeAsset) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const network = fetch(event.request)
          .then(response => {
            if (response && response.ok) {
              const copy = response.clone();
              caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  if (!isSameOrigin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});


self.addEventListener("push", event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "ورّاق", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "ورّاق";
  const options = {
    body: data.body || "لديك إشعار جديد في ورّاق",
    dir: "rtl",
    lang: "ar",
    tag: data.notification_id ? "warraq-" + data.notification_id : "warraq-notification",
    renotify: true,
    data: {
      notification_id: data.notification_id || null,
      type: data.type || "system",
      book_id: data.book_id || null,
      order_id: data.order_id || null,
      url: data.url || "./?open=notifications"
    },
    timestamp: data.created_at ? Date.parse(data.created_at) : Date.now(),
    vibrate: [120, 60, 120]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  event.waitUntil((async () => {
    const data = event.notification.data || {};
    const targetUrl = new URL(data.url || "./?open=notifications", self.location.origin).href;
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.focus();
        client.postMessage({
          type: "WARAAQ_NOTIFICATION_CLICK",
          notification_id: data.notification_id || null,
          notification_type: data.type || "system",
          book_id: data.book_id || null,
          order_id: data.order_id || null
        });
        return;
      }
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow(targetUrl);
    }
  })());
});
