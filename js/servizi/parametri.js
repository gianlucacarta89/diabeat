/* ============================================================
   servizi/parametri.js
   Rapporto insulina/carboidrati: uno solo per tutta la giornata,
   con storico delle modifiche.
   Dipende da: App.Stato, App.Sicurezza, App.Utils.
   Usato da: servizi/calcolo-bolo.js, ui/ui-parametri.js,
             stampa/stampa-report.js.
   ============================================================ */
window.App = window.App || {};

App.Parametri = {
  rapportoIC: function () { return App.Stato.imp().rapportoIC; },

  // Elenco di ciò che manca per suggerire una dose.
  mancanti: function () {
    return this.rapportoIC() == null ? ['rapporto insulina/carboidrati'] : [];
  },

  /* Salva il rapporto e registra la modifica nello storico.
     Restituisce un messaggio di errore o null. */
  salva: function (valore) {
    var e = App.Sicurezza.controlla('rapportoIC', valore, 'Rapporto insulina/carboidrati', false);
    if (e) return e;
    var imp = App.Stato.imp();
    if (imp.rapportoIC === valore) return null;
    imp.storicoParametri.push({ quando: new Date().toISOString(), prima: imp.rapportoIC, dopo: valore });
    imp.rapportoIC = valore;
    App.Stato.salva('impostazioni');
    return null;
  },

  // Storico in forma uniforme, anche per le voci della v1.0 (parametri per pasto).
  storico: function () {
    return App.Stato.imp().storicoParametri.map(function (s) {
      if (s.cambi) {
        var c = s.cambi[0] || {};
        return { quando: s.quando, prima: (c.prima || {}).rapportoIC, dopo: (c.dopo || {}).rapportoIC, vecchio: true };
      }
      return s;
    });
  }
};
