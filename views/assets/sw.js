'use strict'

const CACHE_NAME = 'cache-v1';
// The files we want to cache
const resourceList = [
    '/',
    '/login',
    '/css/style.css',
    '/css/materialize.min.css',
    '/sw.js',
    '/js/lib/jquery-3.3.1.min.js',
    '/js/lib/materialize.min.js',
    '/js/pseudoRandom.min.js',
    '/js/scripts.js',
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(resourceList);
    }));
});

function addToCache(cacheName, resourceList) {
    caches.open(cacheName).then(cache => {
        return cache.addAll(resourceList);
    });
}

this.addEventListener('fetch', event => {
    event.respondWith(caches.match(event.request).then(response => {
        return response || fetch(event.request, {redirect: 'follow'});
    }));
});

/*
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open('pwa').then(cache => {
            return cache.addAll([
                '/',
                '/login',
                '/css/style.css',
                '/css/materialize.min.css',
                '/js/sw.js',
                '/js/lib/jquery-3.3.1.min.js',
                '/js/lib/materialize.min.js',
                '/js/pseudoRandom.min.js',
                '/js/scripts.js',
            ])
            .then(() => self.skipWaiting());
        })
    )
});

self.addEventListener('fetch', function (event) {
    event.respondWith(caches.match(event.request).then(function (response) {
        if (response !== undefined) {
            return response;
        } else {
            return fetch(event.request).then(function (response) {
                let responseClone = response.clone();

                caches.open('pwa').then(function (cache) {
                    cache.put(event.request, responseClone);
                });
                return response;
            }).catch(function () {
                return caches.match('/');
            });
        }
    }));
});
*/