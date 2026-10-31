/* ============================================================
   core/avvisi.js — core 1.0
   Avvisi (toast) e finestre dell'app al posto di alert/confirm.
   Le finestre si possono sovrapporre (es. conferma sopra al pasto).
   Dipende da: App.Utils.
   Usato da: tutti i moduli ui/, dati/backup.js, stampa/.
   ============================================================ */
window.App = window.App || {};

App.Avvisi = {
  ICONE: { ok: '✅', errore: '⛔', avviso: '⚠️', info: 'ℹ️' },

  // tipo: 'ok' | 'errore' | 'avviso' | 'info'
  toast: function (testo, tipo, durata) {
    tipo = tipo || 'info';
    var box = document.getElementById('toast-box');
    if (!box) { box = document.createElement('div'); box.id = 'toast-box'; document.body.appendChild(box); }
    var t = document.createElement('div');
    t.className = 'toast toast-' + tipo;
    t.setAttribute('role', 'status');
    t.innerHTML = '<span class="toast-icona">' + this.ICONE[tipo] + '</span><span>' + App.Utils.esc(testo) + '</span>';
    box.appendChild(t);
    setTimeout(function () { t.classList.add('esce'); }, durata || 3800);
    setTimeout(function () { t.remove(); }, (durata || 3800) + 400);
  },

  /* Apre una finestra.
     opz: { titolo, icona, contenuto (HTML o elemento), pulsanti: [{testo, classe, azione}],
            classe, chiudibile (default true), allaChiusura }
     azione(f) riceve la finestra; se restituisce false la finestra resta aperta. */
  finestra: function (opz) {
    var U = App.Utils;
    var sfondo = U.el('<div class="finestra-sfondo"></div>');
    var f = U.el(
      '<div class="finestra ' + (opz.classe || '') + '" role="dialog" aria-modal="true">' +
        '<div class="finestra-testa"><h2>' + (opz.icona ? '<span>' + opz.icona + '</span> ' : '') + U.esc(opz.titolo || '') + '</h2>' +
        (opz.chiudibile === false ? '' : '<button class="btn-icona chiudi" aria-label="Chiudi">✕</button>') + '</div>' +
        '<div class="finestra-corpo"></div>' +
        '<div class="finestra-piede"></div>' +
      '</div>');
    var corpo = f.querySelector('.finestra-corpo');
    if (typeof opz.contenuto === 'string') corpo.innerHTML = opz.contenuto;
    else if (opz.contenuto) corpo.appendChild(opz.contenuto);
    var piede = f.querySelector('.finestra-piede');
    var api = {
      el: f, corpo: corpo,
      chiudi: function () {
        sfondo.remove();
        if (!document.querySelector('.finestra-sfondo')) document.body.classList.remove('bloccato');
        if (opz.allaChiusura) opz.allaChiusura();
      }
    };
    (opz.pulsanti || []).forEach(function (p) {
      var b = U.el('<button class="btn ' + (p.classe || '') + '">' + p.testo + '</button>');
      b.addEventListener('click', function () {
        var r = p.azione ? p.azione(api) : true;
        if (r !== false) api.chiudi();
      });
      piede.appendChild(b);
    });
    if (!piede.children.length) piede.remove();
    var x = f.querySelector('.chiudi');
    if (x) x.addEventListener('click', api.chiudi);
    sfondo.appendChild(f);
    document.body.appendChild(sfondo);
    document.body.classList.add('bloccato');
    return api;
  },

  /* Conferma: restituisce una Promise<boolean>.
     opz: { titolo, testo, icona, ok, annulla, pericolo (pulsante rosso) } */
  conferma: function (opz) {
    var self = this;
    return new Promise(function (risolvi) {
      var risposto = false;
      self.finestra({
        titolo: opz.titolo || 'Conferma',
        icona: opz.icona || (opz.pericolo ? '⚠️' : '❓'),
        classe: 'piccola',
        contenuto: '<p>' + App.Utils.esc(opz.testo || '').replace(/\n/g, '<br>') + '</p>',
        pulsanti: [
          { testo: opz.annulla || 'Annulla', classe: 'btn-neutro', azione: function () { risposto = true; risolvi(false); } },
          { testo: opz.ok || 'Conferma', classe: opz.pericolo ? 'btn-rosso' : 'btn-verde', azione: function () { risposto = true; risolvi(true); } }
        ],
        allaChiusura: function () { if (!risposto) risolvi(false); }
      });
    });
  }
};
