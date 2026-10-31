/* ============================================================
   ui/ui-parametri.js
   Nelle impostazioni: rapporto insulina/carboidrati, fattore di
   sensibilità e obiettivo per ogni pasto, con "copia a tutti" e
   storico delle modifiche.
   Dipende da: App.Parametri, App.Config, App.Stato, App.UIComune,
               App.Avvisi, App.Nav, App.Utils.
   Usato da: ui/ui-impostazioni.js.
   ============================================================ */
window.App = window.App || {};

App.UIParametri = {
  // Le altre schede delle impostazioni non si ridisegnano: ciò che vi è scritto non si perde.
  disegna: function (c) { c.appendChild(this.crea()); },

  crea: function () {
    var U = App.Utils, UC = App.UIComune, self = this;
    var card = U.el('<div class="card"><h2>🧮 Parametri per pasto</h2>' +
      '<p class="aiuto"><b>I/C</b> = grammi di carboidrati coperti da 1 unità. ' +
      '<b>FSI</b> = di quanti mg/dL scende la glicemia con 1 unità. <b>Obiettivo</b> = glicemia a cui vuoi arrivare.</p>' +
      '<div id="par-pasti"></div>' +
      '<button class="btn btn-verde btn-pieno" style="margin-top:10px" data-az="salva">💾 Salva parametri</button>' +
      '<details style="margin-top:12px"><summary class="tenue" style="cursor:pointer">📜 Storico delle modifiche</summary><div id="par-storico"></div></details>' +
    '</div>');
    var box = card.querySelector('#par-pasti');

    App.Config.pasti.forEach(function (p, i) {
      var v = App.Parametri.di(p.id);
      var blocco = U.el('<div style="border-top:1px solid var(--bordo);padding-top:8px;margin-top:8px">' +
        '<div class="riga"><b class="cresce">' + p.icona + ' ' + p.nome + '</b>' +
        (i === 0 ? '<button class="btn btn-piccolo btn-neutro" data-az="copia">Copia a tutti ↓</button>' : '') + '</div>' +
        '<div class="griglia-3">' +
          '<div>' + UC.campo('par-' + p.id + '-ic', 'I/C', v.rapportoIC, 'g/U') + '</div>' +
          '<div>' + UC.campo('par-' + p.id + '-fsi', 'FSI', v.sensibilita, 'mg/dL') + '</div>' +
          '<div>' + UC.campo('par-' + p.id + '-obj', 'Obiettivo', v.obiettivo, 'mg/dL') + '</div>' +
        '</div></div>');
      box.appendChild(blocco);
    });

    var copia = card.querySelector('[data-az=copia]');
    copia.onclick = function () {
      var primo = App.Config.pasti[0].id;
      ['ic', 'fsi', 'obj'].forEach(function (k) {
        var val = card.querySelector('#par-' + primo + '-' + k).value;
        App.Config.pasti.forEach(function (p) { card.querySelector('#par-' + p.id + '-' + k).value = val; });
      });
      App.Avvisi.toast('Valori copiati: controlla e premi Salva.', 'info');
    };

    card.querySelector('[data-az=salva]').onclick = function () {
      var nuovi = {};
      App.Config.pasti.forEach(function (p) {
        nuovi[p.id] = {
          rapportoIC: UC.num(card, '#par-' + p.id + '-ic'),
          sensibilita: UC.num(card, '#par-' + p.id + '-fsi'),
          obiettivo: UC.num(card, '#par-' + p.id + '-obj')
        };
      });
      var e = App.Parametri.salva(nuovi);
      if (e) return UC.errore(card, null, e);
      App.Avvisi.toast('Parametri salvati', 'ok');
      card.replaceWith(self.crea());
    };

    // Storico
    var st = card.querySelector('#par-storico');
    var storico = App.Stato.imp().storicoParametri.slice().reverse();
    if (!storico.length) st.innerHTML = '<p class="tenue">Nessuna modifica registrata.</p>';
    var fmt = function (x) {
      return 'I/C ' + (x.rapportoIC == null ? '–' : U.dec(x.rapportoIC)) + ' · FSI ' + (x.sensibilita == null ? '–' : U.dec(x.sensibilita)) +
        ' · Ob. ' + (x.obiettivo == null ? '–' : x.obiettivo);
    };
    storico.slice(0, 40).forEach(function (s) {
      var d = new Date(s.quando);
      var html = '<div style="padding:6px 0;border-bottom:1px dashed var(--bordo)"><b>' + U.formattaData(U.dataISO(d), true) + ' ' +
        U.esc(d.toTimeString().slice(0, 5)) + '</b>' +
        s.cambi.map(function (cm) {
          return '<div class="aiuto">' + App.UIComune.nomePasto(cm.pasto) + ': ' + fmt(cm.prima) + ' → <b>' + fmt(cm.dopo) + '</b></div>';
        }).join('') + '</div>';
      st.appendChild(U.el(html));
    });
    return card;
  }
};
