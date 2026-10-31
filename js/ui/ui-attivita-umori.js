/* ============================================================
   ui/ui-attivita-umori.js
   Nelle impostazioni: elenco delle attività (nome, intensità,
   % di correzione) e degli stati d'animo (% di correzione).
   % negativa = meno insulina, positiva = più insulina, vuota = nessun effetto.
   Dipende da: App.Stato, App.Sicurezza, App.Config, App.UIComune,
               App.Avvisi, App.Nav, App.Utils.
   Usato da: ui/ui-impostazioni.js.
   ============================================================ */
window.App = window.App || {};

App.UIAttivitaUmori = {
  disegna: function (c) {
    var U = App.Utils, UC = App.UIComune, imp = App.Stato.imp();
    var card = U.el('<div class="card"><h2>🏃 Attività e 😌 stati d\'animo</h2>' +
      '<p class="aiuto">La % si applica alla dose quando nel pasto spunti l\'attività o scegli lo stato d\'animo. ' +
      'Negativa = meno insulina (es. −30), positiva = più insulina (es. +10). Vuota = nessun effetto sulla dose. ' +
      'Ricorda che alcune attività, come i pesi, possono alzare la glicemia nell\'immediato.</p>' +
      '<div id="au-att"></div>' +
      '<button class="btn btn-piccolo btn-contorno" data-az="nuova" style="margin-top:8px">＋ Nuova attività</button>' +
      '<h3 style="margin-top:16px">Stati d\'animo</h3><div id="au-umori"></div>' +
      '<button class="btn btn-verde btn-pieno" style="margin-top:12px" data-az="salva">💾 Salva attività e stati d\'animo</button></div>');

    var attivita = U.clona(imp.attivita);
    var boxA = card.querySelector('#au-att');
    var disegnaAtt = function () {
      boxA.innerHTML = '';
      attivita.forEach(function (a, i) {
        var int = '<option value="">intensità</option>' + App.Config.intensita.map(function (x) {
          return '<option' + (a.intensita === x ? ' selected' : '') + '>' + x + '</option>';
        }).join('');
        var r = U.el('<div style="border-top:1px solid var(--bordo);padding:8px 0">' +
          '<div class="riga"><span style="font-size:1.4rem">' + a.icona + '</span>' +
          '<input class="cresce" data-k="nome" value="' + U.esc(a.nome) + '" aria-label="Nome attività">' +
          '<button class="btn-icona rosso" aria-label="Elimina">🗑️</button></div>' +
          '<div class="griglia-2" style="margin-top:6px"><select data-k="int">' + int + '</select>' +
          '<div class="campo-unita"><input data-k="pct" inputmode="decimal" placeholder="nessuna" value="' + (a.correzionePct == null ? '' : a.correzionePct) + '"><span>%</span></div></div></div>');
        r.querySelector('[data-k=nome]').oninput = function (e) { a.nome = e.target.value; };
        r.querySelector('[data-k=int]').onchange = function (e) { a.intensita = e.target.value; };
        r.querySelector('[data-k=pct]').oninput = function (e) { a.correzionePct = U.numero(e.target.value.replace('+', '')); };
        r.querySelector('button').onclick = function () { attivita.splice(i, 1); disegnaAtt(); };
        boxA.appendChild(r);
      });
    };
    disegnaAtt();
    card.querySelector('[data-az=nuova]').onclick = function () {
      attivita.push({ id: 'att-' + U.id(), nome: '', icona: '🏃', intensita: '', correzionePct: null });
      disegnaAtt();
      var campi = boxA.querySelectorAll('[data-k=nome]');
      campi[campi.length - 1].focus();
    };

    var umori = U.clona(imp.umori);
    var boxU = card.querySelector('#au-umori');
    umori.forEach(function (u) {
      var r = U.el('<div class="riga" style="padding:4px 0"><span class="cresce">' + u.icona + ' ' + U.esc(u.nome) + '</span>' +
        '<div class="campo-unita" style="width:120px"><input inputmode="decimal" placeholder="–" value="' + (u.correzionePct == null ? '' : u.correzionePct) + '"><span>%</span></div></div>');
      r.querySelector('input').oninput = function (e) { u.correzionePct = U.numero(e.target.value.replace('+', '')); };
      boxU.appendChild(r);
    });

    card.querySelector('[data-az=salva]').onclick = function () {
      for (var i = 0; i < attivita.length; i++) {
        if (!attivita[i].nome.trim()) return UC.errore(card, null, 'Ogni attività deve avere un nome.');
        var e = App.Sicurezza.correzione(attivita[i].correzionePct);
        if (e) return UC.errore(card, null, attivita[i].nome + ' – ' + e);
      }
      for (var j = 0; j < umori.length; j++) {
        var e2 = App.Sicurezza.correzione(umori[j].correzionePct);
        if (e2) return UC.errore(card, null, umori[j].nome + ' – ' + e2);
      }
      attivita.forEach(function (a) { a.nome = a.nome.trim(); });
      imp.attivita = attivita; imp.umori = umori;
      App.Stato.salva('impostazioni');
      App.Avvisi.toast('Attività e stati d\'animo salvati', 'ok');
    };
    c.appendChild(card);
  }
};
