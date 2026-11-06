/* ============================================================
   avvio.js — SEMPRE l'ultimo file caricato.
   Apre l'archivio, carica i dati PRIMA del primo disegno,
   disegna la pagina e, se l'app è aperta dal suo indirizzo web
   (https), registra il service worker per l'uso offline.
   Dipende da: tutti i moduli.
   ============================================================ */
window.App = window.App || {};

App.avvia = function () {
  document.title = App.Config.nome;
  App.Archivio.apri()
    .then(function () { return App.Stato.carica(); })
    .then(function () {
      App.Nav.prepara();
      App.Nav.disegna();
      if (App.Archivio.modo !== 'indexeddb') {
        App.Avvisi.toast('Salvataggio di riserva attivo (memoria locale): fai backup regolari.', 'avviso', 6000);
      }
    })
    .catch(function (e) {
      document.getElementById('app').innerHTML = '<div style="padding:20px">Errore all\'avvio: ' + App.Utils.esc(e && e.message) + '</div>';
    });

  // Uso offline: solo quando l'app è servita da un indirizzo web (non da file).
  // A ogni apertura controlla se c'è una versione nuova; quando è pronta, la pagina si ricarica da sola
  // (una volta sola), così l'aggiornamento si vede subito e non all'apertura successiva.
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    var cera = !!navigator.serviceWorker.controller, ricaricata = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!cera || ricaricata) return;
      ricaricata = true;
      if (!document.querySelector('.finestra-sfondo')) location.reload();
      else App.Avvisi.toast('Nuova versione pronta: chiudi e riapri l\'app per vederla.', 'info', 6000);
    });
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
        .then(function (reg) { reg.update(); })
        .catch(function () { /* l'app funziona comunque online */ });
    });
  }
};

// Pulsante "Aggiorna app" (Impostazioni): cancella la copia dei file sul telefono
// (non i dati, che stanno in IndexedDB) e ricarica l'app dal sito.
App.aggiornaApp = function () {
  if (navigator.onLine === false) { App.Avvisi.toast('Sei offline: collegati a internet e riprova.', 'avviso'); return; }
  App.Avvisi.toast('Aggiorno l\'app…', 'info', 3000);
  var fatto = function () { location.reload(); };
  var passi = [];
  if (window.caches) passi.push(caches.keys().then(function (k) { return Promise.all(k.map(function (n) { return caches.delete(n); })); }));
  if ('serviceWorker' in navigator) {
    passi.push(navigator.serviceWorker.getRegistrations().then(function (regs) {
      return Promise.all(regs.map(function (r) { return r.update().catch(function () {}); }));
    }));
  }
  Promise.all(passi).then(fatto, fatto);
};

/* Pulsante "Cerca aggiornamenti" in fondo alla pagina: legge la versione
   pubblicata sul sito; se è diversa aggiorna, altrimenti lo dice. */
App.cercaAggiornamenti = function () {
  if (navigator.onLine === false) { App.Avvisi.toast('Sei offline: collegati a internet e riprova.', 'avviso'); return; }
  if (location.protocol.indexOf('http') !== 0) { App.aggiornaApp(); return; }
  App.Avvisi.toast('Cerco aggiornamenti…', 'info', 2500);
  fetch('js/config.js?controllo=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error(); return r.text(); })
    .then(function (t) {
      var m = t.match(/versione:\s*'([^']+)'/), online = m && m[1];
      if (!online) throw new Error();
      if (online === App.Config.versione) App.Avvisi.toast('Hai già l\'ultima versione (v' + online + ').', 'ok', 3500);
      else { App.Avvisi.toast('Nuova versione v' + online + ': aggiorno…', 'info', 3000); setTimeout(App.aggiornaApp, 600); }
    })
    .catch(function () { App.Avvisi.toast('Non riesco a controllare: riprova tra poco.', 'errore', 4000); });
};

document.addEventListener('DOMContentLoaded', App.avvia);
