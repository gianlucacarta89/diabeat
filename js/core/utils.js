/* ============================================================
   core/utils.js — core 1.0
   Funzioni di servizio: date, numeri, testo, download.
   Dipende da: nulla.
   Usato da: tutti i moduli.
   ============================================================ */
window.App = window.App || {};

App.Utils = {
  // Protegge il testo prima di metterlo nella pagina (MAI nei PDF).
  esc: function (t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  id: function () {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  // --- Date -------------------------------------------------
  dataISO: function (d) {
    d = d || new Date();
    var m = d.getMonth() + 1, g = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (g < 10 ? '0' : '') + g;
  },
  oggi: function () { return App.Utils.dataISO(new Date()); },
  daISO: function (iso) {
    var p = iso.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  },
  aggiungiGiorni: function (iso, n) {
    var d = App.Utils.daISO(iso);
    d.setDate(d.getDate() + n);
    return App.Utils.dataISO(d);
  },
  formattaData: function (iso, breve) {
    var d = App.Utils.daISO(iso);
    var giorni = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
    var mesi = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
    var t = d.getDate() + ' ' + mesi[d.getMonth()];
    return breve ? t : giorni[d.getDay()] + ' ' + t + ' ' + d.getFullYear();
  },
  oraAdesso: function () {
    var d = new Date(), h = d.getHours(), m = d.getMinutes();
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  },
  // Millisecondi da data ISO + ora "HH:MM".
  momento: function (iso, ora) {
    var d = App.Utils.daISO(iso);
    var p = String(ora || '00:00').split(':');
    d.setHours(+p[0] || 0, +p[1] || 0, 0, 0);
    return d.getTime();
  },
  oraValida: function (ora) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(ora || '')); },

  // --- Numeri ------------------------------------------------
  // Accetta la virgola. Restituisce null se il campo è vuoto o non è un numero.
  numero: function (v) {
    if (v == null) return null;
    var s = String(v).trim().replace(',', '.');
    if (s === '') return null;
    var n = Number(s);
    return isFinite(n) ? n : null;
  },
  arrotonda: function (x, passo) {
    passo = passo || 1;
    return Math.round(x / passo) * passo;
  },
  dec: function (x, cifre) {
    if (x == null || !isFinite(x)) return '–';
    var f = Math.pow(10, cifre == null ? 1 : cifre);
    return String(Math.round(x * f) / f).replace('.', ',');
  },

  // --- Testo -------------------------------------------------
  normalizza: function (t) {
    return String(t || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  },

  clona: function (o) { return JSON.parse(JSON.stringify(o)); },

  // --- Download ----------------------------------------------
  scarica: function (nomeFile, contenuto, tipo) {
    var blob = new Blob([contenuto], { type: tipo || 'application/octet-stream' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = nomeFile;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  },

  // Crea un elemento da una stringa HTML.
  el: function (html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
};
