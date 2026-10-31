/* ============================================================
   ui/navigazione.js
   Testata, barra di navigazione in basso e disegno della scheda
   attiva. Il piè di pagina mostra la versione.
   Dipende da: App.Config, App.Stato, App.UIGiorno, App.UIArchivio,
               App.UIStatistiche, App.UIImpostazioni.
   Usato da: avvio.js e da chi deve ridisegnare la pagina.
   ============================================================ */
window.App = window.App || {};

App.Nav = {
  SCHEDE: [
    { id: 'oggi',         nome: 'Diario',       icona: '📅', modulo: 'UIGiorno' },
    { id: 'archivio',     nome: 'Archivio',     icona: '🥫', modulo: 'UIArchivio' },
    { id: 'statistiche',  nome: 'Statistiche',  icona: '📊', modulo: 'UIStatistiche' },
    { id: 'impostazioni', nome: 'Impostazioni', icona: '⚙️', modulo: 'UIImpostazioni' }
  ],

  // Prepara la struttura fissa della pagina (una volta sola).
  prepara: function () {
    var app = document.getElementById('app');
    app.innerHTML =
      '<header class="testata"><img class="logo" src="icone/logo-192.png" alt=""><h1>' + App.Utils.esc(App.Config.nome) + '</h1></header>' +
      '<nav class="barra-nav" aria-label="Schede"></nav>' +
      '<main id="contenuto"></main>';
    var nav = app.querySelector('.barra-nav');
    var self = this;
    this.SCHEDE.forEach(function (s) {
      var b = App.Utils.el('<button data-scheda="' + s.id + '"><span class="ico">' + s.icona + '</span>' + s.nome + '</button>');
      b.addEventListener('click', function () { self.vai(s.id); });
      nav.appendChild(b);
    });
  },

  vai: function (id) {
    App.Stato.scheda = id;
    window.scrollTo(0, 0);
    this.disegna();
  },

  // Ridisegna la scheda attiva.
  disegna: function () {
    var id = App.Stato.scheda;
    document.querySelectorAll('.barra-nav button').forEach(function (b) {
      b.classList.toggle('attivo', b.getAttribute('data-scheda') === id);
    });
    var s = this.SCHEDE.filter(function (x) { return x.id === id; })[0] || this.SCHEDE[0];
    var c = document.getElementById('contenuto');
    c.innerHTML = '';
    App[s.modulo].disegna(c);
    c.appendChild(App.Utils.el('<div class="piede">' + App.Utils.esc(App.Config.nome) + ' · v' + App.Config.versione +
      ' · dati salvati solo su questo dispositivo</div>'));
  }
};
