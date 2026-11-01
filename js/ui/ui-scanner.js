/* ============================================================
   ui/ui-scanner.js
   Lettura del codice a barre con la fotocamera (libreria
   html5-qrcode in lib/), oppure inserimento a mano del codice.
   Se il prodotto è già in archivio lo restituisce subito;
   altrimenti lo cerca su Open Food Facts (serve internet) e apre
   il modulo per controllare i valori prima di salvarli.
   Dipende da: App.Alimenti, App.OpenFoodFacts, App.UIAlimentoForm,
               App.Avvisi, App.UIComune, App.Utils, libreria Html5Qrcode.
   Usato da: ui/ui-pasto.js, ui/ui-archivio.js.
   ============================================================ */
window.App = window.App || {};

App.UIScanner = {
  // callback(alimento) quando il cibo è in archivio (trovato o appena salvato).
  apri: function (callback) {
    var U = App.Utils, self = this;
    var lettore = null, chiuso = false;
    var corpo = U.el('<div>' +
      '<div id="lettore-codici"></div>' +
      '<p class="tenue centro" id="s-stato">Inquadra il codice a barre del prodotto.</p>' +
      '<label for="s-codice">Oppure scrivi il codice</label>' +
      '<div class="riga"><input id="s-codice" class="cresce" inputmode="numeric" placeholder="es. 8076800195057">' +
      '<button class="btn" data-az="cerca">Cerca</button></div>' +
    '</div>');

    var ferma = function () {
      if (lettore) { try { lettore.stop().catch(function () {}); } catch (e) { /* già fermo */ } lettore = null; }
    };
    var fin = App.Avvisi.finestra({ titolo: 'Codice a barre', icona: '📷', contenuto: corpo,
      allaChiusura: function () { chiuso = true; ferma(); } });

    var gestisci = function (codice) {
      ferma();
      codice = String(codice).trim();
      var esistente = App.Alimenti.perCodice(codice);
      if (esistente) {
        fin.chiudi();
        App.Avvisi.toast('Già in archivio: ' + esistente.nome, 'ok');
        callback(esistente);
        return;
      }
      corpo.querySelector('#s-stato').textContent = 'Cerco il prodotto ' + codice + '…';
      App.OpenFoodFacts.cerca(codice).then(function (r) {
        if (chiuso) return;
        fin.chiudi();
        var avviso = r.trovato
          ? 'Valori trovati su Open Food Facts: <b>controllali con l\'etichetta</b> prima di salvare.'
          : U.esc(r.errore || 'Prodotto non trovato.');
        App.UIAlimentoForm.apri({
          nome: r.nome || '', carb: r.carb, prot: r.prot, grassi: r.grassi,
          codice: App.OpenFoodFacts.codiceValido(codice) ? codice : '', fonte: r.trovato ? 'Open Food Facts' : 'Etichetta'
        }, callback, { titolo: r.trovato ? 'Controlla il prodotto' : 'Nuovo prodotto', avviso: avviso });
      });
    };

    corpo.querySelector('[data-az=cerca]').onclick = function () {
      var c = corpo.querySelector('#s-codice').value.replace(/\s/g, '');
      if (!App.OpenFoodFacts.codiceValido(c)) { App.UIComune.errore(corpo, '#s-codice', 'Codice non valido: deve avere da 8 a 14 cifre.'); return; }
      gestisci(c);
    };

    self.avviaCamera(corpo, function (l) { lettore = l; if (chiuso) ferma(); }, gestisci);
  },

  avviaCamera: function (corpo, pronto, trovato) {
    var stato = corpo.querySelector('#s-stato');
    var box = corpo.querySelector('#lettore-codici');
    if (!window.Html5Qrcode) {
      box.classList.add('nascosto');
      stato.textContent = 'Lettore non disponibile: scrivi il codice qui sotto.';
      return;
    }
    if (!window.isSecureContext || !navigator.mediaDevices) {
      box.classList.add('nascosto');
      stato.textContent = 'La fotocamera funziona solo con l\'app installata dal suo indirizzo (https). Intanto scrivi il codice qui sotto.';
      return;
    }
    var F = window.Html5QrcodeSupportedFormats;
    var lettore = new window.Html5Qrcode('lettore-codici', {
      formatsToSupport: [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E],
      useBarCodeDetectorIfSupported: true, verbose: false
    });
    var letto = false;
    lettore.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 260, height: 120 } },
      function (testo) { if (!letto) { letto = true; trovato(testo); } }, function () { /* nessun codice in questo fotogramma */ })
      .then(function () { pronto(lettore); })
      .catch(function () {
        box.classList.add('nascosto');
        stato.textContent = 'Non riesco ad aprire la fotocamera (permesso negato o non disponibile). Scrivi il codice qui sotto.';
      });
  }
};
