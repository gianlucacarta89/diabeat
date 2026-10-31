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

  // Divide la frase nei singoli cibi.
  dividi: function (frase) {
    return String(frase || '').toLowerCase()
      .replace(/[;.]/g, ',')
      .split(/,|\s+e\s+|\s+poi\s+|\s+più\s+|\s+piu\s+/)
      .map(function (s) { return s.trim(); }).filter(Boolean);
  },

  // Analizza un pezzo: "80 grammi di pasta" → { grammi: 80, nome: 'pasta' }
  pezzo: function (testo) {
    var self = this;
    var t = testo.replace(/(\d)\s*(g|gr|kg|ml)\b/g, '$1 $2').replace(/d'/g, 'di ').replace(/[']/g, ' ');
    var tok = t.split(/\s+/).filter(Boolean);
    var grammi = null, usati = {};
    for (var i = 0; i < tok.length; i++) {
      var w = tok[i];
      if (w === 'mezzo' && /^ett/.test(tok[i + 1] || '')) { grammi = 50; usati[i] = usati[i + 1] = 1; break; }
      var n = self.parolaNumero(w);
      if (n == null) continue;
      var u = tok[i + 1] || '';
      if (/^(g|gr|grammi|grammo)$/.test(u)) { grammi = n; usati[i] = usati[i + 1] = 1; break; }
      if (/^ett[oi]$/.test(u)) { grammi = n * 100; usati[i] = usati[i + 1] = 1; break; }
      if (/^(kg|chilo|chili)$/.test(u)) { grammi = n * 1000; usati[i] = usati[i + 1] = 1; break; }
      if (/^(ml|millilitri)$/.test(u)) { grammi = n; usati[i] = usati[i + 1] = 1; break; }
      // Numero senza unità: da 10 in su sono grammi, sotto sono pezzi (grammi da scrivere).
      if (n >= 10) { grammi = n; usati[i] = 1; break; }
      usati[i] = 1; break;
    }
    var nome = tok.filter(function (w, i) { return !usati[i] && self.RIEMPITIVI.indexOf(w) < 0; }).join(' ').trim();
    return { grammi: grammi, nome: nome };
  },

  // Restituisce [{ testo, grammi, nome, candidati: [alimenti] }]
  analizza: function (frase) {
    var self = this;
    return this.dividi(frase).map(function (s) {
      var p = self.pezzo(s);
      var candidati = p.nome ? App.Alimenti.cerca(p.nome).slice(0, 6) : [];
      // Se non trova con tutte le parole, prova con la parola più lunga.
      if (!candidati.length && p.nome) {
        var lunga = p.nome.split(' ').sort(function (a, b) { return b.length - a.length; })[0];
        candidati = App.Alimenti.cerca(lunga).slice(0, 6);
      }
      return { testo: s, grammi: p.grammi, nome: p.nome, candidati: candidati };
    }).filter(function (x) { return x.nome || x.grammi; });
  }
};
