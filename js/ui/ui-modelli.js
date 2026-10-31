/* ============================================================
   ui/ui-modelli.js
   Modelli di pasto: elenco, creazione e modifica (nome, pasto
   abituale, cibi con i grammi).
   Dipende da: App.Modelli, App.Nutrienti, App.UIPastoCibi, App.UIComune,
               App.Config, App.Avvisi, App.Nav, App.Utils.
   Usato da: ui/ui-archivio.js.
   ============================================================ */
window.App = window.App || {};

App.UIModelli = {
  disegna: function (box) {
    var U = App.Utils, self = this;
    var nuovo = U.el('<button class="btn btn-verde btn-pieno">＋ Nuovo modello</button>');
    nuovo.onclick = function () { self.modifica(null); };
    box.appendChild(nuovo);
    var card = U.el('<div class="card" style="margin-top:10px"><ul class="elenco"></ul></div>');
    var ul = card.querySelector('ul');
    var modelli = App.Modelli.tutti();
    if (!modelli.length) ul.appendChild(U.el('<li class="tenue">Nessun modello. Un modello è un pasto tipo (es. "Colazione scuola") da caricare con un tocco.</li>'));
    modelli.forEach(function (m) {
      var li = U.el('<li class="card-cliccabile"><div class="nome"><b>' + U.esc(m.nome) + '</b>' +
        (m.pastoId ? ' <small style="display:inline">' + App.UIComune.iconaPasto(m.pastoId) + '</small>' : '') +
        '<small>' + U.esc(m.voci.map(function (v) { return v.nome + ' ' + v.grammi + ' g'; }).join(', ')) + '</small></div>' +
        '<span class="chip">' + U.dec(App.Modelli.carboidrati(m), 0) + ' g CHO</span>' +
        '<button class="btn-icona rosso" aria-label="Elimina">🗑️</button></li>');
      li.onclick = function (e) { if (e.target.closest('button')) return; self.modifica(m); };
      li.querySelector('button').onclick = function () {
        App.Avvisi.conferma({ titolo: 'Elimina modello', testo: 'Vuoi eliminare il modello "' + m.nome + '"?', ok: 'Elimina', pericolo: true })
          .then(function (si) { if (si) { App.Modelli.elimina(m.id); App.Nav.disegna(); } });
      };
      ul.appendChild(li);
    });
    box.appendChild(card);
  },

  modifica: function (m) {
    var U = App.Utils, UC = App.UIComune;
    var voci = m ? App.Modelli.vociDa(m).voci : [];
    var pasti = '<option value="">— qualsiasi —</option>' + App.Config.pasti.map(function (p) {
      return '<option value="' + p.id + '"' + (m && m.pastoId === p.id ? ' selected' : '') + '>' + p.icona + ' ' + p.nome + '</option>';
    }).join('');
    var corpo = U.el('<div>' +
      '<label for="m-nome">Nome del modello</label><input id="m-nome" value="' + U.esc(m ? m.nome : '') + '" placeholder="es. Colazione scuola">' +
      '<label for="m-pasto">Pasto abituale</label><select id="m-pasto">' + pasti + '</select>' +
      '<div class="sezione"><h2>Cibi</h2><button class="btn btn-piccolo" data-az="agg">🔍 Aggiungi</button></div>' +
      '<div class="card"><ul class="elenco" id="m-voci"></ul></div>' +
      '<p class="centro forte" id="m-tot"></p>' +
    '</div>');
    var disegnaVoci = function () {
      var ul = corpo.querySelector('#m-voci');
      ul.innerHTML = '';
      if (!voci.length) ul.appendChild(U.el('<li class="tenue">Aggiungi i cibi del modello.</li>'));
      voci.forEach(function (v, i) {
        var li = U.el('<li><div class="nome">' + U.esc(v.nome) + '<small>' + U.dec(v.carb) + ' g CHO</small></div>' +
          '<input class="voce-grammi" inputmode="decimal" value="' + U.dec(v.grammi, 1) + '"><span class="tenue">g</span>' +
          '<button class="btn-icona rosso">✕</button></li>');
        var inp = li.querySelector('input');
        inp.onchange = function () {
          var g = U.numero(inp.value), e = App.Sicurezza.grammi(g);
          if (e) { UC.errore(li, 'input', e); inp.value = U.dec(v.grammi, 1); return; }
          App.Nutrienti.aggiornaGrammi(v, g); disegnaVoci();
        };
        li.querySelector('button').onclick = function () { voci.splice(i, 1); disegnaVoci(); };
        ul.appendChild(li);
      });
      corpo.querySelector('#m-tot').textContent = 'Totale: ' + U.dec(App.Nutrienti.totali(voci).carb) + ' g di carboidrati';
    };
    corpo.querySelector('[data-az=agg]').onclick = function () {
      App.UIPastoCibi.cerca(function (nuove) { voci = voci.concat(nuove); disegnaVoci(); });
    };
    App.Avvisi.finestra({ titolo: m ? 'Modifica modello' : 'Nuovo modello', icona: '📋', contenuto: corpo,
      pulsanti: [
        { testo: 'Annulla', classe: 'btn-neutro' },
        { testo: '💾 Salva', classe: 'btn-verde', azione: function (f) {
          var r = App.Modelli.salva({ id: m && m.id, nome: UC.testo(corpo, '#m-nome'), pastoId: corpo.querySelector('#m-pasto').value, voci: voci });
          if (r.errore) { UC.errore(f.corpo, null, r.errore); return false; }
          App.Avvisi.toast('Modello salvato', 'ok');
          App.Nav.disegna();
        } }
      ] });
    disegnaVoci();
  }
};
