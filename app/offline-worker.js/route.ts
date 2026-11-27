export const dynamic = "force-static";
// Generated once per production build so each shell stays paired with its chunks.
export function GET() {
  const cache = JSON.stringify("calvary-shell-" + crypto.randomUUID());
  return new Response(
    `
const cacheName = ${cache};
self.addEventListener("install", event => event.waitUntil((async () => {
  const cache = await caches.open(cacheName);
  const shell = await fetch("/offline", {credentials:"omit", cache:"reload", redirect:"error"});
  if (!shell.ok) throw Error("Offline screen unavailable");
  const html = await shell.clone().text();
  const assets = Array.from(html.matchAll(/(?:src|href)="(\\/_next\\/static\\/[^"]+)"/g), match => match[1].replaceAll("&amp;", "&"));
  if (!assets.some(url => url.includes(".js"))) throw Error("Missing offline scripts");
  await cache.addAll([...new Set(assets)]);
  await cache.put("/offline", shell);
  await self.skipWaiting();
})()));
self.addEventListener("activate", event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith("calvary-shell-") && key !== cacheName) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener("fetch", event => {
  const req = event.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(caches.open(cacheName).then(async cache => await cache.match(req) || fetch(req)));
  } else if (req.mode === "navigate" && url.pathname === "/offline") {
    event.respondWith(caches.open(cacheName).then(async cache => await cache.match("/offline") || fetch(req)));
  } else if (req.mode === "navigate" && /^\\/(?:$|dashboard$|contributions(?:\\/new)?$)/.test(url.pathname)) {
    event.respondWith(fetch(req).catch(() => Response.redirect(url.origin + "/offline")));
  }
});
`,
    {
      headers: {
        "Content-Type": "text/javascript",
        "Cache-Control": "no-cache",
        "Service-Worker-Allowed": "/",
      },
    },
  );
}
