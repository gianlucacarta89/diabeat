/* ============================================================
   core/stato.js — core 1.0
   Dati in memoria e salvataggio. Ogni gruppo di dati è salvato
   in una chiave separata dell'archivio:
     impostazioni, alimenti, modelli  → elenchi permanenti
     giorni, bozze                    → dati di lavoro (diario)
   Dipende da: App.Config, App.Archivio, App.Utils.
   Usato da: servizi/*, ui/*, dati/backup.js, avvio.js.
   ============================================================ */
window.App = window.App || {};

App.Stato = {
  CHIAVI: ['impostazioni', 'alimenti', 'modelli', 'giorni', 'bozze'],
  dati: null,
  scheda: 'oggi',
  giornoAperto: null,

  // Impostazioni di partenza: il rapporto insulina/carboidrati è VUOTO di proposito.
  impostazioniIniziali: function () {
    var C = App.Config;
    return {
      insulinaRapida: { nome: 'NovoRapid', durataOre: null, passo: 0.5 },
      rapportoIC: null,
      fattoreCorrezione: null,   // mg/dL che 1 U abbassa (facoltativo)
      obiettivoPredefinito: C.obiettivoPredefinito, // obiettivo proposto nei pasti (id di Config.obiettiviGlicemia)
      storicoParametri: [],
      sogliaIpo: null,
      doseMax: null,
      range: { basso: C.rangeStatistiche.basso, alto: C.rangeStatistiche.alto },
      attivita: C.attivitaPredefinite.map(function (a) { return { id: a.id, nome: a.nome, icona: a.icona }; }),
      vocaleOk: false
    };
  },

  vuoto: function () {
    return { impostazioni: this.impostazioniIniziali(), alimenti: [], modelli: [], giorni: {}, bozze: {} };
  },

  // Completa dati arrivati da versioni precedenti o da un backup.
  completa: function (d) {
    var base = this.vuoto();
    d = d || {};
    var vecchie = d.impostazioni || {};
    var out = {
      impostazioni: Object.assign(base.impostazioni, vecchie),
      alimenti: Array.isArray(d.alimenti) ? d.alimenti : [],
      modelli: Array.isArray(d.modelli) ? d.modelli : [],
      giorni: (d.giorni && typeof d.giorni === 'object') ? d.giorni : {},
      bozze: (d.bozze && typeof d.bozze === 'object') ? d.bozze : {}
    };
    var imp = out.impostazioni;
    // Dalla v1.0 (parametri per pasto): si tiene il rapporto solo se era uguale per tutti i pasti.
    if (imp.rapportoIC == null && vecchie.parametri) {
      var valori = Object.keys(vecchie.parametri).map(function (k) { return vecchie.parametri[k].rapportoIC; });
      var uguali = valori.length && valori.every(function (v) { return v != null && v === valori[0]; });
      if (uguali) imp.rapportoIC = valori[0];
    }
    delete imp.parametri; delete imp.insulinaBasale; delete imp.umori;
    delete imp.obiettivo; delete imp.obiettivoAlto; // v1.10: obiettivo fisso, ora si sceglie nel pasto
    imp.insulinaRapida = Object.assign({ nome: 'NovoRapid', durataOre: null, passo: 0.5 }, imp.insulinaRapida || {});
    imp.range = Object.assign({ basso: 70, alto: 180 }, imp.range || {});
    if (!Array.isArray(imp.storicoParametri)) imp.storicoParametri = [];
    imp.attivita = (Array.isArray(imp.attivita) ? imp.attivita : base.impostazioni.attivita)
      .map(function (a) { return { id: a.id, nome: a.nome, icona: a.icona || '🏃' }; });
    return out;
  },

  // Carica tutto PRIMA del primo disegno della pagina.
  carica: function () {
    var self = this;
    return Promise.all(self.CHIAVI.map(function (k) { return App.Archivio.leggi(k); }))
      .then(function (valori) {
        var grezzi = {};
        self.CHIAVI.forEach(function (k, i) { if (valori[i] !== undefined) grezzi[k] = valori[i]; });
        self.dati = self.completa(grezzi);
      });
  },

  // Salva una o più chiavi, senza attendere.
  salva: function () {
    var self = this;
    var chiavi = arguments.length ? Array.prototype.slice.call(arguments) : self.CHIAVI;
    chiavi.forEach(function (k) { App.Archivio.scrivi(k, self.dati[k]); });
  },

  imp: function () { return this.dati.impostazioni; },

  // Restituisce il giorno se esiste, senza crearlo.
  giorno: function (iso) { return this.dati.giorni[iso] || null; },

  // Crea il giorno solo quando serve davvero scriverci.
  assicuraGiorno: function (iso) {
    var g = this.dati.giorni[iso];
    if (!g) g = this.dati.giorni[iso] = { pasti: {}, attivita: [], umoreId: '', ipo: [], boliExtra: [], note: '' };
    g.pasti = g.pasti || {}; g.attivita = g.attivita || []; g.ipo = g.ipo || []; g.boliExtra = g.boliExtra || [];
    return g;
  },

  // Toglie un giorno rimasto vuoto, per non sporcare il diario.
  pulisciGiorno: function (iso) {
    var g = this.dati.giorni[iso];
    if (!g) return;
    var vuoto = !Object.keys(g.pasti || {}).length && !(g.attivita || []).length &&
      !g.basale && !g.umoreId && !(g.ipo || []).length && !(g.boliExtra || []).length && !g.note;
    if (vuoto) delete this.dati.giorni[iso];
  }
};
