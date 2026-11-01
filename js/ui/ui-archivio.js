/* ============================================================
   ui/ui-archivio.js
   Scheda "Archivio": cibi (ricerca, nuovo, scansione,
   modifica, eliminazione) e modelli di pasto.
   Dipende da: App.Alimenti, App.Config, App.Stato, App.UIAlimentoForm,
               App.UIScanner, App.UIModelli, App.UIPastoCibi, App.Avvisi,
               App.Nav, App.Utils.
   Usato da: ui/navigazione.js.
   ============================================================ */
window.App = window.App || {};

App.UIArchivio = {
  vista: 'cibi',
  testo: '',

  disegna: function (c) {
    var U = App.Utils, self = this;
    var schede = U.el('<div class="schede"><button data-v="cibi">🥫 Cibi</button><button data-v="modelli">📋 Modelli di pasto</button></div>');
    schede.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('attivo', b.getAttribute('data-v') === self.vista);
      b.onclick = function () { self.vista = b.getAttribute('data-v'); App.Nav.disegna(); };
    });
    c.appendChild(schede);
    var box = U.el('<div></div>');
    c.appendChild(box);
    if (this.vista === 'modelli') App.UIModelli.disegna(box);
    else this.disegnaCibi(box);
  },

  disegnaCibi: function (box) {
    var U = App.Utils, self = this;
    var testa = U.el('<div>' +
      '<div class="griglia-2"><button class="btn btn-verde" data-az="nuovo">＋ Nuovo cibo</button>' +
      '<button class="btn" data-az="scan">📷 Codice a barre</button></div>' +
      '<input type="search" id="a-testo" placeholder="Cerca nell\'archivio" style="margin-top:10px" value="' + U.esc(this.testo) + '">' +
      '<p class="tenue" id="a-conta" style="margin:6px 0;font-size:.85rem"></p>' +
    '</div>');
    box.appendChild(testa);
    var lista = U.el('<div class="card"><ul class="elenco"></ul></div>');
    box.appendChild(lista);
    box.appendChild(U.el('<div class="riquadro riquadro-info">ℹ️ ' + U.esc(App.Config.testi.avvisoCatalogo) + '</div>'));
    var nascosti = App.Stato.dati.alimenti.filter(function (a) { return a.nascosto; });
    if (nascosti.length) {
      var r = U.el('<div class="centro"><button class="btn btn-piccolo btn-neutro">↺ Rimetti i ' + nascosti.length + ' cibi del catalogo eliminati</button></div>');
      r.querySelector('button').onclick = function () {
        nascosti.forEach(function (a) { App.Alimenti.ripristina(a.id); });
        App.Avvisi.toast('Cibi rimessi in archivio', 'ok'); App.Nav.disegna();
      };
      box.appendChild(r);
    }

    var disegnaLista = function () {
      var ul = lista.querySelector('ul');
      ul.innerHTML = '';
      var elementi = App.Alimenti.cerca(self.testo);
      testa.querySelector('#a-conta').textContent = elementi.length + (elementi.length === 1 ? ' cibo' : ' cibi');
      elementi.slice(0, 300).forEach(function (a) {
        var modificato = a.id.indexOf('cat:') === 0 && /modificato/.test(a.fonte || '');
        var li = U.el('<li>' + App.UIPastoCibi.rigaAlimento(a).replace('</small></div>',
          (a.fonte && a.fonte !== 'Catalogo' ? ' · ' + U.esc(a.fonte) : '') + '</small></div>') +
          (modificato ? '<button class="btn-icona" data-az="rip" aria-label="Valori originali" title="Valori originali">↺</button>' : '') +
          '<button class="btn-icona" data-az="mod" aria-label="Modifica">✏️</button>' +
          '<button class="btn-icona rosso" data-az="del" aria-label="Elimina">🗑️</button></li>');
        li.querySelector('[data-az=mod]').onclick = function () { App.UIAlimentoForm.apri(a, function () { App.Nav.disegna(); }); };
        li.querySelector('[data-az=del]').onclick = function () {
          App.Avvisi.conferma({ titolo: 'Elimina cibo', ok: 'Elimina', pericolo: true,
            testo: 'Vuoi eliminare "' + a.nome + '" dall\'archivio?\nI pasti già salvati non cambiano.' })
            .then(function (si) { if (si) { App.Alimenti.elimina(a.id); App.Avvisi.toast('Cibo eliminato', 'ok'); App.Nav.disegna(); } });
        };
        var rip = li.querySelector('[data-az=rip]');
        if (rip) rip.onclick = function () {
          App.Avvisi.conferma({ titolo: 'Valori originali', ok: 'Ripristina', testo: 'Rimettere i valori originali del catalogo per "' + a.nome + '"?' })
            .then(function (si) { if (si) { App.Alimenti.ripristina(a.id); App.Nav.disegna(); } });
        };
        ul.appendChild(li);
      });
      if (!elementi.length) ul.appendChild(U.el('<li class="tenue">Nessun cibo trovato.</li>'));
    };

    testa.querySelector('#a-testo').addEventListener('input', function (e) { self.testo = e.target.value; disegnaLista(); });
    testa.querySelector('[data-az=nuovo]').onclick = function () {
      App.UIAlimentoForm.apri({ nome: self.testo }, function () { App.Nav.disegna(); });
    };
    testa.querySelector('[data-az=scan]').onclick = function () {
      App.UIScanner.apri(function (a) { self.testo = a.nome; App.Nav.disegna(); });
    };
    disegnaLista();
  }
};
