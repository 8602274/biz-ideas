// 오프라인 캐시. 앱 파일을 고치면 VERSION을 올릴 것.
// 명함미팅과 같은 주소라 캐시 이름은 'biz-ideas-' 로 구분하고, 지울 때도 이 이름만 지운다.
const VERSION = 'v1.0.1';
const APP = 'biz-ideas-' + VERSION;
const CORE = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(CORE.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('biz-ideas-') && k !== APP).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;   // GitHub API 등은 그대로 인터넷으로

  // 앱 화면: 인터넷 되면 최신본, 안 되면 저장본
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, {cache: 'no-cache'}).then(r => {
      const copy = r.clone(); caches.open(APP).then(c => c.put('./index.html', copy)); return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  // 그 밖의 앱 파일: 저장본 먼저
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
