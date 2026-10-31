/* ============================================================
   servizi/voce-testo.js
   Trasforma una frase dettata o scritta ("80 grammi di pasta e
   150 di pollo") in un elenco di cibi con grammi e cibi
   dell'archivio che corrispondono. Nessuna interfaccia.
   Dipende da: App.Utils, App.Alimenti.
   Usato da: ui/ui-voce.js.
   ============================================================ */
window.App = window.App || {};

App.VoceTesto = {
  PAROLE: {
    un: 1, uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10,
    undici: 11, dodici: 12, tredici: 13, quattordici: 14, quindici: 15, sedici: 16, diciassette: 17, diciotto: 18, diciannove: 19
  },
  DECINE: { venti: 20, vent: 20, trenta: 30, trent: 30, quaranta: 40, quarant: 40, cinquanta: 50, cinquant: 50,
    sessanta: 60, sessant: 60, settanta: 70, settant: 70, ottanta: 80, ottant: 80, novanta: 90, novant: 90 },
  RIEMPITIVI: ['di', 'del', 'della', 'dello', 'dei', 'degli', 'delle', 'il', 'lo', 'la', 'i', 'gli', 'le', 'l',
    'circa', 'poi', 'ho', 'mangiato', 'mangio', 'sto', 'mangiando', 'anche', 'po', 'un', 'una', 'uno'],

  // "centocinquanta" → 150, "duecentoventi" → 220, "ottanta" → 80. null se non è un numero.
  parolaNumero: function (w) {
    if (/^\d+([.,]\d+)?$/.test(w)) return Number(w.replace(',', '.'));
    if (this.PAROLE[w] != null) return this.PAROLE[w];
    var tot = 0, resto = w;
    var m = resto.match(/^(due|tre|quattro|cinque|sei|sette|otto|nove)?cento/);
    if (m) { tot += (m[1] ? this.PAROLE[m[1]] : 1) * 100; resto = resto.slice(m[0].length); }
    if (resto === 'mille') return 1000;
    var trovata = false;
    for (var d in this.DECINE) {
      if (resto.indexOf(d) === 0) { tot += this.DECINE[d]; resto = resto.slice(d.length); trovata = true; break; }
    }
    if (resto) {
      var u = resto.replace(/^[ao]/, '');
      if (this.PAROLE[resto] != null) { tot += this.PAROLE[resto]; resto = ''; }
      else if (trovata && this.PAROLE[u] != null) { tot += this.PAROLE[u]; resto = ''; }
    }
    return (!resto && tot > 0) ? tot : null;
  },

  // Unità casalinghe riconosciute a voce (si tolgono dal nome del cibo).
  UNITA_CASA: /^(tazz[ae]|tazzin[ae]|bicchier[ei]|fett[ae]|cucchia(io|i)|cucchiain[oi]|vasett[oi]|pacchett[oi]|lattin[ae]|bottigli[ae]|pallin[ae]|quadrett[oi]|porzion[ei]|fogli[oi]?|pezz[oi])$/,

  // Divide la frase nei singoli cibi. "una tazza e mezza" resta unita.
  dividi: function (frase) {
    return String(frase || '').toLowerCase()
      .replace(/\s+e\s+mezz[oa](?=\s+di\b|\s*[,;.]|\s*$)/g, ' emezzo')
      .replace(/[;.]/g, ',')
      .split(/,|\s+e\s+|\s+poi\s+|\s+più\s+|\s+piu\s+/)
      .map(function (s) { return s.trim(); }).filter(Boolean);
  },

  /* Analizza un pezzo:
     "80 grammi di pasta"         → { grammi: 80, nome: 'pasta' }
     "2 uova"                     → { pezzi: 2, nome: 'uova' }
     "una tazza emezzo di latte"  → { pezzi: 1.5, nome: 'latte' } */
  pezzo: function (testo) {
    var self = this;
    var t = testo.replace(/(\d)\s*(g|gr|kg|ml)\b/g, '$1 $2').replace(/d'/g, 'di ').replace(/[']/g, ' ');
    var tok = t.split(/\s+/).filter(Boolean);
    var grammi = null, pezzi = null, usati = {};
    for (var i = 0; i < tok.length; i++) {
      var w = tok[i], u = tok[i + 1] || '';
      if ((w === 'mezzo' || w === 'mezza') && /^ett/.test(u)) { grammi = 50; usati[i] = usati[i + 1] = 1; break; }
      if ((w === 'mezzo' || w === 'mezza') && self.UNITA_CASA.test(u)) { pezzi = 0.5; usati[i] = usati[i + 1] = 1; break; }
      var n = self.parolaNumero(w);
      if (n == null) continue;
      if (/^(g|gr|grammi|grammo)$/.test(u)) { grammi = n; usati[i] = usati[i + 1] = 1; break; }
      if (/^ett[oi]$/.test(u)) { grammi = n * 100; usati[i] = usati[i + 1] = 1; break; }
      if (/^(kg|chilo|chili)$/.test(u)) { grammi = n * 1000; usati[i] = usati[i + 1] = 1; break; }
      if (/^(ml|millilitri)$/.test(u)) { grammi = n; usati[i] = usati[i + 1] = 1; break; }
      if (self.UNITA_CASA.test(u)) { pezzi = n; usati[i] = usati[i + 1] = 1; break; }
      // Numero senza unità: da 10 in su sono grammi, sotto sono pezzi (uova, biscotti…).
      if (n >= 10) { grammi = n; usati[i] = 1; break; }
      pezzi = n; usati[i] = 1; break;
    }
    var k = tok.indexOf('emezzo');
    if (k >= 0) { usati[k] = 1; if (pezzi != null) pezzi += 0.5; else if (grammi == null) pezzi = 0.5; }
    var nome = tok.filter(function (w, i) { return !usati[i] && self.RIEMPITIVI.indexOf(w) < 0 && !self.UNITA_CASA.test(w); }).join(' ').trim();
    return { grammi: grammi, pezzi: pezzi, nome: nome };
  },

  /* Riordina i candidati senza perdere l'ordine della ricerca:
     prima i cibi usati di recente; se hai detto dei pezzi ("2 uova"), prima quelli con un'unità. */
  ordina: function (lista, conPezzi) {
    var recenti = {};
    App.Alimenti.recenti(30, 50).forEach(function (a, i) { recenti[a.id] = 50 - i; });
    return lista.map(function (a, i) {
      var punti = (conPezzi && a.porzione ? 1000 : 0) + (recenti[a.id] || 0) * 10 - i;
      return { a: a, punti: punti };
    }).sort(function (x, y) { return y.punti - x.punti; }).map(function (x) { return x.a; });
  },

  // Grammi da un numero di pezzi, se il cibo ha un'unità. { grammi, quantita } oppure null.
  daPezzi: function (alimento, pezzi) {
    if (!alimento || !alimento.porzione || pezzi == null) return null;
    return { grammi: Math.round(pezzi * alimento.porzione.grammi * 10) / 10,
      quantita: App.Alimenti.testoPorzione(alimento.porzione, pezzi) };
  },

  // Restituisce [{ testo, grammi, pezzi, quantita, nome, candidati: [alimenti] }]
  analizza: function (frase) {
    var self = this;
    return this.dividi(frase).map(function (s) {
      var p = self.pezzo(s);
      var candidati = p.nome ? App.Alimenti.cerca(p.nome) : [];
      // Se non trova con tutte le parole, prova con la parola più lunga.
      if (!candidati.length && p.nome) {
        var lunga = p.nome.split(' ').sort(function (a, b) { return b.length - a.length; })[0];
        candidati = App.Alimenti.cerca(lunga);
      }
      candidati = self.ordina(candidati, p.pezzi != null).slice(0, 6);
      var r = { testo: s.replace(' emezzo', ' e mezzo'), grammi: p.grammi, pezzi: p.pezzi, quantita: '', nome: p.nome, candidati: candidati };
      var dp = r.grammi == null ? self.daPezzi(candidati[0], p.pezzi) : null;
      if (dp) { r.grammi = dp.grammi; r.quantita = dp.quantita; }
      return r;
    }).filter(function (x) { return x.nome || x.grammi; });
  }
};
