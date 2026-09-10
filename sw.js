// 캐시 버전을 올릴 때마다 이 숫자나 텍스트를 바꿔주세요
const CACHE_NAME = 'roulette-app-v7.9';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 설치 단계: 최신 파일들 캐싱 및 즉시 대기열 통과
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 활성화 단계: 예전 버전(v1 등) 캐시를 즉시 전부 삭제
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// 핵심 변경점: 네트워크 우선 전략 (Network-First)
// 인터넷이 연결되어 있으면 무조건 깃허브의 새 파일을 가져오고, 실패 시에만 캐시 사용
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 새 파일을 성공적으로 가져왔다면 캐시도 최신본으로 자동 교체
        if (response && response.status === 200 && event.request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // 오프라인이거나 통신 장애일 때만 캐시 사용
        return caches.match(event.request);
      })
  );
});