/* ============================================================
   servizi/alimenti.js
   Archivio cibi: unisce il catalogo iniziale (js/catalogo/) con
   i cibi personali e le correzioni salvate dall'utente.
   Un cibo del catalogo corretto dall'utente viene salvato tra i
   personali con lo stesso id e prende il posto dell'originale.
   Dipende da: App.Config, App.Catalogo, App.Stato, App.Sicurezza, App.Utils.
   Usato da: ui/ui-archivio.js, ui/ui-pasto-cibi.js, ui/ui-scanner.js,
             servizi/voce-testo.js, servizi/modelli.js.
   ============================================================ */
window.App = window.App || {};

App.Alimenti = {
  _cacheCatalogo: null,

  // Catalogo in forma di oggetti (calcolato una volta sola).
  catalogo: function () {
    if (this._cacheCatalogo) return this._cacheCatalogo;
    var out = [];
    var C = App.Catalogo || {};
    App.Config.categorie.forEach(function (cat) {
      (C[cat.id] || []).forEach(function (r) {
        out.push({ id: 'cat:' + App.Utils.normalizza(r[0]).replace(/ /g, '-'), nome: r[0], categoria: cat.id,
          carb: r[1], prot: r[2], grassi: r[3], fonte: 'Catalogo' });
      });
    });
    this._cacheCatalogo = out;
    return out;
  },

  ordineCategoria: function (id) {
    var i = App.Config.categorie.map(function (c) { return c.id; }).indexOf(id);
    return i < 0 ? 99 : i;
  },

  // Tutti i cibi visibili, ordinati per categoria (primi per primi) e nome.
  tutti: function () {
    var personali = App.Stato.dati.alimenti;
    var perId = {};
    personali.forEach(function (a) { perId[a.id] = a; });
    var lista = this.catalogo().filter(function (a) { return !perId[a.id]; }).concat(personali)
      .filter(function (a) { return !a.nascosto; });
    var self = this;
    return lista.sort(function (a, b) {
      return self.ordineCategoria(a.categoria) - self.ordineCategoria(b.categoria) || a.nome.localeCompare(b.nome, 'it');
    });
  },

  trova: function (id) {
    var p = App.Stato.dati.alimenti.filter(function (a) { return a.id === id; })[0];
    if (p) return p.nascosto ? null : p;
    return this.catalogo().filter(function (a) { return a.id === id; })[0] || null;
  },

  perCodice: function (codice) {
    return this.tutti().filter(function (a) { return a.codice && a.codice === codice; })[0] || null;
  },

  /* Ricerca per testo. Punteggio: parola intera > inizio parola > contenuto;
     a parità vale l'ordine delle categorie (primi per primi). */
  cerca: function (testo, categoria) {
    var U = App.Utils, self = this;
    var q = U.normalizza(testo);
    var lista = this.tutti().filter(function (a) { return !categoria || a.categoria === categoria; });
    if (!q) return lista;
    var parole = q.split(' ');
    return lista.map(function (a) {
      var n = ' ' + U.normalizza(a.nome) + ' ';
      var punti = 0;
      for (var i = 0; i < parole.length; i++) {
        var w = parole[i];
        if (n.indexOf(' ' + w + ' ') >= 0) punti += 3;
        else if (n.indexOf(' ' + w) >= 0) punti += 2;
        else if (w.length > 2 && n.indexOf(w.slice(0, -1)) >= 0) punti += 1; // pasta/paste, mela/mele
        else return null;
      }
      if (n.indexOf(' ' + q) === 0) punti += 2;
      return { a: a, punti: punti };
    }).filter(Boolean).sort(function (x, y) {
      return y.punti - x.punti || self.ordineCategoria(x.a.categoria) - self.ordineCategoria(y.a.categoria) ||
        x.a.nome.length - y.a.nome.length;
    }).map(function (x) { return x.a; });
  },

  // Cibi usati negli ultimi giorni, dal più frequente.
  recenti: function (giorni, max) {
    var U = App.Utils, conta = {};
    for (var n = 0; n < (giorni || 14); n++) {
      var g = App.Stato.giorno(U.aggiungiGiorni(U.oggi(), -n));
      if (!g) continue;
      Object.keys(g.pasti).forEach(function (pid) {
        (g.pasti[pid].voci || []).forEach(function (v) { conta[v.alimentoId] = (conta[v.alimentoId] || 0) + 1; });
      });
    }
    var self = this;
    return Object.keys(conta).sort(function (a, b) { return conta[b] - conta[a]; })
      .map(function (id) { return self.trova(id); }).filter(Boolean).slice(0, max || 12);
  },

  valida: function (a) {
    if (!a.nome || !String(a.nome).trim()) return 'Scrivi il nome del cibo.';
    if (!App.Config.categorie.some(function (c) { return c.id === a.categoria; })) return 'Scegli la categoria.';
    return App.Sicurezza.macro(a.carb, a.prot, a.grassi);
  },

  // Salva un cibo nuovo o corretto. Restituisce { errore } oppure { alimento }.
  salva: function (dati) {
    var e = this.valida(dati);
    if (e) return { errore: e };
    var lista = App.Stato.dati.alimenti;
    var a = {
      id: dati.id || ('pers:' + App.Utils.id()),
      nome: String(dati.nome).trim(), categoria: dati.categoria,
      carb: dati.carb, prot: dati.prot, grassi: dati.grassi,
      fonte: dati.fonte || 'Personale', codice: dati.codice || ''
    };
    if (a.id.indexOf('cat:') === 0 && a.fonte === 'Catalogo') a.fonte = 'Catalogo, modificato';
    var i = lista.map(function (x) { return x.id; }).indexOf(a.id);
    if (i >= 0) lista[i] = a; else lista.push(a);
    App.Stato.salva('alimenti');
    return { alimento: a };
  },

  // I cibi personali si cancellano; quelli del catalogo si nascondono.
  // Il diario non cambia: ogni pasto conserva una copia dei valori.
  elimina: function (id) {
    var lista = App.Stato.dati.alimenti;
    var i = lista.map(function (x) { return x.id; }).indexOf(id);
    if (id.indexOf('cat:') === 0) {
      var orig = this.catalogo().filter(function (a) { return a.id === id; })[0];
      var nasc = Object.assign({}, orig, { nascosto: true });
      if (i >= 0) lista[i] = nasc; else lista.push(nasc);
    } else if (i >= 0) {
      lista.splice(i, 1);
    }
    App.Stato.salva('alimenti');
  },

  // Rimette il valore originale del catalogo.
  ripristina: function (id) {
    App.Stato.dati.alimenti = App.Stato.dati.alimenti.filter(function (a) { return a.id !== id; });
    App.Stato.salva('alimenti');
  },

  nomeCategoria: function (id) {
    var c = App.Config.categorie.filter(function (x) { return x.id === id; })[0];
    return c ? c.icona + ' ' + c.nome : id;
  }
};
