/* ============================================================
   servizi/alimenti.js
   Archivio cibi: unisce il catalogo iniziale (js/catalogo/) con
   i cibi personali e le correzioni salvate dall'utente.
   Un cibo del catalogo corretto dall'utente viene salvato tra i
   personali con lo stesso id e prende il posto dell'originale.
   Dalla v1.4 i cibi non hanno categorie: un unico elenco.
   Ogni cibo può avere i pesi delle misure casalinghe (cucchiaio,
   tazza, piatto, numero/pezzo): vedi App.Config.unitaMisura.
   Dipende da: App.Config, App.Catalogo, App.Stato, App.Sicurezza, App.Utils.
   Usato da: ui/ui-archivio.js, ui/ui-pasto-cibi.js, ui/ui-scanner.js,
             servizi/voce-testo.js, servizi/modelli.js.
   ============================================================ */
window.App = window.App || {};

App.Alimenti = {
  _cacheCatalogo: null,
  CHIAVI_MISURE: ['cucchiaio', 'tazza', 'piatto', 'numero'],

  // Catalogo in forma di oggetti (calcolato una volta sola).
  catalogo: function () {
    if (this._cacheCatalogo) return this._cacheCatalogo;
    var out = [];
    var C = App.Catalogo || {};
    var misure = C.misure || {};
    // Ogni elenco del catalogo (i file sono divisi solo per comodità).
    Object.keys(C).forEach(function (k) {
      if (!Array.isArray(C[k])) return;
      C[k].forEach(function (r) {
        var m = misure[r[0]] || {};
        out.push({ id: 'cat:' + App.Utils.normalizza(r[0]).replace(/ /g, '-'), nome: r[0],
          carb: r[1], prot: r[2], grassi: r[3], fonte: 'Catalogo',
          misure: {
            cucchiaio: m.cucchiaio || null, tazza: m.tazza || null, piatto: m.piatto || null,
            numero: m.numero ? m.numero[0] : null,
            numeroNome: m.numero ? m.numero[1] : '', numeroPlurale: m.numero ? m.numero[2] : ''
          } });
      });
    });
    this._cacheCatalogo = out;
    return out;
  },

  // Tutti i cibi visibili, in ordine alfabetico.
  tutti: function () {
    var personali = App.Stato.dati.alimenti;
    var perId = {};
    personali.forEach(function (a) { perId[a.id] = a; });
    return this.catalogo().filter(function (a) { return !perId[a.id]; }).concat(personali)
      .filter(function (a) { return !a.nascosto; })
      .sort(function (a, b) { return a.nome.localeCompare(b.nome, 'it'); });
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
     a parità vince il nome più corto, poi l'ordine alfabetico. */
  cerca: function (testo) {
    var U = App.Utils;
    var q = U.normalizza(testo);
    var lista = this.tutti();
    if (!q) return lista;
    var parole = q.split(' ');
    // Forme singolari/plurali: uova → uovo, mele → mela, biscotti → biscotto.
    var varianti = function (w) {
      if (w.length < 4) return [w];
      var r = w.slice(0, -1);
      return [w, r + 'o', r + 'a', r + 'e', r + 'i'];
    };
    return lista.map(function (a) {
      var n = ' ' + U.normalizza(a.nome) + ' ';
      var punti = 0;
      for (var i = 0; i < parole.length; i++) {
        var v = varianti(parole[i]), w = parole[i];
        if (v.some(function (x) { return n.indexOf(' ' + x + ' ') >= 0; })) punti += 3;
        else if (v.some(function (x) { return n.indexOf(' ' + x) >= 0; })) punti += 2;
        else if (w.length > 2 && n.indexOf(w.slice(0, -1)) >= 0) punti += 1;
        else return null;
      }
      // Bonus se il nome del cibo comincia con la prima parola cercata.
      if (varianti(parole[0]).some(function (x) { return n.indexOf(' ' + x) === 0; })) punti += 2;
      return { a: a, punti: punti };
    }).filter(Boolean).sort(function (x, y) {
      return y.punti - x.punti || x.a.nome.length - y.a.nome.length || x.a.nome.localeCompare(y.a.nome, 'it');
    }).map(function (x) { return x.a; });
  },

  /* Cibi inseriti di recente, dal più recente, con l'ultima quantità usata.
     Restituisce [{ alimento, voce }] (voce = come l'hai mangiato l'ultima volta). */
  recentiDettaglio: function (giorni, max) {
    var U = App.Utils, visti = {}, out = [], self = this;
    max = max || 20;
    for (var n = 0; n < (giorni || 60) && out.length < max; n++) {
      var g = App.Stato.giorno(U.aggiungiGiorni(U.oggi(), -n));
      if (!g) continue;
      // Pasti del giorno dal più tardi al più presto.
      Object.keys(g.pasti).map(function (pid) { return g.pasti[pid]; })
        .sort(function (a, b) { return (b.ora || '') < (a.ora || '') ? -1 : 1; })
        .forEach(function (p) {
          (p.voci || []).slice().reverse().forEach(function (v) {
            if (out.length >= max || visti[v.alimentoId]) return;
            visti[v.alimentoId] = 1;
            var a = self.trova(v.alimentoId);
            if (a) out.push({ alimento: a, voce: v });
          });
        });
    }
    return out;
  },

  recenti: function (giorni, max) {
    return this.recentiDettaglio(giorni, max).map(function (x) { return x.alimento; });
  },

  /* Ripete la quantità dell'ultima volta con i valori attuali del cibo.
     Se era una misura (es. 1 piatto) usa il peso attuale della misura. Restituisce una voce di pasto. */
  comeUltimaVolta: function (a, ultima) {
    var g = ultima.grammi;
    if (ultima.unita && ultima.quante) {
      var p = this.pesoUnita(a, ultima.unita);
      if (p) g = Math.round(ultima.quante * p * 10) / 10;
    }
    return App.Nutrienti.voce(a, g, ultima.quantita, ultima.unita, ultima.quante);
  },

  // --- Misure casalinghe ------------------------------------------

  // Misure di un cibo, anche per i cibi salvati con la v1.3 (campo "porzione").
  misure: function (a) {
    var m = Object.assign({ cucchiaio: null, tazza: null, piatto: null, numero: null, numeroNome: '', numeroPlurale: '' },
      (a && a.misure) || {});
    var p = a && a.porzione;
    if (p && p.grammi && !(a.misure)) {
      if (/^tazz/.test(p.nome)) m.tazza = p.grammi;
      else if (/^cucchiai(o|i)$/.test(p.nome)) m.cucchiaio = p.grammi;
      else { m.numero = p.grammi; m.numeroNome = p.nome; m.numeroPlurale = p.plurale; }
    }
    return m;
  },

  unita: function (id) {
    return App.Config.unitaMisura.filter(function (u) { return u.id === id; })[0] || App.Config.unitaMisura[0];
  },

  // Grammi di 1 unità per quel cibo; null se il peso non è ancora stato indicato.
  pesoUnita: function (a, unitaId) {
    var u = this.unita(unitaId);
    if (!u.peso) return 1;
    var g = this.misure(a)[u.peso];
    return g ? g * (u.fattore || 1) : null;
  },

  // Nome della misura per quel cibo: "uovo/uova" per il numero, altrimenti quello dell'unità.
  nomiUnita: function (a, unitaId) {
    var u = this.unita(unitaId), m = this.misure(a);
    if (u.id === 'numero' && m.numeroNome) return { uno: m.numeroNome, molti: m.numeroPlurale || m.numeroNome };
    return { uno: u.uno, molti: u.molti };
  },

  // "2 uova", "1½ tazze", "½ tazza", "mezzo piatto", "200 ml". Per i grammi: ''.
  testoQuantita: function (a, unitaId, quante) {
    if (unitaId === 'g' || quante == null) return '';
    var U = App.Utils, n = this.nomiUnita(a, unitaId);
    if (unitaId === 'ml') return U.dec(quante, 0) + ' ml';
    if (unitaId === 'mezzoPiatto' && quante === 1) return 'mezzo piatto';
    var intero = Math.floor(quante), mezzo = Math.abs(quante - intero - 0.5) < 0.01;
    var num = mezzo ? (intero ? intero + '½' : '½') : U.dec(quante, 2);
    return num + ' ' + (quante > 1 ? n.molti : n.uno);
  },

  // Salva il peso di una misura per un cibo (anche del catalogo). Restituisce { errore } o { alimento }.
  salvaPeso: function (a, chiave, grammi) {
    var e = App.Sicurezza.controlla('grammi', grammi, 'Peso', true);
    if (e) return { errore: e };
    var m = this.misure(a);
    m[chiave] = grammi;
    return this.salva(Object.assign({}, a, { misure: m }));
  },

  // --- Salvataggio -------------------------------------------------

  valida: function (a) {
    if (!a.nome || !String(a.nome).trim()) return 'Scrivi il nome del cibo.';
    var m = a.misure || {};
    var nomi = { cucchiaio: 'Peso di 1 cucchiaio', tazza: 'Peso di 1 tazza', piatto: 'Peso di 1 piatto', numero: 'Peso di 1 pezzo' };
    for (var i = 0; i < this.CHIAVI_MISURE.length; i++) {
      var k = this.CHIAVI_MISURE[i];
      if (m[k] != null) {
        var e = App.Sicurezza.controlla('grammi', m[k], nomi[k], false);
        if (e) return e;
      }
    }
    return App.Sicurezza.macro(a.carb, a.prot, a.grassi);
  },

  // Salva un cibo nuovo o corretto. Restituisce { errore } oppure { alimento }.
  salva: function (dati) {
    var e = this.valida(dati);
    if (e) return { errore: e };
    var lista = App.Stato.dati.alimenti;
    var m = this.misure(dati);
    var a = {
      id: dati.id || ('pers:' + App.Utils.id()),
      nome: String(dati.nome).trim(),
      carb: dati.carb, prot: dati.prot, grassi: dati.grassi,
      fonte: dati.fonte || 'Personale', codice: dati.codice || '',
      misure: {
        cucchiaio: m.cucchiaio || null, tazza: m.tazza || null, piatto: m.piatto || null, numero: m.numero || null,
        numeroNome: String(m.numeroNome || '').trim().toLowerCase(),
        numeroPlurale: String(m.numeroPlurale || '').trim().toLowerCase()
      }
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
  }
};
