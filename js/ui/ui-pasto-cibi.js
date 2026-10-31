/* ============================================================
   ui/ui-pasto-cibi.js
   Scelta dei cibi: ricerca nell'archivio (con i cibi recenti),
   richiesta dei grammi, scelta di un modello di pasto.
   Dipende da: App.Alimenti, App.Modelli, App.Nutrienti, App.Sicurezza,
               App.UIComune, App.UIAlimentoForm, App.Avvisi, App.Config, App.Utils.
   Usato da: ui/ui-pasto.js, ui/ui-modelli.js.
   ============================================================ */
window.App = window.App || {};

App.UIPastoCibi = {
  // Riga di un cibo in un elenco.
  rigaAlimento: function (a) {
    var U = App.Utils;
    return '<div class="nome">' + U.esc(a.nome) + '<small>' + U.dec(a.carb) + ' g CHO · ' + U.dec(a.prot) + ' P · ' +
      U.dec(a.grassi) + ' G per 100 g</small></div>';
  },

  /* Ricerca con aggiunta multipla: la finestra resta aperta finché non premi "Fatto".
     callback(voci) riceve ogni cibo aggiunto, uno alla volta. */
  cerca: function (callback) {
    var U = App.Utils, self = this;
    var categoria = '';
    var aggiunti = 0;
    var corpo = U.el('<div>' +
      '<input id="c-testo" type="search" placeholder="Cerca un cibo (es. pasta, mela…)" autocomplete="off">' +
      '<div class="filtri" id="c-filtri" style="margin-top:8px"></div>' +
      '<div class="card"><ul class="elenco" id="c-elenco"></ul></div>' +
      '<button class="btn btn-contorno btn-pieno" data-az="nuovo">＋ Cibo nuovo in archivio</button>' +
    '</div>');
    var filtri = corpo.querySelector('#c-filtri');
    var cats = [{ id: '', nome: 'Tutti', icona: '' }].concat(App.Config.categorie);
    cats.forEach(function (c) {
      var chip = U.el('<span class="chip chip-scelta">' + c.icona + ' ' + c.nome + '</span>');
      chip.onclick = function () { categoria = c.id; disegna(); };
      chip.setAttribute('data-cat', c.id);
      filtri.appendChild(chip);
    });

    var scegli = function (a) {
      self.chiediGrammi(a, function (v) {
        callback([v]); aggiunti++;
        App.Avvisi.toast(a.nome + ' aggiunto (' + U.dec(v.grammi, 0) + ' g)', 'ok', 1800);
      });
    };

    var disegna = function () {
      filtri.querySelectorAll('.chip').forEach(function (ch) { ch.classList.toggle('scelto', ch.getAttribute('data-cat') === categoria); });
      var testo = corpo.querySelector('#c-testo').value;
      var ul = corpo.querySelector('#c-elenco');
      ul.innerHTML = '';
      var lista;
      if (!testo && !categoria) {
        lista = App.Alimenti.recenti(14, 12);
        ul.appendChild(U.el('<li class="tenue"><small>' + (lista.length ? 'Usati di recente' : 'Scrivi il nome o scegli una categoria') + '</small></li>'));
      } else {
        lista = App.Alimenti.cerca(testo, categoria).slice(0, 60);
        if (!lista.length) ul.appendChild(U.el('<li class="tenue">Nessun cibo trovato. Puoi aggiungerlo con il pulsante qui sotto.</li>'));
      }
      lista.forEach(function (a) {
        var li = U.el('<li class="card-cliccabile">' + self.rigaAlimento(a) + '<span class="chip">＋</span></li>');
        li.onclick = function () { scegli(a); };
        ul.appendChild(li);
      });
    };
    corpo.querySelector('#c-testo').addEventListener('input', disegna);
    corpo.querySelector('[data-az=nuovo]').onclick = function () {
      App.UIAlimentoForm.apri({ nome: corpo.querySelector('#c-testo').value }, function (a) { disegna(); scegli(a); });
    };

    App.Avvisi.finestra({ titolo: 'Aggiungi cibi', icona: '🔍', contenuto: corpo,
      pulsanti: [{ testo: '✓ Fatto', classe: 'btn-verde' }] });
    disegna();
    setTimeout(function () { corpo.querySelector('#c-testo').focus(); }, 150);
  },

  // Chiede i grammi di un cibo; callback(voce) se confermato.
  chiediGrammi: function (a, callback, grammiIniziali) {
    var U = App.Utils, UC = App.UIComune;
    var corpo = U.el('<div><p><b>' + U.esc(a.nome) + '</b></p><p class="tenue">' + U.dec(a.carb) + ' g carboidrati per 100 g</p>' +
      UC.campo('g-grammi', 'Quantità', grammiIniziali, 'g', { classe: 'grande' }) +
      '<div class="riga" style="margin-top:8px" id="g-rapidi"></div>' +
      '<p class="centro" id="g-carb" style="font-weight:700;color:var(--primario)"></p></div>');
    var inp = corpo.querySelector('#g-grammi');
    var aggiorna = function () {
      var g = U.numero(inp.value);
      corpo.querySelector('#g-carb').textContent = g ? '= ' + U.dec(App.Nutrienti.per(a, g).carb) + ' g di carboidrati' : '';
    };
    [30, 50, 80, 100, 150, 200].forEach(function (g) {
      var b = U.el('<span class="chip chip-scelta">' + g + ' g</span>');
      b.onclick = function () { inp.value = g; aggiorna(); };
      corpo.querySelector('#g-rapidi').appendChild(b);
    });
    inp.addEventListener('input', aggiorna);
    var conferma = function (f) {
      var g = U.numero(inp.value);
      var e = App.Sicurezza.grammi(g);
      if (e) { UC.errore(f.corpo, '#g-grammi', e); return false; }
      callback(App.Nutrienti.voce(a, g));
    };
    var fin = App.Avvisi.finestra({ titolo: 'Quanti grammi?', icona: '⚖️', classe: 'piccola', contenuto: corpo,
      pulsanti: [{ testo: 'Annulla', classe: 'btn-neutro' }, { testo: '＋ Aggiungi', classe: 'btn-verde', azione: conferma }] });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && conferma(fin) !== false) fin.chiudi(); });
    aggiorna();
    setTimeout(function () { inp.focus(); }, 150);
  },

  // Scelta di un modello di pasto; callback(voci).
  modello: function (pastoId, callback) {
    var U = App.Utils;
    var modelli = App.Modelli.tutti().sort(function (a, b) { return (b.pastoId === pastoId) - (a.pastoId === pastoId); });
    var corpo = U.el('<div><div class="card"><ul class="elenco"></ul></div></div>');
    var ul = corpo.querySelector('ul');
    if (!modelli.length) ul.appendChild(U.el('<li class="tenue">Nessun modello. Creali in Archivio → Modelli.</li>'));
    var fin;
    modelli.forEach(function (m) {
      var li = U.el('<li class="card-cliccabile"><div class="nome"><b>' + U.esc(m.nome) + '</b><small>' +
        U.esc(m.voci.map(function (v) { return v.nome + ' ' + v.grammi + ' g'; }).join(', ')) + '</small></div>' +
        '<span class="chip">' + U.dec(App.Modelli.carboidrati(m), 0) + ' g CHO</span></li>');
      li.onclick = function () {
        var r = App.Modelli.vociDa(m);
        if (r.mancanti.length) App.Avvisi.toast('Non più in archivio: ' + r.mancanti.join(', '), 'avviso', 5000);
        callback(r.voci);
        App.Avvisi.toast('Modello "' + m.nome + '" caricato: puoi ritoccare i grammi.', 'ok');
        fin.chiudi();
      };
      ul.appendChild(li);
    });
    fin = App.Avvisi.finestra({ titolo: 'Carica un modello', icona: '📋', contenuto: corpo, classe: 'piccola' });
  }
};
