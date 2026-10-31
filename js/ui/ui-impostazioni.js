/* ============================================================
   ui/ui-impostazioni.js
   Scheda "Impostazioni": insuline, sicurezza, parametri per pasto,
   attività e stati d'animo, backup, cancellazione del diario.
   Dipende da: App.Stato, App.Sicurezza, App.Config, App.UIComune,
               App.UIParametri, App.UIAttivitaUmori, App.Backup,
               App.Diario, App.Avvisi, App.Nav, App.Utils.
   Usato da: ui/navigazione.js.
   ============================================================ */
window.App = window.App || {};

App.UIImpostazioni = {
  disegna: function (c) {
    var U = App.Utils, UC = App.UIComune, imp = App.Stato.imp();
    c.appendChild(U.el('<div class="riquadro riquadro-info">ℹ️ ' + U.esc(App.Config.testi.premessa) + '</div>'));

    // --- Insuline ---
    var cardIns = U.el('<div class="card"><h2>💉 Insuline</h2>' +
      '<label for="s-rap">Insulina rapida (boli)</label><input id="s-rap" value="' + U.esc(imp.insulinaRapida.nome) + '">' +
      UC.campo('s-durata', 'Durata d\'azione della rapida', imp.insulinaRapida.durataOre, 'ore',
        { aiuto: 'Serve per stimare l\'insulina ancora attiva. Usa il valore indicato dal tuo diabetologo.' }) +
      '<label for="s-passo">Passo della penna</label><select id="s-passo">' +
        App.Config.passiPenna.map(function (p) {
          return '<option value="' + p + '"' + (imp.insulinaRapida.passo === p ? ' selected' : '') + '>' + U.dec(p) + ' U</option>';
        }).join('') + '</select>' +
      '<label for="s-bas">Insulina basale</label><input id="s-bas" value="' + U.esc(imp.insulinaBasale.nome) + '">' +
      '<button class="btn btn-verde btn-pieno" style="margin-top:12px">💾 Salva insuline</button></div>');
    cardIns.querySelector('button').onclick = function () {
      var durata = UC.num(cardIns, '#s-durata');
      var e = App.Sicurezza.controlla('durataOre', durata, 'Durata d\'azione', false);
      if (e) return UC.errore(cardIns, '#s-durata', e);
      imp.insulinaRapida.nome = UC.testo(cardIns, '#s-rap') || 'Rapida';
      imp.insulinaRapida.durataOre = durata;
      imp.insulinaRapida.passo = Number(cardIns.querySelector('#s-passo').value);
      imp.insulinaBasale.nome = UC.testo(cardIns, '#s-bas') || 'Basale';
      App.Stato.salva('impostazioni');
      App.Avvisi.toast('Insuline salvate', 'ok');
    };
    c.appendChild(cardIns);

    // --- Sicurezza ---
    var cardSic = U.el('<div class="card"><h2>🛡️ Sicurezza</h2>' +
      UC.campo('s-ipo', 'Soglia di ipoglicemia', imp.sogliaIpo, 'mg/dL', { aiuto: 'Sotto questo valore l\'app non suggerisce nessuna dose.' }) +
      UC.campo('s-max', 'Dose massima per un bolo', imp.doseMax, 'U', { aiuto: 'Oltre questo valore l\'app avvisa e chiede conferma.' }) +
      '<p class="aiuto" style="margin-top:12px"><b>Range per le statistiche</b> (non cambia la dose)</p>' +
      '<div class="griglia-2"><div>' + UC.campo('s-rb', 'Da', imp.range.basso, 'mg/dL') + '</div>' +
      '<div>' + UC.campo('s-ra', 'A', imp.range.alto, 'mg/dL') + '</div></div>' +
      '<button class="btn btn-verde btn-pieno" style="margin-top:12px">💾 Salva sicurezza</button></div>');
    cardSic.querySelector('button').onclick = function () {
      var S = App.Sicurezza;
      var ipo = UC.num(cardSic, '#s-ipo'), max = UC.num(cardSic, '#s-max');
      var rb = UC.num(cardSic, '#s-rb'), ra = UC.num(cardSic, '#s-ra');
      var e = S.controlla('sogliaIpo', ipo, 'Soglia di ipoglicemia', false);
      if (e) return UC.errore(cardSic, '#s-ipo', e);
      e = S.controlla('doseMax', max, 'Dose massima', false);
      if (e) return UC.errore(cardSic, '#s-max', e);
      if (rb == null || ra == null || rb < 50 || ra > 300 || rb >= ra) {
        return UC.errore(cardSic, '#s-rb', 'Range non valido: "Da" tra 50 e 300, "A" maggiore di "Da" e non oltre 300 mg/dL.');
      }
      imp.sogliaIpo = ipo; imp.doseMax = max; imp.range = { basso: rb, alto: ra };
      App.Stato.salva('impostazioni');
      App.Avvisi.toast('Impostazioni di sicurezza salvate', 'ok');
    };
    c.appendChild(cardSic);

    // --- Parametri per pasto, attività e umori ---
    App.UIParametri.disegna(c);
    App.UIAttivitaUmori.disegna(c);

    // --- Dati ---
    var cardDati = U.el('<div class="card"><h2>💾 Dati e backup</h2>' +
      '<p class="tenue">I dati sono salvati solo su questo dispositivo (' + (App.Archivio.modo === 'indexeddb' ? 'IndexedDB' : 'memoria locale') + '). ' +
      'Fai un backup ogni tanto e conservalo al sicuro: se cancelli i dati del browser o cambi telefono, è l\'unico modo per recuperarli.</p>' +
      '<div class="griglia-2"><button class="btn btn-blu" data-az="esp">⬇️ Esporta backup</button>' +
      '<button class="btn btn-blu" data-az="imp">⬆️ Importa backup</button></div>' +
      '<input type="file" accept=".json,application/json" class="nascosto">' +
      '<button class="btn btn-rosso btn-pieno" style="margin-top:14px" data-az="canc">🗑️ Cancella il diario</button>' +
      '<p class="aiuto">Cancella pasti, attività, basale, boli e ipoglicemie. Archivio cibi, modelli e impostazioni restano.</p></div>');
    var file = cardDati.querySelector('input[type=file]');
    cardDati.querySelector('[data-az=esp]').onclick = function () { App.Backup.esporta(); };
    cardDati.querySelector('[data-az=imp]').onclick = function () { file.value = ''; file.click(); };
    file.onchange = function () { if (file.files[0]) App.Backup.importa(file.files[0]); };
    cardDati.querySelector('[data-az=canc]').onclick = function () {
      App.Avvisi.conferma({ titolo: 'Cancella il diario', pericolo: true, ok: 'Cancella tutto',
        testo: 'Tutto il diario verrà cancellato da questo dispositivo. Ti consiglio di esportare prima un backup.\nVuoi procedere?' })
        .then(function (si) { if (si) { App.Diario.cancellaDiario(); App.Avvisi.toast('Diario cancellato', 'ok'); App.Nav.disegna(); } });
    };
    c.appendChild(cardDati);

    // --- Voce ---
    if (imp.vocaleOk) {
      var cardV = U.el('<div class="card"><h2>🎤 Riconoscimento vocale</h2><p class="tenue">Hai dato l\'ok all\'uso della voce.</p>' +
        '<button class="btn btn-neutro btn-pieno">Ritira l\'ok</button></div>');
      cardV.querySelector('button').onclick = function () { imp.vocaleOk = false; App.Stato.salva('impostazioni'); App.Nav.disegna(); };
      c.appendChild(cardV);
    }
  }
};
