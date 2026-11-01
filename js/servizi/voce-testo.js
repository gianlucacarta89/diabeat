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

  // Parole delle misure riconosciute a voce → unità di App.Config.unitaMisura (si tolgono dal nome del cibo).
  PAROLE_UNITA: [
    [/^(tazz[ae]|tazzin[ae])$/, 'tazza'],
    [/^cucchia(io|i)$/, 'cucchiaio'],
    [/^piatt[oi]$/, 'piatto'],
    [/^(bicchier[ei]|fett[ae]|vasett[oi]|pacchett[oi]|lattin[ae]|bottigli[ae]|pallin[ae]|quadrett[oi]|porzion[ei]|fogli[oi]?|pezz[oi]|confezion[ei])$/, 'numero']
  ],
  unitaDi: function (parola) {
    for (var i = 0; i < this.PAROLE_UNITA.length; i++) if (this.PAROLE_UNITA[i][0].test(parola)) return this.PAROLE_UNITA[i][1];
    return null;
  },

  // Divide la frase nei singoli cibi. "una tazza e mezza" resta unita.
  dividi: function (frase) {
    return String(frase || '').toLowerCase()
      .replace(/\s+e\s+mezz[oa](?=\s+di\b|\s*[,;.]|\s*$)/g, ' emezzo')
      .replace(/[;.]/g, ',')
      .split(/,|\s+e\s+|\s+poi\s+|\s+più\s+|\s+piu\s+/)
      .map(function (s) { return s.trim(); }).filter(Boolean);
  },

  /* Analizza un pezzo della frase:
     "80 grammi di pasta"          → { grammi: 80, nome: 'pasta' }
     "200 ml di latte"             → { unita: 'ml', quante: 200, nome: 'latte' }
     "2 uova"                      → { unita: 'numero', quante: 2, nome: 'uova' }
     "una tazza emezzo di latte"   → { unita: 'tazza', quante: 1.5, nome: 'latte' }
     "un piatto di pasta"          → { unita: 'piatto', quante: 1, nome: 'pasta' }
     "mezzo piatto di riso"        → { unita: 'mezzoPiatto', quante: 1, nome: 'riso' } */
  pezzo: function (testo) {
    var self = this;
    var t = testo.replace(/(\d)\s*(g|gr|kg|ml)\b/g, '$1 $2').replace(/d'/g, 'di ').replace(/[']/g, ' ');
    var tok = t.split(/\s+/).filter(Boolean);
    var grammi = null, unita = null, quante = null, parola = '', usati = {};
    for (var i = 0; i < tok.length; i++) {
      var w = tok[i], u = tok[i + 1] || '', un = self.unitaDi(u);
      if (w === 'mezzo' || w === 'mezza') {
        if (/^ett/.test(u)) { grammi = 50; usati[i] = usati[i + 1] = 1; break; }
        if (un === 'piatto') { unita = 'mezzoPiatto'; quante = 1; usati[i] = usati[i + 1] = 1; break; }
        if (un) { unita = un; quante = 0.5; parola = u; usati[i] = usati[i + 1] = 1; break; }
      }
      var n = self.parolaNumero(w);
      if (n == null) {
        // "piatto di pasta" senza numero = 1 piatto
        var un0 = self.unitaDi(w);
        if (un0 && un0 !== 'numero' && i === 0) { unita = un0; quante = 1; usati[i] = 1; break; }
        continue;
      }
      if (/^(g|gr|grammi|grammo)$/.test(u)) { grammi = n; usati[i] = usati[i + 1] = 1; break; }
      if (/^ett[oi]$/.test(u)) { grammi = n * 100; usati[i] = usati[i + 1] = 1; break; }
      if (/^(kg|chilo|chili)$/.test(u)) { grammi = n * 1000; usati[i] = usati[i + 1] = 1; break; }
      if (/^(ml|millilitri)$/.test(u)) { unita = 'ml'; quante = n; usati[i] = usati[i + 1] = 1; break; }
      if (un) { unita = un; quante = n; parola = u; usati[i] = usati[i + 1] = 1; break; }
      // Numero senza unità: da 10 in su sono grammi, sotto sono pezzi (uova, biscotti…).
      if (n >= 10) { grammi = n; usati[i] = 1; break; }
      unita = 'numero'; quante = n; usati[i] = 1; break;
    }
    var k = tok.indexOf('emezzo');
    if (k >= 0) {
      usati[k] = 1;
      if (quante != null && unita !== 'mezzoPiatto') quante += 0.5;
      else if (grammi == null && unita == null) { unita = 'numero'; quante = 0.5; }
    }
    var nome = tok.filter(function (w, i) { return !usati[i] && self.RIEMPITIVI.indexOf(w) < 0 && !self.unitaDi(w); }).join(' ').trim();
    return { grammi: grammi, unita: unita, quante: quante, parola: parola, nome: nome };
  },

  /* Riordina i candidati senza perdere l'ordine della ricerca:
     prima i cibi usati di recente; se hai detto una misura ("2 uova", "un piatto"),
     prima quelli che hanno il peso di quella misura. */
  ordina: function (lista, unita, parola) {
    var recenti = {};
    App.Alimenti.recenti(30, 50).forEach(function (a, i) { recenti[a.id] = 50 - i; });
    var radice = (parola || '').slice(0, -1);
    return lista.map(function (a, i) {
      var conPeso = unita && App.Alimenti.pesoUnita(a, unita) != null;
      // "una fetta di pane": meglio il pane che si misura a fette
      var stessoPezzo = radice.length > 2 && App.Alimenti.misure(a).numeroNome.indexOf(radice) === 0;
      return { a: a, punti: (conPeso ? 1000 : 0) + (stessoPezzo ? 500 : 0) + (recenti[a.id] || 0) * 10 - i };
    }).sort(function (x, y) { return y.punti - x.punti; }).map(function (x) { return x.a; });
  },

  // Grammi da una misura per quel cibo. { grammi, quantita } oppure null se il peso non è noto.
  daMisura: function (alimento, unita, quante) {
    if (!alimento || !unita || quante == null) return null;
    var p = App.Alimenti.pesoUnita(alimento, unita);
    if (p == null) return null;
    return { grammi: Math.round(quante * p * 10) / 10, quantita: App.Alimenti.testoQuantita(alimento, unita, quante) };
  },

  // Restituisce [{ testo, grammi, unita, quante, quantita, nome, candidati: [alimenti] }]
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
      candidati = self.ordina(candidati, p.unita, p.parola).slice(0, 6);
      var r = { testo: s.replace(' emezzo', ' e mezzo'), grammi: p.grammi, unita: p.unita, quante: p.quante,
        quantita: '', nome: p.nome, candidati: candidati };
      var dm = r.grammi == null ? self.daMisura(candidati[0], p.unita, p.quante) : null;
      if (dm) { r.grammi = dm.grammi; r.quantita = dm.quantita; }
      return r;
    }).filter(function (x) { return x.nome || x.grammi; });
  }
};
