/* ============================================================
   ui/ui-parametri.js
   Nelle impostazioni: rapporto insulina/carboidrati (uno solo
   per tutta la giornata) con storico delle modifiche.
   Dipende da: App.Parametri, App.UIComune, App.Avvisi, App.Utils.
   Usato da: ui/ui-impostazioni.js.
   ============================================================ */
window.App = window.App || {};

App.UIParametri = {
  // Le altre schede delle impostazioni non si ridisegnano: ciò che vi è scritto non si perde.
  disegna: function (c) { c.appendChild(this.crea()); },

  crea: function () {
    var U = App.Utils, UC = App.UIComune, self = this;
    var card = U.el('<div class="card"><h2>🧮 Rapporto insulina/carboidrati</h2>' +
      UC.campo('par-ic', 'Grammi di carboidrati coperti da 1 unità', App.Parametri.rapportoIC(), 'g/U',
        { classe: 'grande', aiuto: 'Uno solo per tutta la giornata. Dose suggerita = carboidrati ÷ questo valore.' }) +
      '<button class="btn btn-verde btn-pieno" style="margin-top:10px" data-az="salva">💾 Salva rapporto</button>' +
      '<details style="margin-top:12px"><summary class="tenue" style="cursor:pointer">📜 Storico delle modifiche</summary><div id="par-storico"></div></details>' +
    '</div>');

    card.querySelector('[data-az=salva]').onclick = function () {
      var e = App.Parametri.salva(UC.num(card, '#par-ic'));
      if (e) return UC.errore(card, '#par-ic', e);
      App.Avvisi.toast('Rapporto salvato', 'ok');
      card.replaceWith(self.crea());
    };

    var st = card.querySelector('#par-storico');
    var storico = App.Parametri.storico().slice().reverse();
    if (!storico.length) st.innerHTML = '<p class="tenue">Nessuna modifica registrata.</p>';
    var fmt = function (x) { return x == null ? '–' : U.dec(x) + ' g/U'; };
    storico.slice(0, 40).forEach(function (s) {
      var d = new Date(s.quando);
      st.appendChild(U.el('<div class="aiuto" style="padding:5px 0;border-bottom:1px dashed var(--bordo)"><b>' +
        U.formattaData(U.dataISO(d), true) + ' ' + U.esc(d.toTimeString().slice(0, 5)) + '</b> · ' +
        fmt(s.prima) + ' → <b>' + fmt(s.dopo) + '</b>' + (s.vecchio ? ' (colazione, v1.0)' : '') + '</div>'));
    });
    return card;
  }
};
