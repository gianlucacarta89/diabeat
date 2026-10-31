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
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* l'app funziona comunque online */ });
    });
  }
};

document.addEventListener('DOMContentLoaded', App.avvia);
