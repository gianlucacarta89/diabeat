/* ============================================================
   servizi/insulina-attiva.js
   Stima dell'insulina rapida ancora attiva (boli dei pasti e
   boli extra). Modello lineare: ogni bolo cala in modo uniforme
   fino a zero nella durata d'azione impostata dall'utente.
   Dipende da: App.Stato, App.Utils, App.Config.
   Usato da: servizi/calcolo-bolo.js, ui/ui-giorno.js.
   ============================================================ */
window.App = window.App || {};

App.InsulinaAttiva = {
  // Tutti i boli registrati nei due giorni precedenti e nel giorno indicato.
  // escludi: chiave "data|pastoId" del pasto che si sta calcolando.
  boli: function (iso, escludi) {
    var U = App.Utils, S = App.Stato;
    var elenco = [];
    [-2, -1, 0].forEach(function (n) {
      var d = U.aggiungiGiorni(iso, n);
      var g = S.giorno(d);
      if (!g) return;
      Object.keys(g.pasti || {}).forEach(function (pid) {
        var p = g.pasti[pid];
        if (p.dose == null || p.dose <= 0 || (d + '|' + pid) === escludi) return;
        var nome = (App.Config.pasti.filter(function (x) { return x.id === pid; })[0] || {}).nome || pid;
        elenco.push({ quando: U.momento(d, p.ora), dose: p.dose, etichetta: nome, data: d, ora: p.ora });
      });
      (g.boliExtra || []).forEach(function (b) {
        if (b.dose > 0) elenco.push({ quando: U.momento(d, b.ora), dose: b.dose, etichetta: 'Bolo extra', data: d, ora: b.ora });
      });
    });
    return elenco.sort(function (a, b) { return a.quando - b.quando; });
  },

  /* Insulina attiva al momento "ms" (millisecondi).
     Restituisce { disponibile, totale, dettaglio: [{etichetta, ora, dose, residuo}] }.
     disponibile = false se la durata d'azione non è impostata. */
  calcola: function (iso, ms, escludi) {
    var durata = App.Stato.imp().insulinaRapida.durataOre;
    if (durata == null) return { disponibile: false, totale: 0, dettaglio: [] };
    var durataMs = durata * 3600 * 1000;
    var dettaglio = [];
    var tot = 0;
    this.boli(iso, escludi).forEach(function (b) {
      var trascorso = ms - b.quando;
      if (trascorso < 0 || trascorso >= durataMs) return;
      var residuo = b.dose * (1 - trascorso / durataMs);
      tot += residuo;
      dettaglio.push({ etichetta: b.etichetta, ora: b.ora, data: b.data, dose: b.dose, residuo: Math.round(residuo * 100) / 100 });
    });
    return { disponibile: true, totale: Math.round(tot * 100) / 100, dettaglio: dettaglio };
  }
};
