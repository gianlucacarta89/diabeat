/* ============================================================
   servizi/pasto-grasso.js
   Riconosce i pasti ricchi di grassi o proteine e prepara il
   suggerimento di gestione (basato su ISPAD 2022, Bell 2020,
   Wolpert 2013, Smart 2013). Non cambia la dose suggerita:
   calcola a parte una dose aggiuntiva INDICATIVA da valutare
   dopo 2-3 ore, e gli orari dei controlli.
   Soglie e percentuale stanno in App.Config.pastoGrasso.
   Dipende da: App.Config, App.Stato, App.Utils.
   Usato da: servizi/calcolo-bolo.js, ui/ui-calcolo.js, ui/ui-giorno.js,
             stampa/stampa-report.js.
   ============================================================ */
window.App = window.App || {};

App.PastoGrasso = {
  // "13:30" + 2,5 ore → "16:00"
  oraPiu: function (ora, ore) {
    var p = String(ora || '00:00').split(':');
    var min = (+p[0] * 60 + (+p[1] || 0) + Math.round(ore * 60)) % (24 * 60);
    var h = Math.floor(min / 60), m = min % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  },

  // Solo il livello: 'nessuno' | 'medio' | 'alto'.
  livello: function (tot) {
    var C = App.Config.pastoGrasso;
    if (tot.grassi >= C.grassiAlto || (tot.prot >= C.proteineAlte && tot.grassi >= C.grassiMedio)) return 'alto';
    if (tot.grassi >= C.grassiMedio || tot.prot >= C.proteineAlte) return 'medio';
    return 'nessuno';
  },

  /* tot: totali del pasto { carb, prot, grassi }; doseBase: dose suggerita per i carboidrati (U) o null;
     ora: ora del pasto "HH:MM".
     Restituisce { livello, grassi, prot, aggiuntiva, aggiuntivaEsatta, pochiCarb,
                   controlloDa, controlloA, fine, pct } */
  valuta: function (tot, doseBase, ora) {
    var C = App.Config.pastoGrasso, U = App.Utils;
    var r = { livello: this.livello(tot), grassi: tot.grassi, prot: tot.prot, pct: C.pctAggiuntiva,
      aggiuntiva: null, aggiuntivaEsatta: null, pochiCarb: false,
      controlloDa: this.oraPiu(ora, C.controlloDa), controlloA: this.oraPiu(ora, C.controlloA),
      fine: this.oraPiu(ora, C.durataEffetto) };
    if (r.livello !== 'alto') return r;
    if (doseBase == null || doseBase < C.doseMinima) { r.pochiCarb = true; return r; }
    r.aggiuntivaEsatta = doseBase * C.pctAggiuntiva / 100;
    r.aggiuntiva = U.arrotonda(r.aggiuntivaEsatta, App.Stato.imp().insulinaRapida.passo);
    return r;
  }
};
