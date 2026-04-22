// ─────────────────────────────────────────────────────────────────────────────
//  NOC VISOR — Service Worker
//  Coloca este archivo en: /public/noc-sw.js
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_NAME = "noc-visor-v1";

// Instalar SW
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

// ── Recibir mensaje desde la app para mostrar notificación push ──────────────
self.addEventListener("message", event => {
  const { type, payload } = event.data || {};

  if (type === "NOTIFY_CAIDA") {
    const { count, rutas } = payload;
    self.registration.showNotification("🔴 ALERTA NOC — DWDM", {
      body: `${count} caída${count > 1 ? "s" : ""} activa${count > 1 ? "s" : ""}:\n${rutas.join("\n")}`,
      icon:  "/logo.ico",
      badge: "/logo.ico",
      tag:   "noc-caida",          // reemplaza la anterior, no apila
      renotify: true,
      requireInteraction: true,    // no desaparece hasta que el usuario la cierra
      vibrate: [300, 100, 300],
      data: { url: self.location.origin },
      actions: [
        { action: "abrir", title: "📡 Ver monitoreo" },
        { action: "cerrar", title: "Cerrar" },
      ],
    });
  }

  if (type === "NOTIFY_RECUPERADO") {
    const { rutas } = payload;
    self.registration.showNotification("✅ RECUPERADO — NOC DWDM", {
      body: `Tramo restaurado:\n${rutas.join("\n")}`,
      icon:  "/logo.ico",
      badge: "/logo.ico",
      tag:   "noc-recuperado",
      renotify: true,
      data: { url: self.location.origin },
    });
  }
});

// ── Al tocar la notificación, abrir/enfocar la app ───────────────────────────
self.addEventListener("notificationclick", event => {
  event.notification.close();
  if (event.action === "cerrar") return;

  const targetUrl = event.notification.data?.url || self.location.origin;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.startsWith(targetUrl));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});