/* ============================================================
   servizi/diario.js
   Operazioni sul diario: pasti, attività, basale, ipoglicemie,
   boli extra e bozze dei pasti non ancora salvati.
   Ogni funzione controlla i dati PRIMA di salvare e restituisce
   { errore: '...' } se qualcosa non va.
   Dipende da: App.Stato, App.Sicurezza, App.Utils.
   Usato da: ui/ui-giorno.js, ui/ui-pasto.js, ui/ui-giorno-extra.js.
   ============================================================ */
window.App = window.App || {};

App.Diario = {
  // --- Pasti --------------------------------------------------
  /* dati: { ora, glicemia, voci, attivitaIds, umoreId, dose, suggerita, note } */
  salvaPasto: function (iso, pastoId, dati) {
    var S = App.Sicurezza;
    var e = S.ora(dati.ora) || S.glicemia(dati.glicemia, false) || S.dose(dati.dose, false);
    if (e) return { errore: e };
    for (var i = 0; i < (dati.voci || []).length; i++) {
      e = S.grammi(dati.voci[i].grammi);
      if (e) return { errore: dati.voci[i].nome + ' – ' + e };
    }
    if (!dati.voci.length && dati.glicemia == null && dati.dose == null) {
      return { errore: 'Il pasto è vuoto: inserisci almeno la glicemia, un cibo o la dose.' };
    }
    var g = App.Stato.assicuraGiorno(iso);
    g.pasti[pastoId] = {
      ora: dati.ora, glicemia: dati.glicemia, voci: dati.voci,
      attivitaIds: dati.attivitaIds || [], umoreId: dati.umoreId || '',
      dose: dati.dose, suggerita: dati.suggerita, note: dati.note || '',
      salvato: new Date().toISOString()
    };
    this.togliBozza(iso, pastoId);
    App.Stato.salva('giorni');
    var avvisi = [];
    if (dati.dose == null && dati.voci.length) avvisi.push('Dose non inserita: questo pasto non conta nell\'insulina attiva.');
    return { ok: true, avvisi: avvisi };
  },

  eliminaPasto: function (iso, pastoId) {
    var g = App.Stato.giorno(iso);
    if (!g) return;
    delete g.pasti[pastoId];
    App.Stato.pulisciGiorno(iso);
    App.Stato.salva('giorni');
  },

  // --- Bozze (pasti scritti e non ancora salvati) ---------------
  chiave: function (iso, pastoId) { return iso + '|' + pastoId; },
  leggiBozza: function (iso, pastoId) { return App.Stato.dati.bozze[this.chiave(iso, pastoId)] || null; },
  salvaBozza: function (iso, pastoId, dati) {
    App.Stato.dati.bozze[this.chiave(iso, pastoId)] = App.Utils.clona(dati);
    App.Stato.salva('bozze');
  },
  togliBozza: function (iso, pastoId) {
    delete App.Stato.dati.bozze[this.chiave(iso, pastoId)];
    App.Stato.salva('bozze');
  },

  // --- Elementi ripetibili del giorno ------------------------------
  _aggiungi: function (iso, elenco, voce) {
    var g = App.Stato.assicuraGiorno(iso);
    voce.id = App.Utils.id();
    g[elenco].push(voce);
    g[elenco].sort(function (a, b) { return a.ora < b.ora ? -1 : 1; });
    App.Stato.salva('giorni');
    return { ok: true };
  },
  rimuovi: function (iso, elenco, id) {
    var g = App.Stato.giorno(iso);
    if (!g) return;
    g[elenco] = (g[elenco] || []).filter(function (x) { return x.id !== id; });
    App.Stato.pulisciGiorno(iso);
    App.Stato.salva('giorni');
  },

  // { attivitaId, ora, durataMin, note }
  aggiungiAttivita: function (iso, a) {
    var e = App.Sicurezza.ora(a.ora);
    if (!e && !a.attivitaId) e = 'Scegli l\'attività.';
    if (!e && a.durataMin != null && (a.durataMin < 5 || a.durataMin > 600)) e = 'Durata non valida: da 5 a 600 minuti.';
    if (e) return { errore: e };
    return this._aggiungi(iso, 'attivita', { attivitaId: a.attivitaId, ora: a.ora, durataMin: a.durataMin, note: a.note || '' });
  },

  // { ora, glicemia, trattamento }
  aggiungiIpo: function (iso, x) {
    var e = App.Sicurezza.ora(x.ora) || App.Sicurezza.glicemia(x.glicemia, true);
    if (e) return { errore: e };
    return this._aggiungi(iso, 'ipo', { ora: x.ora, glicemia: x.glicemia, trattamento: x.trattamento || '' });
  },

  // { ora, dose, glicemia, note }
  aggiungiBoloExtra: function (iso, x) {
    var e = App.Sicurezza.ora(x.ora) || App.Sicurezza.dose(x.dose, true) || App.Sicurezza.glicemia(x.glicemia, false);
    if (!e && x.dose <= 0) e = 'Dose: scrivi un valore maggiore di 0.';
    if (e) return { errore: e };
    return this._aggiungi(iso, 'boliExtra', { ora: x.ora, dose: x.dose, glicemia: x.glicemia, note: x.note || '' });
  },

  // --- Basale --------------------------------------------------
  salvaBasale: function (iso, x) {
    var e = App.Sicurezza.ora(x.ora) || App.Sicurezza.dose(x.dose, true);
    if (!e && x.dose <= 0) e = 'Dose: scrivi un valore maggiore di 0.';
    if (e) return { errore: e };
    App.Stato.assicuraGiorno(iso).basale = { ora: x.ora, dose: x.dose };
    App.Stato.salva('giorni');
    return { ok: true };
  },
  togliBasale: function (iso) {
    var g = App.Stato.giorno(iso);
    if (!g) return;
    g.basale = null;
    App.Stato.pulisciGiorno(iso);
    App.Stato.salva('giorni');
  },

  // Ultima basale registrata prima del giorno indicato (per proporre la dose abituale).
  ultimaBasale: function (iso) {
    for (var n = 0; n < 30; n++) {
      var g = App.Stato.giorno(App.Utils.aggiungiGiorni(iso, -n));
      if (g && g.basale) return g.basale;
    }
    return null;
  },

  salvaNote: function (iso, testo) {
    if (!testo && !App.Stato.giorno(iso)) return;
    App.Stato.assicuraGiorno(iso).note = testo || '';
    App.Stato.pulisciGiorno(iso);
    App.Stato.salva('giorni');
  },

  // Cancella tutto il diario (non tocca archivio, modelli e impostazioni).
  cancellaDiario: function () {
    App.Stato.dati.giorni = {};
    App.Stato.dati.bozze = {};
    App.Stato.salva('giorni', 'bozze');
  }
};
