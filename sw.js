'use strict';

const CACHE_NAME = 'kawusiomat-v2';
const ASSETS = [
    './',
    './index.html',
    './app.js',
    './style.css',
    './manifest.json',
    './icon.svg'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Network-first: nowe wersje docierają od razu po deployu, cache służy jako fallback offline
self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    if (new URL(e.request.url).origin !== self.location.origin) return;
    e.respondWith(
        fetch(e.request)
            .then((res) => {
                if (res.ok) {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
                }
                return res;
            })
            .catch(() => caches.match(e.request))
    );
});
