/* ============================================================
   ui/ui-giorno-extra.js
   Nel diario: sezioni Attività (con intensità), Boli extra,
   Ipoglicemie e Note, con le finestre per inserirle.
   Dipende da: App.Stato, App.Diario, App.UIComune, App.Avvisi,
               App.Nav, App.Utils.
   Usato da: ui/ui-giorno.js, ui/ui-calcolo.js (bolo aggiuntivo del pasto grasso).
   ============================================================ */
window.App = window.App || {};

App.UIGiornoExtra = {
  disegnaSezioni: function (c, iso, g) {
    var U = App.Utils, UC = App.UIComune, self = this, imp = App.Stato.imp();

    // Sezione con titolo, pulsante "+" ed elenco.
    var sezione = function (titolo, testoBtn, azione) {
      var s = U.el('<div class="sezione"><h2>' + titolo + '</h2><button class="btn btn-piccolo btn-contorno">' + testoBtn + '</button></div>');
      s.querySelector('button').onclick = azione;
      c.appendChild(s);
      var card = U.el('<div class="card"><ul class="elenco"></ul></div>');
      c.appendChild(card);
      return card.querySelector('ul');
    };
    var riga = function (ul, html, elenco, id, cosa) {
      var li = U.el('<li><div class="nome">' + html + '</div><button class="btn-icona rosso" aria-label="Elimina">🗑️</button></li>');
      li.querySelector('button').onclick = function () {
        App.Avvisi.conferma({ titolo: 'Elimina', testo: 'Vuoi eliminare ' + cosa + '?', ok: 'Elimina', pericolo: true })
          .then(function (si) { if (si) { App.Diario.rimuovi(iso, elenco, id); App.Nav.disegna(); } });
      };
      ul.appendChild(li);
    };
    var vuoto = function (ul, testo) { ul.appendChild(U.el('<li class="tenue">' + testo + '</li>')); };

    // Attività
    var ulA = sezione('🏃 Attività', '＋ Attività', function () { self.finestraAttivita(iso); });
    (g.attivita || []).forEach(function (a) {
      var def = UC.attivita(a.attivitaId) || { nome: a.attivitaId, icona: '🏃' };
      var dettagli = [a.intensita ? 'intensità ' + a.intensita : '', a.durataMin ? a.durataMin + ' min' : ''].filter(Boolean).join(' · ');
      riga(ulA, '<b>' + U.esc(a.ora) + '</b> ' + def.icona + ' ' + U.esc(def.nome) +
        (dettagli ? '<small>' + U.esc(dettagli) + '</small>' : '') +
        (a.note ? '<small>' + U.esc(a.note) + '</small>' : ''), 'attivita', a.id, 'questa attività');
    });
    if (!(g.attivita || []).length) vuoto(ulA, 'Nessuna attività registrata.');

    // Boli extra
    var ulE = sezione('💉 Boli extra', '＋ Bolo', function () { self.finestraBolo(iso); });
    (g.boliExtra || []).forEach(function (b) {
      riga(ulE, '<b>' + U.esc(b.ora) + '</b> ' + UC.chipDose(b.dose) + ' ' + UC.chipGlicemia(b.glicemia) +
        (b.note ? '<small>' + U.esc(b.note) + '</small>' : ''), 'boliExtra', b.id, 'questo bolo');
    });
    if (!(g.boliExtra || []).length) vuoto(ulE, 'Correzioni o dosi aggiuntive fuori dal momento del pasto.');

    // Ipoglicemie
    var ulI = sezione('🍬 Ipoglicemie', '＋ Ipo', function () { self.finestraIpo(iso); });
    (g.ipo || []).forEach(function (x) {
      riga(ulI, '<b>' + U.esc(x.ora) + '</b> ' + UC.chipGlicemia(x.glicemia) +
        (x.trattamento ? '<small>Trattata con: ' + U.esc(x.trattamento) + '</small>' : ''), 'ipo', x.id, 'questa ipoglicemia');
    });
    if (!(g.ipo || []).length) vuoto(ulI, 'Nessuna ipoglicemia registrata.');

    // Note
    c.appendChild(U.el('<div class="sezione"><h2>📝 Note del giorno</h2></div>'));
    var note = U.el('<textarea placeholder="Malattia, ciclo di allenamento, cambio sito di iniezione…"></textarea>');
    note.value = g.note || '';
    note.onchange = function () { App.Diario.salvaNote(iso, note.value.trim()); App.Avvisi.toast('Note salvate', 'ok', 1800); };
    c.appendChild(note);
  },

  // Finestra generica con un modulo; salva(f) restituisce il risultato del servizio.
  _modulo: function (titolo, icona, html, salva) {
    var fin = App.Avvisi.finestra({
      titolo: titolo, icona: icona, classe: 'piccola', contenuto: html,
      pulsanti: [
        { testo: 'Annulla', classe: 'btn-neutro' },
        { testo: '💾 Salva', classe: 'btn-verde', azione: function (f) {
          var fine = function (r) {
            if (!r) return false;
            if (r.errore) { App.UIComune.errore(f.corpo, null, r.errore); return false; }
            App.Avvisi.toast('Salvato', 'ok', 1800);
            App.Nav.disegna();
            return true;
          };
          var r = salva(f.corpo);
          // salva() può chiedere una conferma e restituire una Promise.
          if (r && typeof r.then === 'function') {
            r.then(function (x) { if (fine(x)) f.chiudi(); });
            return false;
          }
          return fine(r);
        } }
      ]
    });
    // Chip a scelta singola (es. intensità).
    fin.corpo.querySelectorAll('.chip-scelta').forEach(function (ch) {
      ch.onclick = function () {
        ch.parentNode.querySelectorAll('.chip-scelta').forEach(function (x) { x.classList.toggle('scelto', x === ch); });
      };
    });
    return fin;
  },

  finestraAttivita: function (iso, dopo) {
    var U = App.Utils, UC = App.UIComune;
    var opzioni = App.Stato.imp().attivita.map(function (a) {
      return '<option value="' + a.id + '">' + a.icona + ' ' + U.esc(a.nome) + '</option>';
    }).join('');
    var html = '<label>Attività</label><select id="a-tipo">' + opzioni + '</select>' +
      '<label>Intensità</label><div class="riga" id="a-int">' + App.Config.intensita.map(function (x) {
        return '<span class="chip chip-scelta" data-int="' + x + '">' + x + '</span>';
      }).join('') + '</div>' +
      UC.campoOra('a-ora', 'Ora di inizio', U.oraAdesso()) +
      UC.campo('a-durata', 'Durata (facoltativa)', null, 'min') +
      '<label for="a-note">Note</label><input id="a-note" placeholder="es. partita di campionato">';
    this._modulo('Nuova attività', '🏃', html, function (f) {
      var scelta = f.querySelector('#a-int .scelto');
      var r = App.Diario.aggiungiAttivita(iso, {
        attivitaId: f.querySelector('#a-tipo').value, ora: f.querySelector('#a-ora').value,
        intensita: scelta ? scelta.getAttribute('data-int') : '',
        durataMin: UC.num(f, '#a-durata'), note: UC.testo(f, '#a-note')
      });
      if (!r.errore && dopo) setTimeout(dopo, 0);
      return r;
    });
  },

  /* opz (facoltativo): { nota, aiutoDose } — usato per la dose aggiuntiva del pasto grasso.
     La dose resta vuota: la scrivi tu dopo aver visto la glicemia. */
  finestraBolo: function (iso, opz) {
    var UC = App.UIComune, U = App.Utils;
    opz = opz || {};
    var html = UC.campoOra('e-ora', 'Ora', U.oraAdesso()) +
      UC.campo('e-glic', 'Glicemia (facoltativa)', null, 'mg/dL') +
      UC.campo('e-dose', 'Dose fatta', null, 'U', { classe: 'grande', aiuto: opz.aiutoDose || '' }) +
      '<label for="e-note">Note</label><input id="e-note" placeholder="es. correzione dopo partita" value="' + U.esc(opz.nota || '') + '">';
    this._modulo(opz.titolo || 'Bolo extra', '💉', html, function (f) {
      var dati = { ora: f.querySelector('#e-ora').value, glicemia: UC.num(f, '#e-glic'),
        dose: UC.num(f, '#e-dose'), note: UC.testo(f, '#e-note') };
      if (!App.Sicurezza.oltreMassimo(dati.dose)) return App.Diario.aggiungiBoloExtra(iso, dati);
      return App.Avvisi.conferma({ titolo: 'Dose oltre il massimo', icona: '⚠️', pericolo: true, ok: 'Sì, salva',
        testo: dati.dose + ' U supera il tuo massimo di ' + App.Stato.imp().doseMax + ' U. Confermi che è la dose fatta?' })
        .then(function (si) { return si ? App.Diario.aggiungiBoloExtra(iso, dati) : null; });
    });
  },

  finestraIpo: function (iso) {
    var UC = App.UIComune;
    var html = UC.campoOra('i-ora', 'Ora', App.Utils.oraAdesso()) +
      UC.campo('i-glic', 'Glicemia', null, 'mg/dL', { classe: 'grande' }) +
      '<label for="i-tratt">Come l\'hai trattata</label><input id="i-tratt" placeholder="es. 15 g zucchero, succo di frutta">';
    this._modulo('Ipoglicemia', '🍬', html, function (f) {
      return App.Diario.aggiungiIpo(iso, { ora: f.querySelector('#i-ora').value, glicemia: UC.num(f, '#i-glic'), trattamento: UC.testo(f, '#i-tratt') });
    });
  }
};
