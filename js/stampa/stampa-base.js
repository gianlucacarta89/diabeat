/* ============================================================
   stampa/stampa-base.js
   Base comune dei PDF: filtro dei caratteri, intestazione,
   tabelle, pie' di pagina, salvataggio con doc.save().
   ATTENZIONE: in questo file solo caratteri ASCII; simboli e
   accenti si scrivono come \uXXXX.
   Dipende da: librerie jsPDF e jsPDF-AutoTable, App.Config, App.Avvisi.
   Usato da: stampa/stampa-report.js.
   ============================================================ */
window.App = window.App || {};

App.StampaBase = {
  BLU: [14, 116, 144],
  BLU_NOTTE: [44, 62, 80],

  disponibile: function () {
    return !!(window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API && window.jspdf.jsPDF.API.autoTable);
  },

  // Filtro: i caratteri standard dei PDF non conoscono emoji e molti simboli.
  pulisci: function (t) {
    if (t == null) return '';
    var s = String(t)
      .replace(/[\u2018\u2019\u201a\u2032]/g, "'")
      .replace(/[\u201c\u201d\u201e\u2033]/g, '"')
      .replace(/[\u2013\u2014\u2212]/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/\u00a0/g, ' ')
      .replace(/\u2192/g, '->')
      .replace(/\u00f7/g, ':');
    // Lettere accentate dell'italiano: restano (sono nel set del PDF); le altre si semplificano.
    // Gli a capo (\n) restano: servono per andare a riga nelle celle.
    s = s.replace(/[^\n\x20-\x7E\u00c0-\u00ff]/g, function (ch) {
      var n = ch.normalize ? ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
      return /^[\x20-\x7E]$/.test(n) ? n : '';
    });
    return s.split('\n').map(function (r) { return r.replace(/[ \t]{2,}/g, ' ').trim(); }).join('\n').trim();
  },

  nuovo: function () {
    var jsPDF = window.jspdf.jsPDF;
    return new jsPDF({ unit: 'mm', format: 'a4' });
  },

  intestazione: function (doc, titolo, sottotitolo) {
    var w = doc.internal.pageSize.getWidth();
    doc.setFillColor.apply(doc, this.BLU);
    doc.rect(0, 0, w, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
    doc.text(this.pulisci(titolo), 12, 11);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    doc.text(this.pulisci(sottotitolo || ''), 12, 17.5);
    doc.setTextColor(30, 30, 30);
    return 30;
  },

  titoloSezione: function (doc, y, testo) {
    if (y > 265) { doc.addPage(); y = 18; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5);
    doc.setTextColor.apply(doc, this.BLU_NOTTE);
    doc.text(this.pulisci(testo), 12, y);
    doc.setTextColor(30, 30, 30);
    return y + 5;
  },

  // Tabella con intestazioni blu notte; ogni cella passa dal filtro.
  tabella: function (doc, y, testa, righe, opz) {
    var self = this;
    opz = opz || {};
    doc.autoTable(Object.assign({
      startY: y,
      head: [testa.map(function (t) { return self.pulisci(t); })],
      body: righe.map(function (r) { return r.map(function (c) { return self.pulisci(c); }); }),
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 1.6, overflow: 'linebreak' },
      headStyles: { fillColor: self.BLU_NOTTE, textColor: 255, fontStyle: 'bold' },
      margin: { left: 12, right: 12 }
    }, opz));
    return doc.lastAutoTable.finalY + 7;
  },

  testo: function (doc, y, testo, dim) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(dim || 9);
    var righe = doc.splitTextToSize(this.pulisci(testo), doc.internal.pageSize.getWidth() - 24);
    if (y + righe.length * 4 > 285) { doc.addPage(); y = 18; }
    doc.text(righe, 12, y);
    return y + righe.length * 4 + 2;
  },

  pie: function (doc) {
    var n = doc.getNumberOfPages();
    for (var i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5); doc.setTextColor(120, 120, 120);
      doc.text(this.pulisci(App.Config.nome + ' v' + App.Config.versione + ' - pagina ' + i + ' di ' + n), 12, 291);
    }
  },

  // La condivisione dei file (WhatsApp, email, Drive...) funziona su molti telefoni, non su tutti i computer.
  puoCondividere: function () {
    try {
      return !!(navigator.canShare && window.File &&
        navigator.canShare({ files: [new File(['x'], 'prova.pdf', { type: 'application/pdf' })] }));
    } catch (e) { return false; }
  },

  // Apre il menu "Condividi" del telefono con il PDF; se non si pu\u00f2, lo scarica.
  condividi: function (doc, nomeFile, titolo) {
    this.pie(doc);
    var file = new File([doc.output('blob')], nomeFile, { type: 'application/pdf' });
    if (!this.puoCondividere()) { doc.save(nomeFile); App.Avvisi.toast('Condivisione non disponibile: PDF scaricato.', 'info'); return; }
    navigator.share({ files: [file], title: this.pulisci(titolo || nomeFile) })
      .catch(function (e) { if (e && e.name !== 'AbortError') { doc.save(nomeFile); App.Avvisi.toast('PDF scaricato', 'ok'); } });
  },

  salva: function (doc, nomeFile) {
    this.pie(doc);
    doc.save(nomeFile);
  }
};
