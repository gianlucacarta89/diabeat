/* ============================================================
   stampa/stampa-report.js
   PDF per il diabetologo: riepilogo del periodo, parametri,
   glicemie per pasto e diario giorno per giorno.
   ATTENZIONE: in questo file solo caratteri ASCII; simboli e
   accenti si scrivono come \uXXXX.
   Dipende da: App.StampaBase, App.Statistiche, App.PastoGrasso, App.Nutrienti,
               App.Stato, App.Config, App.UIComune, App.Avvisi, App.Utils.
   Usato da: ui/ui-statistiche.js (pulsante "Scarica PDF").
   ============================================================ */
window.App = window.App || {};

App.StampaReport = {
  crea: function (da, a) {
    var B = App.StampaBase, U = App.Utils, S = App.Stato, imp = S.imp();
    if (!B.disponibile()) {
      App.Avvisi.toast('Libreria PDF non caricata: ricarica l\'app e riprova.', 'errore', 5000);
      return;
    }
    var st = App.Statistiche.calcola(da, a);
    var v = function (x, d, u) { return x == null ? '-' : U.dec(x, d) + (u || ''); };
    var doc = B.nuovo();
    var y = B.intestazione(doc, App.Config.nome + ' - report',
      'Periodo dal ' + U.formattaData(da) + ' al ' + U.formattaData(a) + ' - creato il ' + U.formattaData(U.oggi()));

    // Riepilogo
    y = B.titoloSezione(doc, y, 'Riepilogo del periodo');
    y = B.tabella(doc, y, ['Voce', 'Valore'], [
      ['Giorni con dati', String(st.giorni)],
      ['Glicemie inserite', String(st.misure)],
      ['Glicemia media', v(st.media, 0, ' mg/dL')],
      ['Minima / massima', v(st.min, 0) + ' / ' + v(st.max, 0) + ' mg/dL'],
      ['Nel range ' + st.range.basso + '-' + st.range.alto, v(st.pctNel, 0, '%')],
      ['Sotto / sopra il range', v(st.pctSotto, 0, '%') + ' / ' + v(st.pctSopra, 0, '%')],
      ['Ipoglicemie registrate', String(st.ipo)],
      ['Insulina rapida al giorno (media)', v(st.boloMedio, 1, ' U')],
      ['Pasti ricchi di grassi', String(st.pastiGrassi)],
      ['Carboidrati al giorno (media)', v(st.carbMedi, 0, ' g')]
    ], { tableWidth: 110, columnStyles: { 1: { halign: 'right' } } });

    // Parametri
    y = B.titoloSezione(doc, y, 'Insulina e parametri attuali');
    y = B.testo(doc, y, 'Rapida: ' + imp.insulinaRapida.nome + ', passo penna ' + U.dec(imp.insulinaRapida.passo) + ' U. ' +
      'Rapporto insulina/carboidrati: ' + v(imp.rapportoIC, 1, ' g per 1 U') + ' (unico per la giornata, senza correzione automatica). ' +
      'Soglia ipoglicemia: ' + v(imp.sogliaIpo, 0, ' mg/dL') + '. Dose massima per bolo: ' + v(imp.doseMax, 1, ' U') + '.');
    y = B.tabella(doc, y, ['Pasto', 'Glicemia media (mg/dL)', 'Misure'],
      App.Config.pasti.map(function (p) {
        var pp = st.perPasto[p.id];
        return [p.nome, pp ? v(pp.media, 0) : '-', pp ? String(pp.n) : '0'];
      }), { tableWidth: 120, columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } } });
    var C = App.Config.pastoGrasso;
    y = B.testo(doc, y, 'Pasto ricco di grassi: almeno ' + C.grassiAlto + ' g di grassi, oppure almeno ' + C.proteineAlte +
      ' g di proteine con ' + C.grassiMedio + ' g di grassi. L\'app suggerisce di non aumentare il bolo iniziale e di valutare circa il ' +
      C.pctAggiuntiva + '% in pi\u00f9 dopo ' + C.controlloDa + '-' + C.controlloA + ' ore se la glicemia sale (ISPAD 2022).');

    // Diario
    doc.addPage(); y = 18;
    y = B.titoloSezione(doc, y, 'Diario');
    var righe = [];
    for (var d = da; d <= a; d = U.aggiungiGiorni(d, 1)) {
      var g = S.giorno(d);
      if (!g) continue;
      var data = U.formattaData(d, true);
      var um = App.UIComune.umore(g.umoreId);
      if (um) righe.push([data, 'Stato d\'animo', '', '', '', '', '', um.nome]);
      App.Config.pasti.forEach(function (p) {
        var x = g.pasti[p.id];
        if (!x) return;
        var extra = [], tot = App.Nutrienti.totali(x.voci);
        if (App.PastoGrasso.livello(tot) === 'alto') extra.push('pasto grasso (' + U.dec(tot.grassi, 0) + ' g grassi)');
        if (x.note) extra.push(x.note);
        righe.push([data, p.nome, x.ora, x.glicemia == null ? '-' : String(x.glicemia), U.dec(tot.carb, 0),
          x.dose == null ? '-' : U.dec(x.dose), x.suggerita == null ? '-' : U.dec(x.suggerita), extra.join('; ')]);
      });
      (g.boliExtra || []).forEach(function (b) {
        righe.push([data, 'Bolo extra', b.ora, b.glicemia == null ? '-' : String(b.glicemia), '-', U.dec(b.dose), '-', b.note || '']);
      });
      (g.ipo || []).forEach(function (x) {
        righe.push([data, 'IPOGLICEMIA', x.ora, String(x.glicemia), '-', '-', '-', x.trattamento || '']);
      });
      (g.attivita || []).forEach(function (x) {
        var at = App.UIComune.attivita(x.attivitaId);
        righe.push([data, 'Attivit\u00e0', x.ora, '-', '-', '-', '-', (at ? at.nome : x.attivitaId) + (x.intensita ? ', intensit\u00e0 ' + x.intensita : '') + (x.durataMin ? ', ' + x.durataMin + ' min' : '') + (x.note ? ' - ' + x.note : '')]);
      });
      if (g.note) righe.push([data, 'Note', '', '', '', '', '', g.note]);
    }
    if (!righe.length) {
      B.testo(doc, y + 4, 'Nessun dato nel periodo.');
    } else {
      B.tabella(doc, y + 2, ['Data', 'Voce', 'Ora', 'Glic.', 'CHO g', 'Dose U', 'Sugg. U', 'Note'], righe, {
        columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { cellWidth: 52 } },
        didParseCell: function (dato) {
          if (dato.section !== 'body') return;
          var voce = dato.row.raw[1];
          if (voce === 'IPOGLICEMIA') { dato.cell.styles.textColor = [192, 57, 43]; dato.cell.styles.fontStyle = 'bold'; }
          if (dato.column.index === 3) {
            var gl = Number(dato.row.raw[3]);
            if (gl) dato.cell.styles.textColor = gl < st.range.basso ? [192, 57, 43] : gl > st.range.alto ? [180, 83, 9] : [30, 132, 73];
          }
        }
      });
    }
    B.salva(doc, 'diabeat_' + da + '_' + a + '.pdf');
    App.Avvisi.toast('PDF scaricato', 'ok');
  }
};
