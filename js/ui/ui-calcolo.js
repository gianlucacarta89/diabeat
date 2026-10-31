/* ============================================================
   ui/ui-calcolo.js
   Riquadro del calcolo della dose nel pasto: passaggi, dose
   suggerita, avvisi, informazioni, e il riquadro "pasto ricco di
   grassi o proteine" con la strategia suggerita.
   Le regole stanno in servizi/calcolo-bolo.js e servizi/pasto-grasso.js.
   Dipende da: App.Config, App.Utils, App.Nav, App.UIGiornoExtra.
   Usato da: ui/ui-pasto.js.
   ============================================================ */
window.App = window.App || {};

App.UICalcolo = {
  disegna: function (box, r, iso) {
    var U = App.Utils;
    var lista = function (arr) { return '<ul>' + arr.map(function (a) { return '<li>' + U.esc(a) + '</li>'; }).join('') + '</ul>'; };
    var html = '';
    if (r.stato === 'ipo') {
      html = '<div class="riquadro riquadro-pericolo"><b>⛔ Nessuna dose suggerita</b><br>' + U.esc(r.avvisi[0]) + '</div>';
    } else if (r.stato === 'mancano') {
      html = '<div class="riquadro riquadro-avviso"><b>⚙️ Per suggerire la dose mancano:</b>' + lista(r.mancanti) +
        '<button class="btn btn-piccolo" style="margin-top:8px" data-az="imp">Vai alle impostazioni</button></div>';
    } else if (r.stato === 'vuoto') {
      html = '<div class="riquadro riquadro-info">Aggiungi i cibi per vedere la dose suggerita.</div>';
    } else {
      html = '<div class="calcolo">' +
        r.righe.map(function (x) {
          return '<div class="calcolo-riga"><span class="et">' + U.esc(x.etichetta) + '</span>' +
            '<span class="val">' + U.esc(x.valore) + (x.nota ? '<br><b>' + U.esc(x.nota) + '</b>' : '') + '</span></div>';
        }).join('') +
        '<div class="calcolo-dose"><small>Dose suggerita per il pasto</small><span class="valore">' + U.dec(r.suggerita, 1) + ' U</span>' +
        '<small>valore esatto ' + U.dec(r.esatta, 2) + ' U, arrotondato al passo della penna</small></div>' +
        '</div>' +
        (r.avvisi.length ? '<div class="riquadro riquadro-avviso">' + lista(r.avvisi) + '</div>' : '') +
        (r.info.length ? '<div class="riquadro riquadro-info">' + lista(r.info) + '</div>' : '') +
        this.htmlGrasso(r.grasso) +
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
    var agg = box.querySelector('[data-az=aggiuntiva]');
    if (agg) agg.onclick = function () {
      App.UIGiornoExtra.finestraBolo(iso, {
        titolo: 'Dose aggiuntiva pasto grasso',
        nota: 'Dose aggiuntiva pasto grasso',
        aiutoDose: r.grasso.aggiuntiva != null ? 'Indicativa: ' + U.dec(r.grasso.aggiuntiva) + ' U. Scrivi la dose che fai davvero.' : 'Scrivi la dose che fai davvero.'
      });
    };
  },

  // Riquadro del pasto ricco di grassi o proteine.
  htmlGrasso: function (g) {
    if (!g || g.livello === 'nessuno') return '';
    var U = App.Utils, C = App.Config.pastoGrasso;
    var cosa = [];
    if (g.grassi >= C.grassiMedio) cosa.push(U.dec(g.grassi, 0) + ' g di grassi');
    if (g.prot >= C.proteineAlte) cosa.push(U.dec(g.prot, 0) + ' g di proteine');
    if (g.livello === 'medio') {
      return '<div class="riquadro riquadro-info">🧈 <b>Grassi moderati</b> (' + U.esc(cosa.join(', ')) + '). ' +
        'Di solito basta la dose normale; se vuoi, controlla la glicemia verso le ' + g.controlloA + '.</div>';
    }
    var passi = g.pochiCarb ? [
      'Pasto con pochi carboidrati ma ricco di grassi o proteine: la glicemia può salire tra 3 e 5 ore dopo, anche senza bolo.',
      'Controlla il sensore tra le ' + g.controlloDa + ' e le ' + g.controlloA + ' e poi fino alle ' + g.fine + '.',
      'Se sale, correggi come ti ha indicato il diabetologo.'
    ] : [
      'Fai la dose suggerita prima del pasto, senza aumentarla subito: nelle prime 2-3 ore i grassi rallentano i carboidrati e una dose più alta può portare all\'ipoglicemia.',
      'Tra le ' + g.controlloDa + ' e le ' + g.controlloA + ' guarda il sensore. Se la glicemia sta salendo, valuta una dose aggiuntiva di circa ' +
        U.dec(g.aggiuntiva) + ' U (il ' + g.pct + '% della dose del pasto).',
      'Non farla se la glicemia è stabile o in calo, o se fai attività fisica nelle ore dopo il pasto.',
      'Tieni d\'occhio la glicemia fino alle ' + g.fine + ' (6 ore). Dopo una cena così, controlla anche prima di dormire.'
    ];
    return '<div class="riquadro riquadro-avviso">🧈 <b>Pasto ricco di ' + U.esc(cosa.join(' e ')) + '</b>' +
      '<p style="margin:6px 0">Cosa aspettarti: all\'inizio la glicemia può salire meno del solito, poi tende a salire tra 3 e 6 ore dopo il pasto.</p>' +
      '<ol style="margin:4px 0;padding-left:20px">' + passi.map(function (p) { return '<li style="margin-bottom:4px">' + U.esc(p) + '</li>'; }).join('') + '</ol>' +
      '<button class="btn btn-piccolo btn-contorno btn-pieno" style="margin-top:6px" data-az="aggiuntiva">💉 Registra la dose aggiuntiva</button>' +
      '<p class="aiuto" style="margin-top:6px">Punto di partenza indicato da ISPAD 2022 e dagli studi sul tipo 1 (vedi la ricerca "Grassi e glicemia"). ' +
      'La risposta ai grassi cambia molto da persona a persona: adattalo con il diabetologo guardando i tuoi dati.</p></div>';
  }
};
