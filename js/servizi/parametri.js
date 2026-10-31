/* ============================================================
   servizi/parametri.js
   Rapporto insulina/carboidrati, fattore di sensibilità e
   obiettivo glicemico per ogni pasto, con storico delle modifiche.
   Dipende da: App.Config, App.Stato, App.Sicurezza, App.Utils.
   Usato da: servizi/calcolo-bolo.js, ui/ui-parametri.js,
             stampa/stampa-report.js.
   ============================================================ */
window.App = window.App || {};

App.Parametri = {
  CAMPI: [
    { id: 'rapportoIC',  nome: 'Rapporto insulina/carboidrati', breve: 'I/C' },
    { id: 'sensibilita', nome: 'Fattore di sensibilità',       breve: 'FSI' },
    { id: 'obiettivo',   nome: 'Obiettivo glicemico',          breve: 'Obiettivo' }
  ],

  di: function (pastoId) {
    return App.Stato.imp().parametri[pastoId] || { rapportoIC: null, sensibilita: null, obiettivo: null };
  },

  // Elenco dei parametri mancanti per un pasto.
  mancanti: function (pastoId) {
    var p = this.di(pastoId);
    var nomePasto = (App.Config.pasti.filter(function (x) { return x.id === pastoId; })[0] || {}).nome;
    return this.CAMPI.filter(function (c) { return p[c.id] == null; })
      .map(function (c) { return c.nome.toLowerCase() + ' (' + nomePasto + ')'; });
  },

  // Controlla i valori di un pasto. Restituisce un messaggio o null.
  valida: function (valori) {
    var S = App.Sicurezza;
    return S.controlla('rapportoIC', valori.rapportoIC, 'Rapporto insulina/carboidrati', false) ||
      S.controlla('sensibilita', valori.sensibilita, 'Fattore di sensibilità', false) ||
      S.controlla('obiettivo', valori.obiettivo, 'Obiettivo glicemico', false);
  },

  /* Salva i parametri di uno o più pasti e registra la modifica nello storico.
     nuovi: { pastoId: {rapportoIC, sensibilita, obiettivo}, ... }
     Restituisce un messaggio di errore o null. */
  salva: function (nuovi) {
    var imp = App.Stato.imp();
    var ids = Object.keys(nuovi);
    for (var i = 0; i < ids.length; i++) {
      var e = this.valida(nuovi[ids[i]]);
      if (e) return e;
    }
    var cambi = [];
    ids.forEach(function (id) {
      var prima = imp.parametri[id] || {};
      var dopo = nuovi[id];
      var diverso = ['rapportoIC', 'sensibilita', 'obiettivo'].some(function (k) { return prima[k] !== dopo[k]; });
      if (diverso) {
        cambi.push({ pasto: id, prima: App.Utils.clona(prima), dopo: App.Utils.clona(dopo) });
        imp.parametri[id] = App.Utils.clona(dopo);
      }
    });
    if (cambi.length) {
      imp.storicoParametri.push({ quando: new Date().toISOString(), cambi: cambi });
      App.Stato.salva('impostazioni');
    }
    return null;
  },

  // I parametri validi in una certa data (dallo storico), per i report.
  inData: function (iso) {
    var imp = App.Stato.imp();
    var fine = App.Utils.momento(iso, '23:59');
    var stato = App.Utils.clona(imp.parametri);
    // Si parte dai valori attuali e si annullano le modifiche successive alla data.
    for (var i = imp.storicoParametri.length - 1; i >= 0; i--) {
      var s = imp.storicoParametri[i];
      if (new Date(s.quando).getTime() <= fine) break;
      s.cambi.forEach(function (c) { stato[c.pasto] = App.Utils.clona(c.prima); });
    }
    return stato;
  }
};
