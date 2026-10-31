/* ============================================================
   ui/ui-attivita-umori.js
   Nelle impostazioni: elenco delle attività (solo i nomi).
   Dalla v1.1 l'intensità si sceglie quando registri l'attività
   nel diario, e gli stati d'animo sono fissi in config.js:
   nessuno dei due cambia la dose.
   (Il nome del file è rimasto quello della v1.0.)
   Dipende da: App.Stato, App.UIComune, App.Avvisi, App.Utils.
   Usato da: ui/ui-impostazioni.js.
   ============================================================ */
window.App = window.App || {};

App.UIAttivitaUmori = {
  disegna: function (c) {
    var U = App.Utils, UC = App.UIComune, imp = App.Stato.imp();
    var card = U.el('<div class="card"><h2>🏃 Le tue attività</h2>' +
      '<p class="aiuto">Le attività che puoi registrare nel diario, con l\'intensità (bassa, media, alta). Non cambiano la dose: ' +
      'servono a vedere nelle statistiche come vanno le glicemie nei giorni in cui le fai.</p>' +
      '<div id="au-att"></div>' +
      '<button class="btn btn-piccolo btn-contorno" data-az="nuova" style="margin-top:8px">＋ Nuova attività</button>' +
      '<button class="btn btn-verde btn-pieno" style="margin-top:12px" data-az="salva">💾 Salva attività</button></div>');

    var attivita = U.clona(imp.attivita);
    var boxA = card.querySelector('#au-att');
    var disegnaAtt = function () {
      boxA.innerHTML = '';
      attivita.forEach(function (a, i) {
        var r = U.el('<div class="riga" style="border-top:1px solid var(--bordo);padding:8px 0">' +
          '<span style="font-size:1.4rem">' + a.icona + '</span>' +
          '<input class="cresce" data-k="nome" value="' + U.esc(a.nome) + '" aria-label="Nome attività">' +
          '<button class="btn-icona rosso" aria-label="Elimina">🗑️</button></div>');
        r.querySelector('[data-k=nome]').oninput = function (e) { a.nome = e.target.value; };
        r.querySelector('button').onclick = function () { attivita.splice(i, 1); disegnaAtt(); };
        boxA.appendChild(r);
      });
    };
    disegnaAtt();
    card.querySelector('[data-az=nuova]').onclick = function () {
      attivita.push({ id: 'att-' + U.id(), nome: '', icona: '🏃' });
      disegnaAtt();
      var campi = boxA.querySelectorAll('[data-k=nome]');
      campi[campi.length - 1].focus();
    };

    card.querySelector('[data-az=salva]').onclick = function () {
      for (var i = 0; i < attivita.length; i++) {
        if (!attivita[i].nome.trim()) return UC.errore(card, null, 'Ogni attività deve avere un nome.');
      }
      attivita.forEach(function (a) { a.nome = a.nome.trim(); });
      imp.attivita = attivita;
      App.Stato.salva('impostazioni');
      App.Avvisi.toast('Attività salvate', 'ok');
    };
    c.appendChild(card);
  }
};
