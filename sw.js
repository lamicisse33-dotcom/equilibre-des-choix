const VERSION = 'v61';
const CACHE_NAME = `equilibre-${VERSION}`;

// Dependances distantes : mises en cache a la volee, jamais en precache
// (un CDN lent ferait echouer toute l'installation).
const CDN = ['unpkg.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'esm.sh'];

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
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
  './assets/card-back-texture-v2.webp',
  './assets/card-back-texture.webp',
  './assets/event_eclipse_art.webp',
  './assets/event_festival_art.webp',
  './assets/event_gold_rush_art.webp',
  './assets/event_spring_art.webp',
  './assets/gold-engraved-border.webp',
  './assets/harmony_art.webp',
  './assets/health_art.webp',
  './assets/icon-health.webp',
  './assets/icon-love.webp',
  './assets/icon-money.webp',
  './assets/icon-pillar-health-minimal.webp',
  './assets/icon-pillar-love-minimal.webp',
  './assets/icon-pillar-money-minimal.webp',
  './assets/icon-pillar-spirituality-minimal.webp',
  './assets/icon-spirituality.webp',
  './assets/illustration-health.webp',
  './assets/illustration-love.webp',
  './assets/illustration-money.webp',
  './assets/illustration-spirituality.webp',
  './assets/legendary_life_art.webp',
  './assets/legendary_love_art.webp',
  './assets/legendary_spirit_art.webp',
  './assets/legendary_wealth_art.webp',
  './assets/love_art.webp',
  './assets/money_art.webp',
  './assets/noble-wood-texture.webp',
  './assets/spirituality_art.webp',
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
  './assets/audio/equilibre-heritage-theme.mp3',
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
  './assets/audio/zen-prestige-ambience-long.mp3',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/models/prestigious-table.glb',
  './assets/models/zen-rock-stack.glb',
];

// Le precache entrait en concurrence avec le chargement de la page : le
// telephone lançait 79 requetes supplementaires pendant que le jeu attendait
// ses textures. Il est desormais differe, lance une seule fois, apres que la
// page a eu le temps de se charger.
let precacheLance = false;
async function precacher() {
  if (precacheLance) return;
  precacheLance = true;
  const cache = await caches.open(CACHE_NAME);
  // Par lots de 4 : cache.addAll est atomique, un seul 404 annulerait tout.
  for (let i = 0; i < ASSETS.length; i += 4) {
    await Promise.all(ASSETS.slice(i, i + 4)
      .map(u => cache.add(u).catch(e => console.warn('SW ignore', u, e))));
  }
  console.log('SW : mise en cache hors ligne terminee.');
}

self.addEventListener('install', (event) => {
  // Plus de skipWaiting automatique : la nouvelle version reste en attente et
  // c'est le joueur qui decide de l'appliquer. Basculer en pleine partie
  // remplacerait les fichiers sous ses pieds.
});

self.addEventListener('message', (event) => {
  if (event.data === 'precache') precacher();
  // Le joueur a accepte la mise a jour : on prend la main, la page rechargera.
  if (event.data === 'appliquerMaj') self.skipWaiting();
  if (event.data === 'version') {
    event.source?.postMessage({ type: 'version', version: VERSION });
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
    // Filet : si la page n'envoie jamais le signal, on precache quand meme,
    // mais bien apres son chargement.
    setTimeout(precacher, 20000);
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
      // Ne jamais archiver une reponse opaque : son statut est inconnu, et un
      // echec reseau ainsi mis en cache serait resservi indefiniment.
      if (res && res.ok && (isCDN || url.origin === location.origin)) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, res.clone());
      }
      return res;
    } catch (e) {
      if (req.mode === 'navigate') {
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
      }
      throw e;
    }
  })());
});
