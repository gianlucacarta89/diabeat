/* ============================================================
   ui/ui-calcolo.js
   Riquadro del calcolo della dose: mostra ogni passaggio, la dose
   suggerita, gli avvisi e i blocchi di sicurezza.
   Le regole del calcolo stanno in servizi/calcolo-bolo.js.
   Dipende da: App.Config, App.Utils, App.Nav.
   Usato da: ui/ui-pasto.js.
   ============================================================ */
window.App = window.App || {};

App.UICalcolo = {
  disegna: function (box, r) {
    var U = App.Utils;
    var html = '';
    if (r.stato === 'ipo') {
      html = '<div class="riquadro riquadro-pericolo"><b>⛔ Nessuna dose suggerita</b><br>' + U.esc(r.avvisi[0]) + '</div>';
    } else if (r.stato === 'mancano') {
      html = '<div class="riquadro riquadro-avviso"><b>⚙️ Per suggerire la dose mancano:</b><ul>' +
        r.mancanti.map(function (m) { return '<li>' + U.esc(m) + '</li>'; }).join('') +
        '</ul><button class="btn btn-piccolo" style="margin-top:8px" data-az="imp">Vai alle impostazioni</button></div>';
    } else if (r.stato === 'vuoto') {
      html = '<div class="riquadro riquadro-info">Inserisci la glicemia o i cibi per vedere la dose suggerita.</div>';
    } else {
      html = '<div class="calcolo">' +
        r.righe.map(function (x) {
          return '<div class="calcolo-riga"><span class="et">' + U.esc(x.etichetta) + '</span>' +
            '<span class="val">' + U.esc(x.valore) + (x.nota ? '<br><b>' + U.esc(x.nota) + '</b>' : '') + '</span></div>';
        }).join('') +
        '<div class="calcolo-dose"><small>Dose suggerita</small><span class="valore">' + U.dec(r.suggerita, 1) + ' U</span>' +
        '<small>valore esatto ' + U.dec(r.esatta, 2) + ' U, arrotondato al passo della penna</small></div>' +
        '</div>' +
        (r.avvisi.length ? '<div class="riquadro riquadro-avviso"><ul>' +
          r.avvisi.map(function (a) { return '<li>' + U.esc(a) + '</li>'; }).join('') + '</ul></div>' : '') +
        '<details style="margin-top:6px"><summary class="tenue" style="cursor:pointer">Come si calcola</summary><ul class="aiuto">' +
          App.Config.testi.regoleCalcolo.map(function (t) { return '<li>' + U.esc(t) + '</li>'; }).join('') +
        '</ul><div class="aiuto">' + U.esc(App.Config.testi.premessa) + '</div></details>';
    }
    box.innerHTML = html;
    var b = box.querySelector('[data-az=imp]');
    if (b) b.onclick = function () {
      document.querySelectorAll('.finestra-sfondo').forEach(function (x) { x.remove(); });
      document.body.classList.remove('bloccato');
      App.Nav.vai('impostazioni');
    };
  }
};
