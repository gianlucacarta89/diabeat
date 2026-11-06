/* ============================================================
   ui/ui-scanner.js
   Lettura del codice a barre con la fotocamera: lettore del telefono
   (BarcodeDetector, alta risoluzione, fuoco continuo, luce) oppure
   libreria html5-qrcode in lib/; o inserimento a mano del codice.
   Le letture si controllano con la cifra di controllo EAN.
   Se il prodotto è già in archivio lo restituisce subito;
   altrimenti lo cerca su Open Food Facts (serve internet) e, se ha
   tutti i valori, lo salva subito in archivio; se mancano valori
   apre il modulo per completarli dall'etichetta.
   Dipende da: App.Alimenti, App.OpenFoodFacts, App.UIAlimentoForm,
               App.Avvisi, App.UIComune, App.Utils, libreria Html5Qrcode.
   Usato da: ui/ui-pasto.js, ui/ui-archivio.js, ui/ui-modelli.js.
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
        if (r.trovato && !r.nome) r.nome = 'Prodotto ' + codice;
        var dati = {
          nome: r.nome || '', carb: r.carb, prot: r.prot, grassi: r.grassi,
          codice: App.OpenFoodFacts.codiceValido(codice) ? codice : '', fonte: r.trovato ? 'Open Food Facts' : 'Etichetta',
          misure: (r.porzione && r.porzione >= 1) ? { numero: r.porzione, numeroNome: 'porzione', numeroPlurale: 'porzioni' } : null
        };
        // Trovato con tutti i valori: si salva subito in archivio, senza passaggi in più.
        if (r.trovato && App.OpenFoodFacts.completo(r)) {
          var salvato = App.OpenFoodFacts.salvaInArchivio(r);
          if (salvato.alimento) {
            App.Avvisi.toast('Salvato in archivio: ' + salvato.alimento.nome + '. Valori da Open Food Facts: se qualcosa non torna con l\'etichetta, correggilo in Archivio.', 'ok', 6000);
            callback(salvato.alimento);
            return;
          }
        }
        // Non trovato o valori incompleti: si scrivono dall'etichetta.
        var avviso = r.trovato
          ? 'Su Open Food Facts mancano alcuni valori: completali dall\'etichetta e salva.'
          : U.esc(r.errore || 'Prodotto non trovato.');
        App.UIAlimentoForm.apri(dati, callback, { titolo: 'Nuovo prodotto', avviso: avviso });
      });
    };

    corpo.querySelector('[data-az=cerca]').onclick = function () {
      var c = corpo.querySelector('#s-codice').value.replace(/\s/g, '');
      if (!App.OpenFoodFacts.codiceValido(c)) { App.UIComune.errore(corpo, '#s-codice', 'Codice non valido: deve avere da 8 a 14 cifre.'); return; }
      gestisci(c);
    };

    self.avviaCamera(corpo, function (l) { lettore = l; if (chiuso) ferma(); }, gestisci);
  },

  // Controllo della cifra finale dei codici EAN-13 / UPC-A (12-13 cifre): scarta le letture sbagliate.
  controlloOk: function (c) {
    if (!/^\d+$/.test(c)) return false;
    if (c.length !== 12 && c.length !== 13) return true; // EAN-8 / UPC-E: si conferma con due letture uguali
    var d = c.split('').map(Number), ultima = d.pop(), somma = 0;
    d.reverse().forEach(function (x, i) { somma += x * (i % 2 === 0 ? 3 : 1); });
    return (10 - (somma % 10)) % 10 === ultima;
  },

  /* Accetta un codice solo se il controllo è giusto; i codici corti (8 cifre)
     solo dopo due letture uguali di fila. */
  filtro: function (trovato) {
    var self = this, ultimo = null, letto = false;
    return function (testo) {
      if (letto) return;
      testo = String(testo || '').replace(/\D/g, '');
      if (!App.OpenFoodFacts.codiceValido(testo) || !self.controlloOk(testo)) return;
      if (testo.length < 12 && testo !== ultimo) { ultimo = testo; return; }
      letto = true;
      if (navigator.vibrate) { try { navigator.vibrate(80); } catch (e) { /* niente */ } }
      trovato(testo);
    };
  },

  avviaCamera: function (corpo, pronto, trovato) {
    var stato = corpo.querySelector('#s-stato');
    var box = corpo.querySelector('#lettore-codici');
    if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      box.classList.add('nascosto');
      stato.textContent = 'La fotocamera funziona solo con l\'app installata dal suo indirizzo (https). Intanto scrivi il codice qui sotto.';
      return;
    }
    var accetta = this.filtro(trovato), self = this;
    // 1) Lettore del telefono (Chrome su Android): veloce e preciso.
    if ('BarcodeDetector' in window) {
      window.BarcodeDetector.getSupportedFormats().then(function (f) {
        var formati = ['ean_13', 'ean_8', 'upc_a', 'upc_e'].filter(function (x) { return f.indexOf(x) >= 0; });
        if (!formati.length) return self.avviaLibreria(corpo, pronto, accetta);
        self.avviaNativo(corpo, pronto, accetta, new window.BarcodeDetector({ formats: formati }));
      }, function () { self.avviaLibreria(corpo, pronto, accetta); });
      return;
    }
    // 2) Altrimenti la libreria html5-qrcode.
    this.avviaLibreria(corpo, pronto, accetta);
  },

  // Fotocamera scelta l'ultima volta (se l'hai cambiata con il pulsante).
  _camScelta: function (v) {
    try { if (v === undefined) return localStorage.getItem('diabeat-fotocamera') || ''; localStorage.setItem('diabeat-fotocamera', v); } catch (e) { return ''; }
  },

  /* Fotocamere posteriori, la principale per prima. Su molti Android (es. Samsung)
     "fotocamera posteriore" apre il grandangolo, che non mette a fuoco da vicino:
     la principale di solito è "camera2 0" / "camera 0". */
  _posteriori: function () {
    return navigator.mediaDevices.enumerateDevices().then(function (d) {
      var cam = d.filter(function (x) { return x.kind === 'videoinput'; });
      var dietro = cam.filter(function (x) { return /back|rear|posterior|environment|retro/i.test(x.label); });
      if (!dietro.length) dietro = cam;
      var peso = function (x) { return /\b0\b/.test(x.label) ? 0 : /wide|ultra|tele|grandang/i.test(x.label) ? 2 : 1; };
      return dietro.slice().sort(function (a, b) { return peso(a) - peso(b); });
    });
  },

  avviaNativo: function (corpo, pronto, accetta, rilevatore) {
    var self = this, stato = corpo.querySelector('#s-stato'), box = corpo.querySelector('#lettore-codici');
    box.innerHTML = '<div style="position:relative;border-radius:14px;overflow:hidden;background:#000">' +
      '<video playsinline muted style="display:block;width:100%;max-height:46vh;object-fit:cover"></video>' +
      '<div style="position:absolute;left:8%;right:8%;top:50%;height:2px;background:#e53935;box-shadow:0 0 6px #e53935"></div>' +
      '<div style="position:absolute;left:8px;right:8px;bottom:8px;display:flex;gap:6px;justify-content:flex-end">' +
        '<button class="btn btn-piccolo nascosto" data-az="cam">🔄 Cambia fotocamera</button>' +
        '<button class="btn btn-piccolo nascosto" data-az="luce">🔦 Luce</button></div></div>';
    var video = box.querySelector('video'), flusso = null, attivo = true, timer = null, avviato = false;
    var elenco = [], indice = 0;
    var spegni = function () { if (flusso) flusso.getTracks().forEach(function (t) { t.stop(); }); flusso = null; };
    var fermo = { stop: function () { attivo = false; clearTimeout(timer); spegni(); return Promise.resolve(); } };
    var errore = function () {
      box.classList.add('nascosto');
      stato.textContent = 'Non riesco ad aprire la fotocamera (permesso negato o non disponibile). Scrivi il codice qui sotto.';
    };
    var giro = function () {
      if (!attivo) return;
      rilevatore.detect(video).then(function (codici) {
        (codici || []).forEach(function (c) { accetta(c.rawValue); });
      }).catch(function () {}).then(function () { if (attivo) timer = setTimeout(giro, 100); });
    };
    var regola = function (traccia) {
      var cap = traccia.getCapabilities ? traccia.getCapabilities() : {}, extra = {};
      if (cap.focusMode && cap.focusMode.indexOf('continuous') >= 0) extra.focusMode = 'continuous';
      // Un po' di zoom: si tiene il telefono più lontano, dove mette a fuoco meglio.
      if (cap.zoom && cap.zoom.max >= 1.5) extra.zoom = Math.min(2, cap.zoom.max);
      if (Object.keys(extra).length) traccia.applyConstraints({ advanced: [extra] }).catch(function () {});
      var luce = box.querySelector('[data-az=luce]');
      if (cap.torch) {
        var acceso = false;
        luce.classList.remove('nascosto');
        luce.onclick = function () { acceso = !acceso; traccia.applyConstraints({ advanced: [{ torch: acceso }] }).catch(function () {}); };
      } else luce.classList.add('nascosto');
      // Tocca l'immagine per rimettere a fuoco.
      video.onclick = function () {
        if (!cap.focusMode) return;
        var m = cap.focusMode.indexOf('single-shot') >= 0 ? 'single-shot' : 'continuous';
        traccia.applyConstraints({ advanced: [{ focusMode: m }] }).then(function () {
          if (m !== 'continuous' && cap.focusMode.indexOf('continuous') >= 0) setTimeout(function () { traccia.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(function () {}); }, 1200);
        }).catch(function () {});
      };
    };
    var apri = function (deviceId) {
      spegni();
      var v = { width: { ideal: 1280 }, height: { ideal: 720 } };
      if (deviceId) v.deviceId = { exact: deviceId }; else v.facingMode = { ideal: 'environment' };
      return navigator.mediaDevices.getUserMedia({ audio: false, video: v }).then(function (s) {
        flusso = s;
        if (!attivo) { spegni(); return; }
        video.srcObject = s;
        regola(s.getVideoTracks()[0]);
        return video.play();
      });
    };
    var parti = function () {
      if (avviato || !attivo) return;
      avviato = true; pronto(fermo);
      stato.textContent = 'Codice sulla linea rossa, telefono a 15-25 cm. Se è sfocato tocca l\'immagine o "Cambia fotocamera".';
      giro();
    };
    // 1) apre la posteriore; 2) se c'è, passa alla principale (o a quella scelta l'ultima volta).
    apri(null).then(function () {
      if (!attivo) return;
      return self._posteriori().then(function (lista) {
        elenco = lista;
        var attuale = flusso && flusso.getVideoTracks()[0].getSettings ? flusso.getVideoTracks()[0].getSettings().deviceId : '';
        var scelta = self._camScelta();
        var meglio = (scelta && lista.filter(function (x) { return x.deviceId === scelta; })[0]) || lista[0];
        if (lista.length > 1) {
          var bc = box.querySelector('[data-az=cam]');
          bc.classList.remove('nascosto');
          bc.onclick = function () {
            indice = (indice + 1) % elenco.length;
            self._camScelta(elenco[indice].deviceId);
            apri(elenco[indice].deviceId).catch(function () {});
          };
        }
        indice = Math.max(0, lista.indexOf(meglio));
        if (meglio && meglio.deviceId && meglio.deviceId !== attuale) return apri(meglio.deviceId).catch(function () { return apri(null); });
      });
    }).then(parti, function () { if (flusso) parti(); else errore(); });
  },

  avviaLibreria: function (corpo, pronto, accetta) {
    var stato = corpo.querySelector('#s-stato'), box = corpo.querySelector('#lettore-codici');
    if (!window.Html5Qrcode) {
      box.classList.add('nascosto');
      stato.textContent = 'Lettore non disponibile: scrivi il codice qui sotto.';
      return;
    }
    var F = window.Html5QrcodeSupportedFormats;
    var lettore = new window.Html5Qrcode('lettore-codici', {
      formatsToSupport: [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E],
      experimentalFeatures: { useBarCodeDetectorIfSupported: true }, verbose: false
    });
    lettore.start({ facingMode: 'environment' }, {
      fps: 15,
      // Riquadro largo e basso, in proporzione allo schermo.
      qrbox: function (w, h) { return { width: Math.floor(w * 0.9), height: Math.max(80, Math.floor(Math.min(h, w) * 0.4)) }; },
      videoConstraints: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 }, advanced: [{ focusMode: 'continuous' }] }
    }, function (testo) { accetta(testo); }, function () { /* nessun codice in questo fotogramma */ })
      .then(function () { pronto(lettore); })
      .catch(function () {
        box.classList.add('nascosto');
        stato.textContent = 'Non riesco ad aprire la fotocamera (permesso negato o non disponibile). Scrivi il codice qui sotto.';
      });
  }
};
