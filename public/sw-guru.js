/* GAS Guru service worker — cache ringan + tampilkan notifikasi */
const CACHE = "gas-guru-v1";
const PRECACHE = ["/guru", "/guru/manifest.json", "/tutorial/gas-siswa/logo-aplikasi.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/guru")) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/guru/notifikasi";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client && client.url.includes("/guru")) {
          client.navigate(target);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
      return undefined;
    })
  );
});

self.addEventListener("push", (event) => {
  let payload = { title: "GAS Guru", body: "Ada pembaruan untuk kelas Anda.", url: "/guru/notifikasi" };
  try {
    if (event.data) {
      const data = event.data.json();
      payload = {
        title: data.title || payload.title,
        body: data.body || data.message || payload.body,
        url: data.url || payload.url,
      };
    }
  } catch {
    const text = event.data ? event.data.text() : "";
    if (text) payload.body = text;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/tutorial/gas-siswa/logo-aplikasi.png",
      badge: "/tutorial/gas-siswa/logo-aplikasi.png",
      data: { url: payload.url },
    })
  );
});
