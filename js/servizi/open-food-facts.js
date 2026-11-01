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
    marca = String(marca || '').trim();
    if (marca && nome.toLowerCase().indexOf(marca.toLowerCase()) < 0) nome = (nome ? nome + ' – ' : '') + marca;
    return {
      trovato: true, codice: String(codice || p.code || ''), nome: nome, marca: marca,
      carb: num(n.carbohydrates_100g), prot: num(n.proteins_100g), grassi: num(n.fat_100g),
      // Porzione indicata sulla confezione (es. "30 g"), usata come "1 porzione" nella misura "numero".
      porzione: num(p.serving_quantity)
    };
  },

  completo: function (r) { return r.carb != null && r.prot != null && r.grassi != null && !!r.nome; },

  _fetch: function (url) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
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

  /* Prodotti per nome o marca. Promise<{ prodotti: [...], errore }>
     Tiene solo i prodotti con carboidrati, proteine e grassi indicati. */
  cercaNome: function (testo) {
    var C = App.Config.openFoodFacts, self = this;
    testo = String(testo || '').trim();
    if (testo.length < 3) return Promise.resolve({ prodotti: [], errore: 'Scrivi almeno 3 lettere.' });
    if (navigator.onLine === false) return Promise.resolve({ prodotti: [], errore: 'Sei offline: la ricerca dei prodotti in commercio richiede internet.' });
    var pulisci = function (lista) {
      var visti = {};
      return (lista || []).map(function (p) { return self.prodotto(p); })
        .filter(function (r) {
          if (!self.completo(r) || visti[r.codice || r.nome]) return false;
          visti[r.codice || r.nome] = 1;
          return true;
        });
    };
    var q = encodeURIComponent(testo);
    var url1 = C.urlRicerca + '?search_terms=' + q + '&search_simple=1&action=process&json=1&page_size=' + C.risultati +
      '&sort_by=unique_scans_n&fields=code,' + C.campi;
    var url2 = C.urlRicerca2 + '?q=' + q + '&langs=it&page_size=' + C.risultati + '&fields=code,' + C.campi;
    return this._fetch(url1)
      .then(function (j) { return { prodotti: pulisci(j.products) }; })
      // Se la ricerca principale non risponde, prova il nuovo motore di ricerca di Open Food Facts.
      .catch(function () {
        return self._fetch(url2).then(function (j) { return { prodotti: pulisci(j.hits || j.products) }; });
      })
      .catch(function () {
        return { prodotti: [], errore: 'Ricerca non riuscita: Open Food Facts non risponde o hai fatto troppe ricerche in poco tempo. Riprova tra un minuto.' };
      });
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
