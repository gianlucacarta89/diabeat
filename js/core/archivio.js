/* ============================================================
   core/archivio.js — core 1.0
   Salvataggio chiave → valore su IndexedDB, con riserva
   automatica su localStorage se IndexedDB non è disponibile.
   Dipende da: App.Config (nomeArchivio).
   Usato da: core/stato.js.
   ============================================================ */
window.App = window.App || {};

App.Archivio = {
  modo: null,   // 'indexeddb' oppure 'localstorage'
  _db: null,

  // Apre l'archivio. Con "?archivio=locale" nell'indirizzo forza la riserva (per le prove).
  apri: function () {
    var self = this;
    var forzaLocale = /[?&]archivio=locale/.test(location.search);
    return new Promise(function (ok) {
      if (forzaLocale || !window.indexedDB) { self.modo = 'localstorage'; return ok(); }
      var req;
      try { req = indexedDB.open(App.Config.nomeArchivio, 1); }
      catch (e) { self.modo = 'localstorage'; return ok(); }
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains('dati')) req.result.createObjectStore('dati');
      };
      req.onsuccess = function () { self._db = req.result; self.modo = 'indexeddb'; ok(); };
      req.onerror = function () { self.modo = 'localstorage'; ok(); };
      req.onblocked = function () { self.modo = 'localstorage'; ok(); };
    });
  },

  _chiaveLocale: function (k) { return App.Config.nomeArchivio + ':' + k; },

  leggi: function (chiave) {
    var self = this;
    if (self.modo !== 'indexeddb') {
      try {
        var t = localStorage.getItem(self._chiaveLocale(chiave));
        return Promise.resolve(t ? JSON.parse(t) : undefined);
      } catch (e) { return Promise.resolve(undefined); }
    }
    return new Promise(function (ok) {
      try {
        var r = self._db.transaction('dati', 'readonly').objectStore('dati').get(chiave);
        r.onsuccess = function () { ok(r.result); };
        r.onerror = function () { ok(undefined); };
      } catch (e) { ok(undefined); }
    });
  },

  // Salva senza bisogno di attendere. Restituisce comunque una Promise.
  scrivi: function (chiave, valore) {
    var self = this;
    var copia = JSON.parse(JSON.stringify(valore));
    if (self.modo !== 'indexeddb') {
      try { localStorage.setItem(self._chiaveLocale(chiave), JSON.stringify(copia)); return Promise.resolve(true); }
      catch (e) {
        if (App.Avvisi) App.Avvisi.toast('Spazio di salvataggio pieno: fai un backup.', 'errore');
        return Promise.resolve(false);
      }
    }
    return new Promise(function (ok) {
      try {
        var tx = self._db.transaction('dati', 'readwrite');
        tx.objectStore('dati').put(copia, chiave);
        tx.oncomplete = function () { ok(true); };
        tx.onerror = function () { ok(false); };
      } catch (e) { ok(false); }
    });
  }
};
