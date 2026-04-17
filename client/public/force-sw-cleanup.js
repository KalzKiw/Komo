// Este script elimina el service worker y limpia la cache de la app
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
    if (window.caches) {
      caches.keys().then(function(names) {
        for (let name of names) caches.delete(name);
      });
    }
    window.location.reload();
  });
} else {
  alert('No hay service worker registrado.');
}
