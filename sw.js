/* ============================================================
   sw.js — service worker: copia i file dell'app sul telefono
   così l'app si apre anche senza internet.
   A ogni nuova versione cambia VERSIONE: il telefono scarica i
   file nuovi e cancella la copia vecchia. I DATI non si toccano
   (stanno in IndexedDB, non qui).
   Le richieste verso altri siti (Open Food Facts) passano sempre da internet.
   ============================================================ */
var VERSIONE = 'diabeat-v1.2.1';
var FILE = [
  'index.html',
  'manifest.webmanifest',
  './',
  'css/base.css',
  'css/componenti.css',
  'css/schermi-grandi.css',
  'icone/logo-192.png',
  'icone/logo-512.png',
  'js/avvio.js',
  'js/config.js',
  'lib/html5-qrcode-2.3.8.min.js',
  'lib/jspdf-2.5.1.umd.min.js',
  'lib/jspdf-autotable-3.8.2.min.js',
  'js/catalogo/alimenti-altro.js',
  'js/catalogo/alimenti-antipasti-dolci.js',
  'js/catalogo/alimenti-contorni.js',
  'js/catalogo/alimenti-primi.js',
  'js/catalogo/alimenti-secondi.js',
  'js/core/archivio.js',
  'js/core/avvisi.js',
  'js/core/stato.js',
  'js/core/utils.js',
  'js/dati/backup.js',
  'js/servizi/alimenti.js',
  'js/servizi/calcolo-bolo.js',
  'js/servizi/diario.js',
  'js/servizi/insulina-attiva.js',
  'js/servizi/modelli.js',
  'js/servizi/nutrienti.js',
  'js/servizi/open-food-facts.js',
  'js/servizi/parametri.js',
  'js/servizi/pasto-grasso.js',
  'js/servizi/sicurezza.js',
  'js/servizi/statistiche.js',
  'js/servizi/voce-testo.js',
  'js/stampa/stampa-base.js',
  'js/stampa/stampa-report.js',
  'js/ui/navigazione.js',
  'js/ui/ui-alimento-form.js',
  'js/ui/ui-archivio.js',
  'js/ui/ui-attivita-umori.js',
  'js/ui/ui-calcolo.js',
  'js/ui/ui-comune.js',
  'js/ui/ui-giorno-extra.js',
  'js/ui/ui-giorno.js',
  'js/ui/ui-impostazioni.js',
  'js/ui/ui-modelli.js',
  'js/ui/ui-parametri.js',
  'js/ui/ui-pasto-cibi.js',
  'js/ui/ui-pasto.js',
  'js/ui/ui-scanner.js',
  'js/ui/ui-statistiche.js',
  'js/ui/ui-voce.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSIONE).then(function (c) { return c.addAll(FILE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (chiavi) {
    return Promise.all(chiavi.filter(function (k) { return k !== VERSIONE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (r) {
    return r || fetch(e.request);
  }));
});
