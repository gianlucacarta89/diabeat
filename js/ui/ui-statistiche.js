/* ============================================================
   ui/ui-statistiche.js
   Scheda "Statistiche": riepilogo di un periodo (7, 14, 30, 90
   giorni), glicemie per pasto, per stato d'animo e nei giorni con attività,
   e PDF per il diabetologo.
   Dipende da: App.Statistiche, App.StampaReport, App.Stato, App.UIComune,
               App.Config, App.Nav, App.Utils.
   Usato da: ui/navigazione.js.
   ============================================================ */
window.App = window.App || {};

App.UIStatistiche = {
  giorni: 14,

  disegna: function (c) {
    var U = App.Utils, UC = App.UIComune, self = this;
    var a = U.oggi(), da = U.aggiungiGiorni(a, -(this.giorni - 1));
    var s = App.Statistiche.calcola(da, a);

    var scelta = U.el('<div class="schede"></div>');
    [7, 14, 30, 90].forEach(function (n) {
      var b = U.el('<button>' + n + ' giorni</button>');
      b.classList.toggle('attivo', self.giorni === n);
      b.onclick = function () { self.giorni = n; App.Nav.disegna(); };
      scelta.appendChild(b);
    });
    c.appendChild(scelta);
    c.appendChild(U.el('<p class="tenue centro" style="margin-top:0">dal ' + U.formattaData(da, true) + ' al ' + U.formattaData(a, true) +
      ' · ' + s.giorni + ' giorni con dati · ' + s.misure + ' glicemie</p>'));

    if (!s.misure && !s.giorni) {
      c.appendChild(U.el('<div class="card centro tenue">Nessun dato nel periodo. Le statistiche compaiono man mano che compili il diario.</div>'));
    } else {
      var v = function (x, d, u) { return x == null ? '–' : U.dec(x, d) + (u || ''); };
      c.appendChild(U.el('<div class="griglia-3">' +
        '<div class="stat"><b>' + v(s.media, 0) + '</b><small>glicemia media</small></div>' +
        '<div class="stat"><b>' + v(s.pctNel, 0, '%') + '</b><small>nel range ' + s.range.basso + '–' + s.range.alto + '</small></div>' +
        '<div class="stat"><b>' + s.ipo + '</b><small>ipoglicemie</small></div>' +
        '<div class="stat"><b>' + v(s.boloMedio, 1) + '</b><small>U rapida al giorno</small></div>' +
        '<div class="stat"><b>' + s.pastiGrassi + '</b><small>pasti ricchi di grassi</small></div>' +
        '<div class="stat"><b>' + v(s.carbMedi, 0) + '</b><small>g CHO al giorno</small></div>' +
      '</div>'));
      if (s.misure) {
        c.appendChild(U.el('<div class="card" style="margin-top:10px"><b>Distribuzione delle glicemie</b>' +
          '<div class="barra-tir">' +
            '<div style="width:' + s.pctSotto + '%;background:var(--g-bassa)"></div>' +
            '<div style="width:' + s.pctNel + '%;background:var(--g-ok)"></div>' +
            '<div style="width:' + s.pctSopra + '%;background:var(--g-alta)"></div></div>' +
          '<div class="riga" style="justify-content:space-between;font-size:.85rem">' +
            '<span style="color:var(--g-bassa)">▼ sotto ' + U.dec(s.pctSotto, 0) + '%</span>' +
            '<span style="color:var(--g-ok)">● nel range ' + U.dec(s.pctNel, 0) + '%</span>' +
            '<span style="color:var(--g-alta)">▲ sopra ' + U.dec(s.pctSopra, 0) + '%</span></div>' +
          '<p class="aiuto">Minima ' + v(s.min, 0) + ' · massima ' + v(s.max, 0) + ' mg/dL. Sono le glicemie inserite a mano, non i dati continui del sensore.</p></div>'));
      }

      var tabella = function (titolo, righe, nota) {
        if (!righe.length) return;
        c.appendChild(U.el('<div class="card"><b>' + titolo + '</b><table class="tabella"><thead><tr><th></th><th class="num">media</th><th class="num">misure</th></tr></thead><tbody>' +
          righe.map(function (r) { return '<tr><td>' + r[0] + '</td><td class="num">' + UC.chipGlicemia(Math.round(r[1])) + '</td><td class="num">' + r[2] + '</td></tr>'; }).join('') +
          '</tbody></table>' + (nota ? '<p class="aiuto">' + nota + '</p>' : '') + '</div>'));
      };
      tabella('Glicemia prima dei pasti', App.Config.pasti.filter(function (p) { return s.perPasto[p.id]; }).map(function (p) {
        return [p.icona + ' ' + p.nome, s.perPasto[p.id].media, s.perPasto[p.id].n];
      }));
      tabella('Glicemia per stato d\'animo del giorno', App.Config.umoriPredefiniti.filter(function (u) { return s.perUmore[u.id]; }).map(function (u) {
        return [u.icona + ' ' + U.esc(u.nome), s.perUmore[u.id].media, s.perUmore[u.id].n];
      }), 'Media di tutte le glicemie dei giorni con quello stato d\'animo. Con poche misure le differenze non sono affidabili.');
      tabella('Glicemia nei giorni con attività', App.Stato.imp().attivita.filter(function (x) { return s.perAttivita[x.id]; }).map(function (x) {
        return [x.icona + ' ' + U.esc(x.nome), s.perAttivita[x.id].media, s.perAttivita[x.id].n];
      }), 'Media di tutte le glicemie dei giorni in cui hai registrato l\'attività.');
    }

    var pdf = U.el('<div class="card"><b>📄 Report per il diabetologo</b><p class="tenue">PDF con il riepilogo del periodo scelto, i parametri e il diario giorno per giorno.</p>' +
      '<button class="btn btn-viola btn-pieno">📄 Scarica PDF (' + this.giorni + ' giorni)</button></div>');
    pdf.querySelector('button').onclick = function () { App.StampaReport.crea(da, a); };
    c.appendChild(pdf);
  }
};
