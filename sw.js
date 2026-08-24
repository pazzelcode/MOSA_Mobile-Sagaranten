self.addEventListener('install', event => {
    console.log('Service Worker Installed');
});

self.addEventListener('fetch', event => {

});
// Di dalam file sw.js
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'clearCache') {
        caches.keys().then((names) => {
            for (let name of names) {
                caches.delete(name);
            }
        });
    }
});
