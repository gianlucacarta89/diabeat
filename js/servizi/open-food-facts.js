/* ============================================================
   servizi/open-food-facts.js
   Cerca un prodotto confezionato per codice a barre su Open Food
   Facts (serve internet). Restituisce i valori per 100 g e la
   porzione della confezione; il prodotto viene salvato in archivio.
   Dipende da: App.Config.
   Usato da: ui/ui-scanner.js.
   ============================================================ */
window.App = window.App || {};

App.OpenFoodFacts = {
  codiceValido: function (c) { return /^\d{8,14}$/.test(String(c || '')); },

  // Promise<{ trovato, nome, carb, prot, grassi, codice, errore }>
  cerca: function (codice) {
    var C = App.Config.openFoodFacts;
    if (!this.codiceValido(codice)) {
      return Promise.resolve({ trovato: false, errore: 'Codice non valido: deve avere da 8 a 14 cifre.' });
    }
    if (navigator.onLine === false) {
      return Promise.resolve({ trovato: false, errore: 'Sei offline: collegati a internet e riprova, oppure inserisci i valori a mano.' });
    }
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 12000);
    return fetch(C.url + encodeURIComponent(codice) + '.json?fields=' + C.campi, ctrl ? { signal: ctrl.signal } : {})
      .then(function (r) { return r.json(); })
      .then(function (j) {
        clearTimeout(timer);
        if (!j || j.status !== 1 || !j.product) {
          return { trovato: false, codice: codice, errore: 'Prodotto non presente in Open Food Facts: inserisci i valori dall\'etichetta.' };
        }
        var p = j.product, n = p.nutriments || {};
        var num = function (v) { v = Number(v); return isFinite(v) ? Math.round(v * 10) / 10 : null; };
        var nome = (p.product_name_it || p.product_name || '').trim();
        if (p.brands) nome = (nome ? nome + ' – ' : '') + String(p.brands).split(',')[0].trim();
        return {
          trovato: true, codice: codice, nome: nome,
          carb: num(n.carbohydrates_100g), prot: num(n.proteins_100g), grassi: num(n.fat_100g),
          // Porzione indicata sulla confezione (es. "30 g"), usata come "1 porzione" nella misura "numero".
          porzione: num(p.serving_quantity)
        };
      })
      .catch(function () {
        clearTimeout(timer);
        return { trovato: false, codice: codice, errore: 'Ricerca non riuscita: controlla la connessione e riprova, oppure inserisci i valori a mano.' };
      });
  }
};
