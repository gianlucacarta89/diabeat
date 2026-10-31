/* ============================================================
   ui/ui-comune.js
   Piccoli pezzi di interfaccia usati da più schermate:
   chip della glicemia, campi numerici, lettura dei campi.
   Dipende da: App.Utils, App.Stato.
   Usato da: tutti gli altri file di ui/.
   ============================================================ */
window.App = window.App || {};

App.UIComune = {
  // Chip colorato della glicemia (rosso sotto range, verde nel range, arancio sopra).
  chipGlicemia: function (v) {
    if (v == null) return '';
    var r = App.Stato.imp().range;
    var cls = v < r.basso ? 'chip-g-bassa' : (v > r.alto ? 'chip-g-alta' : 'chip-g-ok');
    return '<span class="chip ' + cls + '">🩸 ' + v + '</span>';
  },

  chipDose: function (d, etichetta) {
    if (d == null) return '';
    return '<span class="chip chip-dose">💉 ' + App.Utils.dec(d) + ' U' + (etichetta ? ' ' + etichetta : '') + '</span>';
  },

  // Campo numerico con unità. valore null = campo vuoto.
  campo: function (id, etichetta, valore, unita, opz) {
    opz = opz || {};
    var v = valore == null ? '' : String(valore).replace('.', ',');
    return (etichetta ? '<label for="' + id + '">' + etichetta + '</label>' : '') +
      '<div class="campo-unita"><input id="' + id + '" inputmode="decimal" autocomplete="off" value="' + App.Utils.esc(v) + '"' +
      (opz.placeholder ? ' placeholder="' + App.Utils.esc(opz.placeholder) + '"' : '') +
      (opz.classe ? ' class="' + opz.classe + '"' : '') + '>' +
      (unita ? '<span>' + unita + '</span>' : '') + '</div>' +
      (opz.aiuto ? '<div class="aiuto">' + opz.aiuto + '</div>' : '');
  },

  campoOra: function (id, etichetta, valore) {
    return '<label for="' + id + '">' + etichetta + '</label><input id="' + id + '" type="time" value="' + App.Utils.esc(valore || '') + '">';
  },

  // Legge un numero da un campo (null se vuoto).
  num: function (radice, sel) {
    var el = radice.querySelector(sel);
    return el ? App.Utils.numero(el.value) : null;
  },
  testo: function (radice, sel) {
    var el = radice.querySelector(sel);
    return el ? el.value.trim() : '';
  },

  // Segna in rosso il campo sbagliato e mostra il messaggio.
  errore: function (radice, sel, messaggio) {
    if (sel) {
      var el = radice.querySelector(sel);
      if (el) { el.classList.add('errore'); el.focus(); el.addEventListener('input', function () { el.classList.remove('errore'); }, { once: true }); }
    }
    App.Avvisi.toast(messaggio, 'errore', 5500);
  },

  nomePasto: function (id) {
    var p = App.Config.pasti.filter(function (x) { return x.id === id; })[0];
    return p ? p.nome : id;
  },
  iconaPasto: function (id) {
    var p = App.Config.pasti.filter(function (x) { return x.id === id; })[0];
    return p ? p.icona : '';
  },
  attivita: function (id) {
    return App.Stato.imp().attivita.filter(function (a) { return a.id === id; })[0] || null;
  },
  umore: function (id) {
    return App.Stato.imp().umori.filter(function (u) { return u.id === id; })[0] || null;
  }
};
