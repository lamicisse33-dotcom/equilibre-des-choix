const VERSION = 'v5';
const CACHE_NAME = `equilibre-${VERSION}`;

// Distant : mis en cache a la volee, jamais en precache (echec reseau = install KO)
const CDN = ['unpkg.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'esm.sh'];

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './rosebud-game-defaults.css',
  './rosebud-game-defaults.js',
  './audio-controller.js',
  './card-controller.js',
  './config-controller.js',
  './duel-controller.js',
  './game-config.js',
  './game-engine.js',
  './home-controller.js',
  './main.js',
  './narrative-controller.js',
  './narrative-events.js',
  './persistence-controller.js',
  './scene-manager.js',
  './table-controller.js',
  './transition-controller.js',
  './ui-controller.js',
  './vfx-controller.js',
  './assets/audio/balance-level-harmony-chord.mp3',
  './assets/audio/balance-tilt-mechanical-creak.mp3',
  './assets/audio/card-appear-soft-rustle.mp3',
  './assets/audio/card-fade-soft-wind-v3.mp3',
  './assets/audio/card-flip-sfx.mp3',
  './assets/audio/card-hover-soft-tick.mp3',
  './assets/audio/card-play-elegant-bell-v2.mp3',
  './assets/audio/card-select-ping-minimal.mp3',
  './assets/audio/equilibre-defeat-calm-ambient.mp3',
  './assets/audio/equilibre-heritage-theme-v2.mp3',
  './assets/audio/equilibre-milestone-victory.mp3',
  './assets/audio/equilibre-reflection-layer.mp3',
  './assets/audio/equilibre-sonic-signature.mp3',
  './assets/audio/game-over-chime-soft.mp3',
  './assets/audio/harmony-chime.mp3',
  './assets/audio/pillar-health-water-rustle-v2.mp3',
  './assets/audio/pillar-love-harp-pluck.mp3',
  './assets/audio/pillar-money-refined-coin-v2.mp3',
  './assets/audio/pillar-spirit-chime-breath.mp3',
  './assets/audio/pillar-update-sfx.mp3',
  './assets/audio/ui-button-discrete-click.mp3',
  './assets/audio/ui-button-soft-confirm.mp3',
  './assets/audio/zen-equilibrium-ambient.mp3',
  './assets/card-back-texture-v2.webp',
  './assets/event_eclipse_art.webp',
  './assets/event_festival_art.webp',
  './assets/event_gold_rush_art.webp',
  './assets/event_spring_art.webp',
  './assets/gold-engraved-border.webp',
  './assets/harmony_art.webp',
  './assets/health_art.webp',
  './assets/icon-pillar-health-minimal.webp',
  './assets/icon-pillar-love-minimal.webp',
  './assets/icon-pillar-money-minimal.webp',
  './assets/icon-pillar-spirituality-minimal.webp',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/legendary_life_art.webp',
  './assets/legendary_love_art.webp',
  './assets/legendary_spirit_art.webp',
  './assets/legendary_wealth_art.webp',
  './assets/love_art.webp',
  './assets/models/prestigious-table.glb',
  './assets/models/zen-rock-stack.glb',
  './assets/money_art.webp',
  './assets/noble-wood-texture.webp',
  './assets/spirituality_art.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // addAll est atomique : un seul 404 annule tout. On tolere les manquants.
    await Promise.all(ASSETS.map(u => cache.add(u).catch(e => console.warn('SW skip', u, e))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isCDN = CDN.some(h => url.hostname.endsWith(h));

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      // On archive aussi les dependances CDN au premier passage
      if (res && (res.ok || res.type === 'opaque') && (isCDN || url.origin === location.origin)) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, res.clone());
      }
      return res;
    } catch (e) {
      const fallback = await caches.match('./index.html');
      if (req.mode === 'navigate' && fallback) return fallback;
      throw e;
    }
  })());
});
