/* ============================================================
   servizi/open-food-facts.js
   Prodotti confezionati da Open Food Facts (database gratuito,
   serve internet):
   - cerca(codice): un prodotto dal codice a barre;
   - cercaNome(testo): prodotti in commercio per nome e marca
     (es. "gnocchi patarò", "oro saiwa");
   - salvaInArchivio(prodotto): lo mette nell'archivio dei cibi.
   Limite di Open Food Facts: circa 10 ricerche per nome al minuto,
   per questo la ricerca per nome parte solo con un pulsante.
   Dipende da: App.Config, App.Alimenti.
   Usato da: ui/ui-scanner.js, ui/ui-pasto-cibi.js.
   ============================================================ */
window.App = window.App || {};

App.OpenFoodFacts = {
  codiceValido: function (c) { return /^\d{8,14}$/.test(String(c || '')); },

  _num: function (v) {
    if (v == null || v === '') return null;
    v = Number(v);
    return isFinite(v) ? Math.round(v * 10) / 10 : null;
  },

  // Dal formato di Open Food Facts al nostro.
  prodotto: function (p, codice) {
    var n = p.nutriments || {}, num = this._num;
    var nome = String(p.product_name_it || p.product_name || '').trim();
    var marca = Array.isArray(p.brands) ? p.brands[0] : String(p.brands || '').split(',')[0];
    marca = String(marca || '').replace(/^[a-z]{2}:/, '').trim();
    if (marca && nome.toLowerCase().indexOf(marca.toLowerCase()) < 0) nome = (nome ? nome + ' – ' : '') + marca;
    return {
      trovato: true, codice: String(codice || p.code || ''), nome: nome, marca: marca,
      carb: num(n.carbohydrates_100g), prot: num(n.proteins_100g), grassi: num(n.fat_100g),
      // Porzione indicata sulla confezione (es. "30 g"), usata come "1 porzione" nella misura "numero".
      porzione: num(p.serving_quantity)
    };
  },

  completo: function (r) { return r.carb != null && r.prot != null && r.grassi != null && !!r.nome; },

  _fetch: function (url, ms) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms || 15000);
    return fetch(url, ctrl ? { signal: ctrl.signal } : {})
      .then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); },
            function (e) { clearTimeout(timer); throw e; });
  },

  // Promise<{ trovato, nome, carb, prot, grassi, porzione, codice, errore }>
  cerca: function (codice) {
    var C = App.Config.openFoodFacts, self = this;
    if (!this.codiceValido(codice)) {
      return Promise.resolve({ trovato: false, errore: 'Codice non valido: deve avere da 8 a 14 cifre.' });
    }
    if (navigator.onLine === false) {
      return Promise.resolve({ trovato: false, errore: 'Sei offline: collegati a internet e riprova, oppure inserisci i valori a mano.' });
    }
    return this._fetch(C.url + encodeURIComponent(codice) + '.json?fields=' + C.campi)
      .then(function (j) {
        if (!j || j.status !== 1 || !j.product) {
          return { trovato: false, codice: codice, errore: 'Prodotto non presente in Open Food Facts: inserisci i valori dall\'etichetta.' };
        }
        return self.prodotto(j.product, codice);
      })
      .catch(function () {
        return { trovato: false, codice: codice, errore: 'Ricerca non riuscita: controlla la connessione e riprova, oppure inserisci i valori a mano.' };
      });
  },

  /* Prodotti per nome o marca. Promise<{ prodotti: [...], errore, dettagli }>
     Open Food Facts ha piu' motori di ricerca e nessuno e' sempre affidabile dal telefono:
     li interroga insieme e usa il primo che risponde con dei prodotti.
     Se un motore restituisce solo nome e codice, i valori nutrizionali si leggono dalla scheda del prodotto.
     Tiene solo i prodotti con carboidrati, proteine e grassi indicati. */
  cercaNome: function (testo) {
    var C = App.Config.openFoodFacts, self = this;
    testo = String(testo || '').trim();
    if (testo.length < 3) return Promise.resolve({ prodotti: [], errore: 'Scrivi almeno 3 lettere.' });
    if (navigator.onLine === false) return Promise.resolve({ prodotti: [], errore: 'Sei offline: la ricerca dei prodotti in commercio richiede internet.' });
    var q = encodeURIComponent(testo), campi = 'code,' + C.campi;
    var attendi = function (ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); };
    var motori = [
      { nome: 'A', url: C.urlRicerca + '?q=' + q + '&langs=it&page_size=' + C.risultati + '&fields=' + campi, lista: 'hits' },
      { nome: 'B', url: C.urlRicercaClassica + '?search_terms=' + q + '&search_simple=1&action=process&json=1&lc=it&page_size=' + C.risultati +
          '&sort_by=unique_scans_n&fields=' + campi, lista: 'products', tentativi: [0, 2000, 4000] },
      { nome: 'C', url: C.urlRicercaRiserva + '?q=' + q + '&langs=it&page_size=' + C.risultati + '&fields=' + campi, lista: 'hits' }
    ];
    var dettagli = [];
    var interroga = function (m) {
      var prova = function (i) {
        return attendi((m.tentativi || [0])[i]).then(function () { return self._fetch(m.url); })
          .catch(function (e) {
            if (m.tentativi && i + 1 < m.tentativi.length) return prova(i + 1);
            throw e;
          });
      };
      return prova(0).then(function (j) {
        var lista = (j && (j[m.lista] || j.hits || j.products)) || [];
        return self._completa(lista).then(function (prodotti) {
          dettagli.push(m.nome + ': ' + lista.length + '/' + prodotti.length);
          return prodotti;
        });
      }, function (e) {
        dettagli.push(m.nome + ': ' + (e && e.name === 'AbortError' ? 'tempo scaduto' : (e && e.message) || 'errore'));
        throw e;
      });
    };
    return new Promise(function (fine) {
      var rimasti = motori.length, risposte = 0, finito = false;
      motori.forEach(function (m) {
        interroga(m).then(function (prodotti) {
          risposte++;
          if (!finito && prodotti.length) { finito = true; fine({ prodotti: prodotti, dettagli: dettagli.join(' · ') }); }
        }, function () {}).then(function () {
          if (--rimasti || finito) return;
          finito = true;
          fine(risposte ? { prodotti: [], dettagli: dettagli.join(' · ') }
            : { prodotti: [], dettagli: dettagli.join(' · '),
                errore: 'Ricerca non riuscita: Open Food Facts non risponde in questo momento (succede spesso con la ricerca per nome). Riprova tra un minuto, oppure usa il codice a barre.' });
        });
      });
    });
  },

  // Dai risultati grezzi ai prodotti completi; per quelli senza valori legge la scheda (max 12).
  _completa: function (lista) {
    var self = this, C = App.Config.openFoodFacts, visti = {};
    var prodotti = lista.map(function (p) { return self.prodotto(p); }).filter(function (r) {
      var k = r.codice || r.nome;
      if (!k || visti[k]) return false;
      visti[k] = 1; return true;
    });
    var daLeggere = prodotti.filter(function (r) { return !self.completo(r) && self.codiceValido(r.codice); }).slice(0, 12);
    return Promise.all(daLeggere.map(function (r) {
      return self._fetch(C.url + r.codice + '.json?fields=' + C.campi).then(function (j) {
        if (j && j.status === 1 && j.product) { var n = self.prodotto(j.product, r.codice); if (self.completo(n)) Object.assign(r, n); }
      }, function () {});
    })).then(function () { return prodotti.filter(function (r) { return self.completo(r); }); });
  },

  /* Salva un prodotto trovato nell'archivio dei cibi (se c'è già con lo stesso codice, usa quello).
     Restituisce { alimento, nuovo } oppure { errore }. */
  salvaInArchivio: function (r) {
    if (r.codice) {
      var esistente = App.Alimenti.perCodice(r.codice);
      if (esistente) return { alimento: esistente, nuovo: false };
    }
    var s = App.Alimenti.salva({
      nome: r.nome, carb: r.carb, prot: r.prot, grassi: r.grassi,
      codice: this.codiceValido(r.codice) ? r.codice : '', fonte: 'Open Food Facts',
      misure: (r.porzione && r.porzione >= 1) ? { numero: r.porzione, numeroNome: 'porzione', numeroPlurale: 'porzioni' } : null
    });
    return s.errore ? { errore: s.errore } : { alimento: s.alimento, nuovo: true };
  }
};
