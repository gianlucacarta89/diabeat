/* ============================================================
   ui/ui-pasto.js
   Finestra di un pasto: ora, glicemia, cibi, calcolo della dose
   (con il riquadro del pasto grasso), dose fatta, note.
   Ciò che scrivi resta come bozza finché non salvi: se chiudi la
   finestra o la pagina si ridisegna, non si perde.
   Dipende da: App.Stato, App.Diario, App.CalcoloBolo, App.Nutrienti,
               App.Sicurezza, App.UIComune, App.UICalcolo, App.UIPastoCibi,
               App.UIVoce, App.UIScanner, App.Avvisi,
               App.Nav, App.Utils.
   Usato da: ui/ui-giorno.js.
   ============================================================ */
window.App = window.App || {};

App.UIPasto = {
  apri: function (iso, pastoId) {
    var U = App.Utils, UC = App.UIComune, D = App.Diario, self = this;
    var salvato = (App.Stato.giorno(iso) || { pasti: {} }).pasti[pastoId];
    var bozza = D.leggiBozza(iso, pastoId);
    var cfgPasto = App.Config.pasti.filter(function (p) { return p.id === pastoId; })[0];
    var b = bozza ? U.clona(bozza) : salvato ? U.clona(salvato) : {
      ora: iso === U.oggi() ? U.oraAdesso() : cfgPasto.ora,
      glicemia: null, voci: [], dose: null, note: ''
    };
    var correzioneAttiva = App.Stato.imp().fattoreCorrezione != null;
    if (correzioneAttiva && !b.obiettivo) b.obiettivo = App.Parametri.obiettivo().id;
    var modificato = !!bozza;
    var risultato = null;

    var corpo = U.el('<div>' +
      (bozza ? '<div class="riquadro riquadro-avviso">✏️ Hai ripreso una bozza non salvata.</div>' : '') +
      '<div class="griglia-2">' +
        '<div>' + UC.campoOra('p-ora', 'Ora', b.ora) + '</div>' +
        '<div>' + UC.campo('p-glic', 'Glicemia', b.glicemia, 'mg/dL', { classe: 'grande' }) + '</div>' +
      '</div>' +
      (correzioneAttiva ? '<label for="p-obiettivo">🎯 Obiettivo glicemia</label><select id="p-obiettivo">' +
        App.Config.obiettiviGlicemia.map(function (o) {
          return '<option value="' + o.id + '"' + (o.id === b.obiettivo ? ' selected' : '') + '>' + U.esc(o.nome + ' mg/dL · ' + o.nota) + '</option>';
        }).join('') + '</select>' : '') +
      '<button class="btn btn-piccolo btn-neutro btn-pieno" style="margin-top:8px" data-az="sposta">🔁 Pasto sbagliato? Spostalo in un altro pasto</button>' +
      '<div class="sezione"><h2>Cibi</h2></div>' +
      '<div class="griglia-2" style="grid-template-columns:repeat(4,1fr);gap:6px">' +
        '<button class="btn btn-piccolo" data-az="cerca">🔍<br>Cerca</button>' +
        '<button class="btn btn-piccolo" data-az="voce">🎤<br>Voce</button>' +
        '<button class="btn btn-piccolo" data-az="codice">📷<br>Codice</button>' +
        '<button class="btn btn-piccolo" data-az="modello">📋<br>Modello</button>' +
      '</div>' +
      '<div class="card" style="margin-top:8px"><ul class="elenco" id="p-voci"></ul></div>' +
      '<div class="macro" id="p-macro"></div>' +
      '<div class="sezione"><h2>Dose</h2></div><div id="p-calcolo"></div>' +
      UC.campo('p-dose', 'Dose fatta (' + U.esc(App.Stato.imp().insulinaRapida.nome) + ')', b.dose, 'U', { classe: 'grande',
        aiuto: 'Scrivi la dose che fai davvero: è quella che conta per l\'insulina attiva.' }) +
      '<button class="btn btn-contorno btn-pieno" style="margin-top:8px" data-az="usa">↓ Uso la dose suggerita</button>' +
      '<label for="p-note">Note</label><textarea id="p-note" placeholder="es. pasto fuori casa, porzioni stimate">' + U.esc(b.note || '') + '</textarea>' +
    '</div>');

    var tocca = function () {
      modificato = true;
      D.salvaBozza(iso, pastoId, b);
    };
    var leggiCampi = function () {
      b.ora = corpo.querySelector('#p-ora').value;
      b.glicemia = UC.num(corpo, '#p-glic');
      b.dose = UC.num(corpo, '#p-dose');
      b.note = corpo.querySelector('#p-note').value;
      var ob = corpo.querySelector('#p-obiettivo');
      if (ob) b.obiettivo = ob.value;
    };

    var disegnaCalcolo = function () {
      risultato = App.CalcoloBolo.calcola({ data: iso, pastoId: pastoId, ora: b.ora, glicemia: b.glicemia, voci: b.voci, obiettivo: b.obiettivo });
      App.UICalcolo.disegna(corpo.querySelector('#p-calcolo'), risultato, iso);
      corpo.querySelector('[data-az=usa]').disabled = risultato.stato !== 'ok' || risultato.suggerita == null;
    };

    var disegnaVoci = function () {
      var ul = corpo.querySelector('#p-voci');
      ul.innerHTML = '';
      if (!b.voci.length) ul.appendChild(U.el('<li class="tenue">Nessun cibo. Usa i pulsanti sopra per aggiungerli.</li>'));
      b.voci.forEach(function (v, i) {
        var li = U.el('<li><div class="nome">' + U.esc(v.nome) + '<small>' + (v.quantita ? U.esc(v.quantita) + ' · ' : '') + U.dec(v.carb) + ' g carboidrati</small></div>' +
          '<input class="voce-grammi" inputmode="decimal" value="' + U.dec(v.grammi, 1) + '" aria-label="Grammi"><span class="tenue">g</span>' +
          '<button class="btn-icona rosso" aria-label="Togli">✕</button></li>');
        var inp = li.querySelector('input');
        inp.onchange = function () {
          var g = U.numero(inp.value);
          var e = App.Sicurezza.grammi(g);
          if (e) { UC.errore(li, 'input', e); inp.value = U.dec(v.grammi, 1); return; }
          App.Nutrienti.aggiornaGrammi(v, g); tocca(); disegnaVoci();
        };
        li.querySelector('button').onclick = function () { b.voci.splice(i, 1); tocca(); disegnaVoci(); };
        ul.appendChild(li);
      });
      var t = App.Nutrienti.totali(b.voci);
      corpo.querySelector('#p-macro').innerHTML =
        '<div class="carb"><b>' + U.dec(t.carb) + '</b><small>carboidrati g</small></div>' +
        '<div><b>' + U.dec(t.prot) + '</b><small>proteine g</small></div>' +
        '<div><b>' + U.dec(t.grassi) + '</b><small>grassi g</small></div>';
      disegnaCalcolo();
    };

    var aggiungiVoci = function (nuove) {
      if (!nuove || !nuove.length) return;
      b.voci = b.voci.concat(nuove); tocca(); disegnaVoci();
    };

    // Eventi dei campi
    if (correzioneAttiva) corpo.querySelector('#p-obiettivo').onchange = function () { leggiCampi(); tocca(); disegnaCalcolo(); };
    ['#p-ora', '#p-glic', '#p-dose', '#p-note'].forEach(function (sel) {
      corpo.querySelector(sel).addEventListener('input', function () { leggiCampi(); tocca(); if (sel !== '#p-note' && sel !== '#p-dose') disegnaCalcolo(); });
    });
    corpo.querySelector('[data-az=usa]').onclick = function () {
      if (!risultato || risultato.suggerita == null) return;
      corpo.querySelector('#p-dose').value = U.dec(risultato.suggerita, 1);
      leggiCampi(); tocca();
    };
    corpo.querySelector('[data-az=cerca]').onclick = function () { App.UIPastoCibi.cerca(aggiungiVoci); };
    corpo.querySelector('[data-az=voce]').onclick = function () { App.UIVoce.apri(aggiungiVoci); };
    corpo.querySelector('[data-az=codice]').onclick = function () {
      App.UIScanner.apri(function (alimento) { App.UIPastoCibi.chiediGrammi(alimento, function (v) { aggiungiVoci([v]); }); });
    };
    corpo.querySelector('[data-az=modello]').onclick = function () { App.UIPastoCibi.modello(pastoId, aggiungiVoci); };

    var finestraPasto = null;
    corpo.querySelector('[data-az=sposta]').onclick = function () {
      leggiCampi();
      self.scegliPasto(iso, pastoId, function (destinazione) {
        var cfgA = App.Config.pasti.filter(function (p) { return p.id === destinazione; })[0];
        var esegui = function (sostituisci) {
          var r = D.spostaPasto(iso, pastoId, destinazione, modificato ? b : null, sostituisci);
          if (r.errore) { App.Avvisi.toast(r.errore, 'errore', 4000); return; }
          modificato = false;
          finestraPasto.chiudi();
          App.Avvisi.toast('Spostato in ' + cfgA.nome.toLowerCase(), 'ok');
          self.apri(iso, destinazione);
        };
        if (!salvato && !modificato) { // niente da spostare: apre solo l'altro pasto
          finestraPasto.chiudi(); self.apri(iso, destinazione); return;
        }
        if (D.occupato(iso, destinazione)) {
          App.Avvisi.conferma({ titolo: cfgA.nome + ' già compilato', icona: '⚠️', pericolo: true, ok: 'Sì, sostituisci',
            testo: 'In questo giorno ' + cfgA.nome.toLowerCase() + ' ha già dei dati. Vuoi sostituirli con questo pasto?' })
            .then(function (si) { if (si) esegui(true); });
        } else esegui(false);
      });
    };

    var pulsanti = [];
    if (salvato) pulsanti.push({ testo: '🗑️', classe: 'btn-rosso', azione: function (f) {
      App.Avvisi.conferma({ titolo: 'Elimina pasto', testo: 'Vuoi eliminare ' + cfgPasto.nome.toLowerCase() + ' di questo giorno?', ok: 'Elimina', pericolo: true })
        .then(function (si) { if (si) { D.eliminaPasto(iso, pastoId); D.togliBozza(iso, pastoId); modificato = false; f.chiudi(); App.Avvisi.toast('Pasto eliminato', 'ok'); } });
      return false;
    } });
    if (modificato) pulsanti.push({ testo: '↺ Scarta', classe: 'btn-neutro', azione: function () {
      D.togliBozza(iso, pastoId); modificato = false; App.Avvisi.toast('Modifiche scartate', 'info');
    } });
    pulsanti.push({ testo: '💾 Salva pasto', classe: 'btn-verde', azione: function (f) { self.salva(iso, pastoId, b, risultato, f, function () { modificato = false; }); return false; } });

    finestraPasto = App.Avvisi.finestra({
      titolo: cfgPasto.nome + ' · ' + U.formattaData(iso, true), icona: cfgPasto.icona, contenuto: corpo, pulsanti: pulsanti,
      allaChiusura: function () {
        if (modificato) App.Avvisi.toast('Bozza conservata: la ritrovi riaprendo il pasto.', 'info');
        App.Nav.disegna();
      }
    });
    disegnaVoci();
  },

  // Finestra per scegliere in quale pasto spostare quello aperto.
  scegliPasto: function (iso, attuale, scelto) {
    var U = App.Utils, D = App.Diario;
    var corpo = U.el('<div><p class="tenue" style="margin-top:0">Ora, glicemia, cibi, dose e note passano al pasto che scegli.</p><ul class="elenco"></ul></div>');
    var ul = corpo.querySelector('ul'), f;
    App.Config.pasti.forEach(function (p) {
      if (p.id === attuale) return;
      var li = U.el('<li class="card-cliccabile"><div class="nome">' + p.icona + ' ' + U.esc(p.nome) +
        (D.occupato(iso, p.id) ? '<small>già compilato</small>' : '') + '</div><span class="chip">→</span></li>');
      li.onclick = function () { f.chiudi(); scelto(p.id); };
      ul.appendChild(li);
    });
    f = App.Avvisi.finestra({ titolo: 'Sposta in…', icona: '🔁', contenuto: corpo, pulsanti: [] });
  },

  // Controlli prima di salvare, con conferma se la dose supera il massimo.
  salva: function (iso, pastoId, b, risultato, f, fatto) {
    var procedi = function () {
      var r = App.Diario.salvaPasto(iso, pastoId, {
        ora: b.ora, glicemia: b.glicemia, voci: b.voci, dose: b.dose, suggerita: risultato && risultato.stato === 'ok' ? risultato.suggerita : null, note: (b.note || '').trim(),
        obiettivo: b.obiettivo || null
      });
      if (r.errore) { App.UIComune.errore(f.corpo, null, r.errore); return; }
      fatto();
      f.chiudi();
      App.Avvisi.toast('Pasto salvato', 'ok');
      r.avvisi.forEach(function (a) { App.Avvisi.toast(a, 'avviso', 5000); });
    };
    if (App.Sicurezza.oltreMassimo(b.dose)) {
      App.Avvisi.conferma({ titolo: 'Dose oltre il massimo', icona: '⚠️', pericolo: true, ok: 'Sì, salva',
        testo: b.dose + ' U supera il tuo massimo di ' + App.Stato.imp().doseMax + ' U. Confermi che è la dose fatta?' })
        .then(function (si) { if (si) procedi(); });
    } else procedi();
  }
};
