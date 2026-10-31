/* ============================================================
   servizi/statistiche.js
   Riepiloghi di un periodo: glicemie, tempo nel range,
   ipoglicemie, insulina, carboidrati, glicemie per pasto e per
   stato d'animo. Nessuna interfaccia.
   Dipende da: App.Stato, App.Config, App.Nutrienti, App.Utils.
   Usato da: ui/ui-statistiche.js, stampa/stampa-report.js.
   ============================================================ */
window.App = window.App || {};

App.Statistiche = {
  media: function (arr) {
    if (!arr.length) return null;
    return arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
  },

  // Tutte le glicemie del giorno (pasti, ipo, boli extra).
  glicemieGiorno: function (g) {
    var v = [];
    Object.keys(g.pasti || {}).forEach(function (k) { if (g.pasti[k].glicemia != null) v.push(g.pasti[k].glicemia); });
    (g.ipo || []).forEach(function (x) { if (x.glicemia != null) v.push(x.glicemia); });
    (g.boliExtra || []).forEach(function (x) { if (x.glicemia != null) v.push(x.glicemia); });
    return v;
  },

  /* da, a: date ISO comprese. */
  calcola: function (da, a) {
    var U = App.Utils, S = App.Stato, self = this;
    var range = S.imp().range;
    var tutte = [], giorniConDati = 0, boli = [], basali = [], carb = [], ipo = 0;
    var perPasto = {}, perUmore = {}, perAttivita = {};
    App.Config.pasti.forEach(function (p) { perPasto[p.id] = []; });

    for (var d = da; d <= a; d = U.aggiungiGiorni(d, 1)) {
      var g = S.giorno(d);
      if (!g) continue;
      giorniConDati++;
      tutte = tutte.concat(self.glicemieGiorno(g));
      ipo += (g.ipo || []).length;
      var boloG = 0, carbG = 0;
      Object.keys(g.pasti || {}).forEach(function (pid) {
        var p = g.pasti[pid];
        if (p.dose) boloG += p.dose;
        carbG += App.Nutrienti.totali(p.voci).carb;
        if (p.glicemia != null) {
          if (perPasto[pid]) perPasto[pid].push(p.glicemia);
          if (p.umoreId) (perUmore[p.umoreId] = perUmore[p.umoreId] || []).push(p.glicemia);
          (p.attivitaIds || []).forEach(function (aid) { (perAttivita[aid] = perAttivita[aid] || []).push(p.glicemia); });
        }
      });
      (g.boliExtra || []).forEach(function (b) { boloG += b.dose || 0; });
      boli.push(boloG); carb.push(carbG);
      if (g.basale) basali.push(g.basale.dose);
    }

    var nel = tutte.filter(function (x) { return x >= range.basso && x <= range.alto; }).length;
    var sotto = tutte.filter(function (x) { return x < range.basso; }).length;
    var sopra = tutte.filter(function (x) { return x > range.alto; }).length;
    var sintesi = function (o) {
      var r = {};
      Object.keys(o).forEach(function (k) { if (o[k].length) r[k] = { media: self.media(o[k]), n: o[k].length }; });
      return r;
    };
    return {
      da: da, a: a, giorni: giorniConDati, misure: tutte.length,
      media: this.media(tutte),
      min: tutte.length ? Math.min.apply(null, tutte) : null,
      max: tutte.length ? Math.max.apply(null, tutte) : null,
      pctNel: tutte.length ? nel / tutte.length * 100 : null,
      pctSotto: tutte.length ? sotto / tutte.length * 100 : null,
      pctSopra: tutte.length ? sopra / tutte.length * 100 : null,
      ipo: ipo,
      boloMedio: this.media(boli), basaleMedia: this.media(basali), carbMedi: this.media(carb),
      perPasto: sintesi(perPasto), perUmore: sintesi(perUmore), perAttivita: sintesi(perAttivita),
      range: range
    };
  }
};
