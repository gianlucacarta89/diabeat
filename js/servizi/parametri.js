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

  // Correzione con la glicemia: attiva solo se ci sono entrambi i valori.
  correzione: function () {
    var imp = App.Stato.imp();
    if (imp.fattoreCorrezione == null || imp.obiettivo == null) return null;
    var basso = imp.obiettivo, alto = imp.obiettivoAlto != null ? imp.obiettivoAlto : imp.obiettivo;
    return { fattore: imp.fattoreCorrezione, basso: basso, alto: alto, testo: basso === alto ? String(basso) : basso + '-' + alto };
  },

  /* Salva fattore di correzione e obiettivo da/a (tutti o nessuno; "a" vuoto = valore unico).
     Restituisce un errore o null. */
  salvaCorrezione: function (fattore, obiettivo, obiettivoAlto) {
    var S = App.Sicurezza;
    if (obiettivo == null && obiettivoAlto != null) { obiettivo = obiettivoAlto; obiettivoAlto = null; }
    if ((fattore == null) !== (obiettivo == null)) return 'Scrivi sia il fattore di correzione sia la glicemia obiettivo (o lasciali vuoti per non usare la correzione).';
    var e = S.controlla('fattoreCorrezione', fattore, 'Fattore di correzione', false) || S.controlla('obiettivo', obiettivo, 'Obiettivo (da)', false) ||
      S.controlla('obiettivo', obiettivoAlto, 'Obiettivo (a)', false);
    if (e) return e;
    if (obiettivoAlto != null && obiettivoAlto < obiettivo) return 'Obiettivo: il valore "a" deve essere maggiore o uguale a "da".';
    if (obiettivoAlto === obiettivo) obiettivoAlto = null;
    if (fattore == null) obiettivoAlto = null;
    var imp = App.Stato.imp();
    if (imp.fattoreCorrezione === fattore && imp.obiettivo === obiettivo && (imp.obiettivoAlto == null ? null : imp.obiettivoAlto) === obiettivoAlto) return null;
    imp.storicoParametri.push({ quando: new Date().toISOString(), tipo: 'correzione',
      prima: { fattore: imp.fattoreCorrezione, obiettivo: imp.obiettivo, obiettivoAlto: imp.obiettivoAlto },
      dopo: { fattore: fattore, obiettivo: obiettivo, obiettivoAlto: obiettivoAlto } });
    imp.fattoreCorrezione = fattore; imp.obiettivo = obiettivo; imp.obiettivoAlto = obiettivoAlto;
    App.Stato.salva('impostazioni');
    return null;
  },

  // Storico in forma uniforme, anche per le voci della v1.0 (parametri per pasto).
  storico: function () {
    return App.Stato.imp().storicoParametri.map(function (s) {
      if (s.tipo === 'correzione') return s;
      if (s.cambi) {
        var c = s.cambi[0] || {};
        return { quando: s.quando, prima: (c.prima || {}).rapportoIC, dopo: (c.dopo || {}).rapportoIC, vecchio: true };
      }
      return s;
    });
  }
};
