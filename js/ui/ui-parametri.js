/* ============================================================
   ui/ui-parametri.js
   Nelle impostazioni: rapporto insulina/carboidrati (uno solo
   per tutta la giornata), correzione con la glicemia (facoltativa)
   e storico delle modifiche.
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
      '<h3 style="margin:18px 0 4px">🎯 Correzione con la glicemia <small class="tenue">(facoltativa)</small></h3>' +
      '<p class="aiuto" style="margin-top:0">Se imposti il fattore, la dose del pasto si corregge in base alla glicemia. L\'obiettivo lo scegli in ogni pasto: dentro l\'obiettivo nessuna correzione; sopra aggiunge (glicemia − limite alto) ÷ fattore; sotto toglie (limite basso − glicemia) ÷ fattore. Concorda i valori con la tua diabetologa. Lascia vuoto il fattore per non usarla.</p>' +
      UC.campo('par-fc', 'Fattore di correzione', App.Stato.imp().fattoreCorrezione, 'mg/dL per 1 U', { aiuto: '1 unità abbassa la glicemia di… (es. 30)' }) +
      '<label for="par-ob">Obiettivo proposto nei pasti</label><select id="par-ob">' +
        App.Config.obiettiviGlicemia.map(function (o) {
          return '<option value="' + o.id + '"' + (o.id === App.Parametri.obiettivo().id ? ' selected' : '') + '>' + U.esc(o.nome + ' mg/dL · ' + o.nota) + '</option>';
        }).join('') + '</select>' +
      '<p class="aiuto" style="margin-top:2px">Nel pasto puoi sempre cambiarlo dal menu 🎯.</p>' +
      '<button class="btn btn-verde btn-pieno" style="margin-top:10px" data-az="salvaCorr">💾 Salva correzione</button>' +
      '<details style="margin-top:12px"><summary class="tenue" style="cursor:pointer">📜 Storico delle modifiche</summary><div id="par-storico"></div></details>' +
    '</div>');

    card.querySelector('[data-az=salva]').onclick = function () {
      var e = App.Parametri.salva(UC.num(card, '#par-ic'));
      if (e) return UC.errore(card, '#par-ic', e);
      App.Avvisi.toast('Rapporto salvato', 'ok');
      card.replaceWith(self.crea());
    };

    card.querySelector('[data-az=salvaCorr]').onclick = function () {
      var e = App.Parametri.salvaCorrezione(UC.num(card, '#par-fc'), card.querySelector('#par-ob').value);
      if (e) return UC.errore(card, '#par-fc', e);
      App.Avvisi.toast(App.Parametri.correzione() ? 'Correzione salvata' : 'Correzione disattivata', 'ok');
      card.replaceWith(self.crea());
    };

    var st = card.querySelector('#par-storico');
    var storico = App.Parametri.storico().slice().reverse();
    if (!storico.length) st.innerHTML = '<p class="tenue">Nessuna modifica registrata.</p>';
    var fmtC = function (x) {
      if (!x || x.fattore == null) return 'nessuna';
      var ob = x.predefinito ? App.Parametri.obiettivo(x.predefinito).nome : U.dec(x.obiettivo) + (x.obiettivoAlto != null ? '-' + U.dec(x.obiettivoAlto) : '');
      return '1 U = ' + U.dec(x.fattore) + ' mg/dL, obiettivo ' + ob;
    };
    var fmt = function (x) { return x == null ? '–' : U.dec(x) + ' g/U'; };
    storico.slice(0, 40).forEach(function (s) {
      var d = new Date(s.quando);
      st.appendChild(U.el('<div class="aiuto" style="padding:5px 0;border-bottom:1px dashed var(--bordo)"><b>' +
        U.formattaData(U.dataISO(d), true) + ' ' + U.esc(d.toTimeString().slice(0, 5)) + '</b> · ' +
        (s.tipo === 'correzione' ? 'Correzione: ' + fmtC(s.prima) + ' → <b>' + fmtC(s.dopo) + '</b>'
          : fmt(s.prima) + ' → <b>' + fmt(s.dopo) + '</b>' + (s.vecchio ? ' (colazione, v1.0)' : '')) + '</div>'));
    });
    return card;
  }
};
