/* NefroApp ecossistema — cache das CDNs (sw.js v1)
   Guarda no aparelho as peças de terceiros que o app baixa ao abrir (Babel, React,
   Firebase). Se a CDN cair, o app continua abrindo com a cópia local.
   NÃO cacheia o index.html nem o Firestore: versão nova e dados continuam
   vindo sempre da rede (o hábito de conferir a versão no h1 segue valendo). */
const CACHE = 'nefro_cdn_v1';
const HOSTS = ['www.gstatic.com', 'cdnjs.cloudflare.com'];
const PRE = [
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(PRE.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('nefro_cdn_') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  let u; try { u = new URL(e.request.url); } catch (err) { return; }
  if (!HOSTS.includes(u.hostname)) return; // index.html, Firestore, resto: rede normal
  e.respondWith(
    caches.open(CACHE).then(c => c.match(e.request).then(hit => {
      if (hit) return hit; // URLs com versão pinada são imutáveis: cache-first é correto
      return fetch(e.request).then(resp => {
        if (resp && resp.ok) c.put(e.request, resp.clone());
        return resp;
      });
    }))
  );
});
