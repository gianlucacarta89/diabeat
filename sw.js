/* ============================================================
   sw.js — service worker: copia i file dell'app sul telefono
   così l'app si apre anche senza internet.
   Dalla v1.8 "prima la rete": con internet prende sempre i file
   aggiornati dal sito (e rinnova la copia); senza internet, o se
   la rete non risponde entro 4 secondi, usa la copia sul telefono.
   Così gli aggiornamenti si vedono subito. I DATI non si toccano
   (stanno in IndexedDB, non qui).
   Le richieste verso altri siti (Open Food Facts) passano sempre da internet.
   ============================================================ */
var VERSIONE = 'diabeat-v1.9';
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
  'js/catalogo/porzioni.js',
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
  // cache: 'reload' = scarica i file dal sito, non dalla cache del browser (che potrebbe avere quelli vecchi).
  e.waitUntil(caches.open(VERSIONE).then(function (c) {
    return c.addAll(FILE.map(function (f) { return new Request(f, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (chiavi) {
    return Promise.all(chiavi.filter(function (k) { return k !== VERSIONE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  var dallaCopia = function () {
    return caches.match(e.request, { ignoreSearch: true }).then(function (r) {
      // Apertura dell'app (es. ./?app=diabeat): la pagina principale.
      return r || (e.request.mode === 'navigate' ? caches.match('index.html') : undefined);
    });
  };
  var dallaRete = fetch(e.request, { cache: 'no-cache' }).then(function (risposta) {
    if (risposta && risposta.ok) {
      var copia = risposta.clone();
      caches.open(VERSIONE).then(function (c) { c.put(e.request, copia); });
    }
    return risposta;
  });
  var attesa = new Promise(function (ok) { setTimeout(ok, 4000); }).then(dallaCopia);
  e.respondWith(
    Promise.race([dallaRete, attesa]).then(function (r) { return r || dallaRete; })
      .catch(function () { return dallaCopia().then(function (r) { return r || Response.error(); }); })
  );
});
