/* ============================================================
   ui/ui-pasto-cibi.js
   Scelta dei cibi: ricerca nell'archivio (con i cibi recenti) e tra
   i prodotti in commercio (Open Food Facts, su richiesta),
   quantità con l'unità di misura (grammi, ml, cucchiaio, tazza,
   piatto, mezzo piatto, numero), scelta di un modello di pasto.
   Dipende da: App.Alimenti, App.Modelli, App.Nutrienti, App.Sicurezza,
               App.UIComune, App.UIAlimentoForm, App.OpenFoodFacts, App.Avvisi, App.Config, App.Utils.
   Usato da: ui/ui-pasto.js, ui/ui-modelli.js.
   ============================================================ */
window.App = window.App || {};

App.UIPastoCibi = {
  // Riga di un cibo in un elenco.
  rigaAlimento: function (a) {
    var U = App.Utils, A = App.Alimenti, m = A.misure(a);
    var mis = [];
    if (m.numero) mis.push('1 ' + (m.numeroNome || 'pezzo') + ' = ' + U.dec(m.numero) + ' g');
    if (m.piatto) mis.push('1 piatto = ' + U.dec(m.piatto) + ' g');
    if (m.tazza) mis.push('1 tazza = ' + U.dec(m.tazza) + ' g');
    if (m.cucchiaio) mis.push('1 cucchiaio = ' + U.dec(m.cucchiaio) + ' g');
    return '<div class="nome">' + U.esc(a.nome) + '<small>' + U.dec(a.carb) + ' g CHO · ' + U.dec(a.prot) + ' P · ' +
      U.dec(a.grassi) + ' G per 100 g' + (mis.length ? '<br>' + U.esc(mis.join(' · ')) : '') + '</small></div>';
  },

  /* Ricerca con aggiunta multipla: la finestra resta aperta finché non premi "Fatto".
     callback(voci) riceve ogni cibo aggiunto, uno alla volta. */
  cerca: function (callback) {
    var U = App.Utils, self = this;
    var corpo = U.el('<div>' +
      '<input id="c-testo" type="search" enterkeyhint="search" placeholder="Cerca un cibo o un prodotto (es. pasta, oro saiwa)" autocomplete="off">' +
      '<div id="c-online"></div>' +
      '<div class="card" style="margin-top:8px"><ul class="elenco" id="c-elenco"></ul></div>' +
      '<button class="btn btn-contorno btn-pieno" data-az="nuovo">＋ Cibo nuovo in archivio</button>' +
    '</div>');

    var aggiunto = function (v) {
      callback([v]);
      App.Avvisi.toast(v.nome + ' aggiunto (' + (v.quantita ? v.quantita + ', ' : '') + U.dec(v.grammi, 0) + ' g)', 'ok', 1800);
    };
    var scegli = function (a, ultima) { self.chiediGrammi(a, aggiunto, null, ultima); };

    // Prodotti in commercio (Open Food Facts): solo su richiesta, perché il servizio limita le ricerche.
    var online = corpo.querySelector('#c-online');
    var pulsanteOnline = function (testo) {
      online.innerHTML = '';
      if (testo.trim().length < 3) return;
      var b = U.el('<button class="btn btn-contorno btn-pieno" style="margin-top:8px">🌐 Cerca «' + U.esc(testo.trim()) + '» tra i prodotti in commercio</button>');
      b.onclick = function () { cercaOnline(testo.trim()); };
      online.appendChild(b);
    };
    var cercaOnline = function (testo) {
      online.innerHTML = '<p class="tenue centro" style="margin:10px 0">🌐 Cerco «' + U.esc(testo) + '» su Open Food Facts…</p>';
      App.OpenFoodFacts.cercaNome(testo).then(function (r) {
        if (corpo.querySelector('#c-testo').value.trim() !== testo) return; // nel frattempo hai cambiato ricerca
        online.innerHTML = '';
        var card = U.el('<div class="card" style="margin-top:8px;border:2px solid var(--primario-chiaro)"><ul class="elenco"></ul></div>');
        var ul = card.querySelector('ul');
        ul.appendChild(U.el('<li class="tenue"><small>' + (r.errore ? U.esc(r.errore)
          : r.prodotti.length ? '🌐 Prodotti in commercio (Open Food Facts): toccandone uno lo salvi nel tuo archivio'
          : 'Nessun prodotto trovato con i valori nutrizionali completi. Prova con meno parole (es. solo marca e tipo) o usa il codice a barre.') +
          (r.dettagli && !r.prodotti.length ? '<br><span style="opacity:.6">Dettagli: ' + U.esc(r.dettagli) + '</span>' : '') + '</small></li>'));
        if (r.errore) {
          var riprova = U.el('<li><button class="btn btn-piccolo btn-contorno btn-pieno">🔄 Riprova</button></li>');
          riprova.querySelector('button').onclick = function () { cercaOnline(testo); };
          ul.appendChild(riprova);
        }
        r.prodotti.forEach(function (p) {
          var gia = p.codice && App.Alimenti.perCodice(p.codice);
          var li = U.el('<li class="card-cliccabile"><div class="nome">' + U.esc(p.nome) + '<small>' + U.dec(p.carb) + ' g CHO · ' +
            U.dec(p.prot) + ' P · ' + U.dec(p.grassi) + ' G per 100 g' + (p.porzione ? ' · porzione ' + U.dec(p.porzione) + ' g' : '') +
            (gia ? ' · già in archivio' : '') + '</small></div><span class="chip">＋</span></li>');
          li.onclick = function () {
            var s = App.OpenFoodFacts.salvaInArchivio(p);
            if (s.errore) { App.Avvisi.toast(s.errore, 'errore', 5000); return; }
            if (s.nuovo) App.Avvisi.toast('Salvato in archivio: ' + s.alimento.nome, 'ok', 2500);
            scegli(s.alimento);
          };
          ul.appendChild(li);
        });
        var altra = U.el('<button class="btn btn-piccolo btn-neutro btn-pieno" style="margin-top:6px">Chiudi i prodotti in commercio</button>');
        altra.onclick = function () { pulsanteOnline(testo); };
        online.appendChild(card);
        online.appendChild(altra);
      });
    };

    var disegna = function () {
      var testo = corpo.querySelector('#c-testo').value;
      var ul = corpo.querySelector('#c-elenco');
      ul.innerHTML = '';
      pulsanteOnline(testo);
      var lista;
      if (!testo) {
        // I 50 cibi inseriti più di recente: "＋" li aggiunge subito con la quantità dell'ultima volta.
        var recenti = App.Alimenti.recentiDettaglio(60, 50);
        ul.appendChild(U.el('<li class="tenue"><small>' + (recenti.length
          ? 'Inseriti di recente: tocca il pulsante per rimetterlo uguale all\'ultima volta, o il nome per cambiare quantità'
          : 'Scrivi il nome del cibo') + '</small></li>'));
        recenti.forEach(function (x) {
          var v = x.voce, et = (v.quantita ? v.quantita + ' · ' : '') + U.dec(v.grammi, 0) + ' g';
          var li = U.el('<li class="card-cliccabile"><div class="nome">' + U.esc(x.alimento.nome) +
            '<small>ultima volta: ' + U.esc(et) + '</small></div>' +
            '<button class="btn btn-piccolo btn-verde" style="white-space:nowrap">＋ ' + U.esc(v.quantita || U.dec(v.grammi, 0) + ' g') + '</button></li>');
          li.querySelector('button').onclick = function (e) {
            e.stopPropagation();
            aggiunto(App.Alimenti.comeUltimaVolta(x.alimento, v));
          };
          li.onclick = function () { scegli(x.alimento, v); };
          ul.appendChild(li);
        });
        return;
      } else {
        lista = App.Alimenti.cerca(testo).slice(0, 60);
        ul.appendChild(U.el('<li class="tenue"><small>' + (lista.length ? 'Nel tuo archivio'
          : 'Nessun cibo nel tuo archivio: cerca tra i prodotti in commercio qui sopra, o aggiungilo a mano qui sotto.') + '</small></li>'));
      }
      lista.forEach(function (a) {
        var li = U.el('<li class="card-cliccabile">' + self.rigaAlimento(a) + '<span class="chip">＋</span></li>');
        li.onclick = function () { scegli(a); };
        ul.appendChild(li);
      });
    };
    corpo.querySelector('#c-testo').addEventListener('input', disegna);
    // Invio sulla tastiera = cerca tra i prodotti in commercio.
    corpo.querySelector('#c-testo').addEventListener('keydown', function (e) {
      var t = e.target.value.trim();
      if (e.key === 'Enter' && t.length >= 3) { e.preventDefault(); cercaOnline(t); }
    });
    corpo.querySelector('[data-az=nuovo]').onclick = function () {
      App.UIAlimentoForm.apri({ nome: corpo.querySelector('#c-testo').value }, function (a) { disegna(); scegli(a); });
    };

    App.Avvisi.finestra({ titolo: 'Aggiungi cibi', icona: '🔍', contenuto: corpo,
      pulsanti: [{ testo: '✓ Fatto', classe: 'btn-verde' }] });
    disegna();
    setTimeout(function () { corpo.querySelector('#c-testo').focus(); }, 150);
  },

  /* Chiede quanto se ne mangia, con l'unità di misura scelta
     (grammi, ml, cucchiaio, tazza, piatto, mezzo piatto, numero).
     callback(voce) se confermato. grammiIniziali: apre già in grammi.
     ultima (facoltativa): voce dell'ultima volta, per riproporre la stessa misura e quantità. */
  chiediGrammi: function (a, callback, grammiIniziali, ultima) {
    var U = App.Utils, UC = App.UIComune, A = App.Alimenti;
    var m = A.misure(a);
    var unita = grammiIniziali != null ? 'g' : (m.numero ? 'numero' : (m.piatto ? 'piatto' : 'g'));
    var quanteIniziali = grammiIniziali;
    if (ultima) {
      if (ultima.unita && ultima.quante) { unita = ultima.unita; quanteIniziali = ultima.quante; }
      else { unita = 'g'; quanteIniziali = ultima.grammi; }
    }
    var corpo = U.el('<div><p><b>' + U.esc(a.nome) + '</b></p><p class="tenue">' + U.dec(a.carb) + ' g carboidrati per 100 g</p>' +
      '<label>Unità di misura</label><div class="riga" id="q-unita"></div>' +
      '<label for="q-quante" id="q-etichetta">Quantità</label>' +
      '<div class="campo-unita"><input id="q-quante" class="grande" inputmode="decimal" autocomplete="off"><span id="q-suffisso"></span></div>' +
      '<div class="riga" style="margin-top:8px" id="q-rapidi"></div>' +
      '<div id="q-peso-box" style="margin-top:10px"></div>' +
      '<p class="centro" id="q-risultato" style="font-weight:700;color:var(--primario);margin-top:10px"></p></div>');
    var inp = corpo.querySelector('#q-quante');
    if (quanteIniziali != null) inp.value = U.dec(quanteIniziali, 2);

    // Peso della misura scelta: quello salvato o quello scritto qui (che poi si salva).
    var pesoScritto = function () {
      var p = corpo.querySelector('#q-peso');
      return p ? U.numero(p.value) : null;
    };
    var pesoUnita = function () {
      var u = A.unita(unita);
      if (!u.peso) return 1;
      var base = pesoScritto();
      return base ? base * (u.fattore || 1) : null;
    };
    var calcola = function () {
      var q = U.numero(inp.value), p = pesoUnita();
      return (q && p) ? Math.round(q * p * 10) / 10 : null;
    };
    var aggiorna = function () {
      var g = calcola(), q = U.numero(inp.value);
      var r = corpo.querySelector('#q-risultato');
      if (!q) { r.textContent = ''; return; }
      if (g == null) { r.textContent = 'Scrivi il peso qui sopra per calcolare i grammi.'; return; }
      r.textContent = (unita === 'g' ? '' : '= ' + U.dec(g) + ' g · ') + U.dec(App.Nutrienti.per(a, g).carb) + ' g di carboidrati';
    };

    var disegnaUnita = function () {
      var u = A.unita(unita), nomi = A.nomiUnita(a, unita);
      corpo.querySelectorAll('#q-unita .chip-scelta').forEach(function (x) { x.classList.toggle('scelto', x.getAttribute('data-u') === unita); });
      corpo.querySelector('#q-suffisso').textContent = unita === 'g' ? 'g' : unita === 'ml' ? 'ml' : nomi.molti;
      corpo.querySelector('#q-etichetta').textContent = unita === 'g' ? 'Grammi' : unita === 'ml' ? 'Millilitri' : 'Quanti?';
      // Pulsanti rapidi
      var box = corpo.querySelector('#q-rapidi');
      box.innerHTML = '';
      var rapidi = (unita === 'numero' && m.numero && m.numero <= 15) ? [1, 2, 3, 4, 5, 6, 8, 10] : u.rapidi;
      rapidi.forEach(function (n) {
        var etich = unita === 'g' ? n + ' g' : unita === 'ml' ? n + ' ml' : A.testoQuantita(a, unita, n);
        var b = U.el('<span class="chip chip-scelta">' + U.esc(etich) + '</span>');
        b.onclick = function () { inp.value = U.dec(n, 2); aggiorna(); };
        box.appendChild(b);
      });
      // Peso della misura
      var pb = corpo.querySelector('#q-peso-box');
      pb.innerHTML = '';
      if (u.peso) {
        var nomeBase = u.peso === 'numero' ? (m.numeroNome || 'pezzo') : u.peso;
        var valore = m[u.peso];
        pb.appendChild(U.el('<div>' + UC.campo('q-peso', 'Peso di 1 ' + nomeBase + (u.fattore ? ' intero' : ''), valore, 'g',
          { aiuto: valore ? 'Valore indicativo: se lo cambi, l\'app ricorda il nuovo peso per questo cibo.'
                          : 'Non ancora indicato per questo cibo: scrivilo una volta e l\'app lo ricorderà.' }) + '</div>'));
        pb.querySelector('#q-peso').addEventListener('input', aggiorna);
      }
      if (unita === 'ml') pb.appendChild(U.el('<p class="aiuto">1 ml conta come 1 g: va bene per latte, succhi e bevande.</p>'));
      aggiorna();
    };

    App.Config.unitaMisura.forEach(function (u) {
      var etich = u.id === 'numero' && m.numeroNome ? 'numero (' + (m.numeroPlurale || m.numeroNome) + ')' : u.nome;
      var chip = U.el('<span class="chip chip-scelta" data-u="' + u.id + '">' + U.esc(etich) + '</span>');
      chip.onclick = function () {
        if (unita === chip.getAttribute('data-u')) return;
        unita = chip.getAttribute('data-u'); inp.value = ''; disegnaUnita(); inp.focus();
      };
      corpo.querySelector('#q-unita').appendChild(chip);
    });
    inp.addEventListener('input', aggiorna);

    var conferma = function (f) {
      var q = U.numero(inp.value);
      if (!q || q <= 0) { UC.errore(f.corpo, '#q-quante', 'Scrivi la quantità.'); return false; }
      var u = A.unita(unita), cibo = a;
      if (u.peso) {
        var peso = pesoScritto();
        if (!peso) { UC.errore(f.corpo, '#q-peso', 'Scrivi quanto pesa 1 ' + (u.peso === 'numero' ? (m.numeroNome || 'pezzo') : u.peso) + ' di questo cibo.'); return false; }
        if (peso !== m[u.peso]) {
          var r = A.salvaPeso(a, u.peso, peso);
          if (r.errore) { UC.errore(f.corpo, '#q-peso', r.errore); return false; }
          cibo = r.alimento;
        }
      }
      var g = calcola();
      var e = App.Sicurezza.grammi(g);
      if (e) { UC.errore(f.corpo, '#q-quante', e); return false; }
      callback(App.Nutrienti.voce(cibo, g, A.testoQuantita(cibo, unita, q), unita, q));
    };
    var fin = App.Avvisi.finestra({ titolo: 'Quanto ne mangi?', icona: '⚖️', classe: 'piccola', contenuto: corpo,
      pulsanti: [{ testo: 'Annulla', classe: 'btn-neutro' }, { testo: '＋ Aggiungi', classe: 'btn-verde', azione: conferma }] });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && conferma(fin) !== false) fin.chiudi(); });
    disegnaUnita();
    setTimeout(function () { inp.focus(); }, 150);
  },

  // Scelta di un modello di pasto; callback(voci).
  modello: function (pastoId, callback) {
    var U = App.Utils;
    var modelli = App.Modelli.tutti().sort(function (a, b) { return (b.pastoId === pastoId) - (a.pastoId === pastoId); });
    var corpo = U.el('<div><div class="card"><ul class="elenco"></ul></div></div>');
    var ul = corpo.querySelector('ul');
    if (!modelli.length) ul.appendChild(U.el('<li class="tenue">Nessun modello. Creali in Archivio → Modelli.</li>'));
    var fin;
    modelli.forEach(function (m) {
      var li = U.el('<li class="card-cliccabile"><div class="nome"><b>' + U.esc(m.nome) + '</b><small>' +
        U.esc(m.voci.map(function (v) { return v.nome + ' ' + v.grammi + ' g'; }).join(', ')) + '</small></div>' +
        '<span class="chip">' + U.dec(App.Modelli.carboidrati(m), 0) + ' g CHO</span></li>');
      li.onclick = function () {
        var r = App.Modelli.vociDa(m);
        if (r.mancanti.length) App.Avvisi.toast('Non più in archivio: ' + r.mancanti.join(', '), 'avviso', 5000);
        callback(r.voci);
        App.Avvisi.toast('Modello "' + m.nome + '" caricato: puoi ritoccare i grammi.', 'ok');
        fin.chiudi();
      };
      ul.appendChild(li);
    });
    fin = App.Avvisi.finestra({ titolo: 'Carica un modello', icona: '📋', contenuto: corpo, classe: 'piccola' });
  }
};
