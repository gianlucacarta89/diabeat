/* ============================================================
   servizi/nutrienti.js
   Dai grammi ai macronutrienti (carboidrati, proteine, grassi).
   Dipende da: nulla.
   Usato da: servizi/modelli.js, servizi/diario.js,
             servizi/calcolo-bolo.js, ui/ui-pasto-cibi.js.
   ============================================================ */
window.App = window.App || {};

App.Nutrienti = {
  // alimento: valori per 100 g. Restituisce i grammi di ciascun macro nella porzione.
  per: function (alimento, grammi) {
    var f = (grammi || 0) / 100;
    var r = function (x) { return Math.round((x || 0) * f * 10) / 10; };
    return { carb: r(alimento.carb), prot: r(alimento.prot), grassi: r(alimento.grassi) };
  },

  // Crea la voce di un pasto: copia i valori, così il diario non cambia se poi correggi l'archivio.
  voce: function (alimento, grammi) {
    var m = this.per(alimento, grammi);
    return {
      alimentoId: alimento.id, nome: alimento.nome, categoria: alimento.categoria,
      per100: { carb: alimento.carb, prot: alimento.prot, grassi: alimento.grassi },
      grammi: grammi, carb: m.carb, prot: m.prot, grassi: m.grassi
    };
  },

  // Ricalcola una voce quando cambiano i grammi.
  aggiornaGrammi: function (voce, grammi) {
    var m = this.per(voce.per100, grammi);
    voce.grammi = grammi; voce.carb = m.carb; voce.prot = m.prot; voce.grassi = m.grassi;
    return voce;
  },

  totali: function (voci) {
    var t = { carb: 0, prot: 0, grassi: 0, grammi: 0 };
    (voci || []).forEach(function (v) {
      t.carb += v.carb || 0; t.prot += v.prot || 0; t.grassi += v.grassi || 0; t.grammi += v.grammi || 0;
    });
    ['carb', 'prot', 'grassi'].forEach(function (k) { t[k] = Math.round(t[k] * 10) / 10; });
    return t;
  }
};
