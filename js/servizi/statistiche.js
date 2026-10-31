/* ============================================================
   servizi/statistiche.js
   Riepiloghi di un periodo: glicemie, tempo nel range,
   ipoglicemie, insulina rapida, carboidrati, glicemie per pasto,
   per stato d'animo del giorno e nei giorni con attività,
   pasti ricchi di grassi. Nessuna interfaccia.
   Dipende da: App.Stato, App.Config, App.Nutrienti, App.PastoGrasso, App.Utils.
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
    var tutte = [], giorniConDati = 0, boli = [], carb = [], ipo = 0, pastiGrassi = 0;
    var perPasto = {}, perUmore = {}, perAttivita = {};
    App.Config.pasti.forEach(function (p) { perPasto[p.id] = []; });

    for (var d = da; d <= a; d = U.aggiungiGiorni(d, 1)) {
      var g = S.giorno(d);
      if (!g) continue;
      giorniConDati++;
      var glicG = self.glicemieGiorno(g);
      tutte = tutte.concat(glicG);
      ipo += (g.ipo || []).length;
      var boloG = 0, carbG = 0;
      Object.keys(g.pasti || {}).forEach(function (pid) {
        var p = g.pasti[pid], tot = App.Nutrienti.totali(p.voci);
        if (p.dose) boloG += p.dose;
        carbG += tot.carb;
        if (App.PastoGrasso.livello(tot) === 'alto') pastiGrassi++;
        if (p.glicemia != null && perPasto[pid]) perPasto[pid].push(p.glicemia);
      });
      (g.boliExtra || []).forEach(function (b) { boloG += b.dose || 0; });
      boli.push(boloG); carb.push(carbG);
      // Stato d'animo e attività valgono per tutte le glicemie del giorno.
      if (g.umoreId) perUmore[g.umoreId] = (perUmore[g.umoreId] || []).concat(glicG);
      var visti = {};
      (g.attivita || []).forEach(function (x) {
        if (visti[x.attivitaId]) return;
        visti[x.attivitaId] = 1;
        perAttivita[x.attivitaId] = (perAttivita[x.attivitaId] || []).concat(glicG);
      });
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
      ipo: ipo, pastiGrassi: pastiGrassi,
      boloMedio: this.media(boli), carbMedi: this.media(carb),
      perPasto: sintesi(perPasto), perUmore: sintesi(perUmore), perAttivita: sintesi(perAttivita),
      range: range
    };
  }
};
