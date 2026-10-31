/* ============================================================
   servizi/calcolo-bolo.js
   Calcolo della dose suggerita per un pasto, passo per passo.
   Le regole sono scritte anche in App.Config.testi.regoleCalcolo
   e mostrate nell'app: se cambi una regola qui, aggiorna il testo.
   Dipende da: App.Stato, App.Parametri, App.Sicurezza,
               App.InsulinaAttiva, App.Nutrienti, App.Utils.
   Usato da: ui/ui-calcolo.js.
   ============================================================ */
window.App = window.App || {};

App.CalcoloBolo = {
  /* dati: { data, pastoId, ora, glicemia, voci, attivitaIds, umoreId }
     Restituisce:
     { stato: 'ok' | 'mancano' | 'ipo' | 'vuoto',
       mancanti: [], righe: [{etichetta, valore, nota}], esatta, suggerita,
       avvisi: [], totali } */
  calcola: function (dati) {
    var U = App.Utils, S = App.Sicurezza, imp = App.Stato.imp();
    var tot = App.Nutrienti.totali(dati.voci);
    var out = { stato: 'ok', mancanti: [], righe: [], esatta: null, suggerita: null, avvisi: [], totali: tot };

    // 1. Blocco ipoglicemia: viene prima di tutto.
    if (dati.glicemia != null && S.sottoSoglia(dati.glicemia)) {
      out.stato = 'ipo';
      out.avvisi.push('Glicemia ' + dati.glicemia + ' mg/dL, sotto la tua soglia di ' + imp.sogliaIpo +
        ' mg/dL: nessuna dose suggerita. Prima tratta l\'ipoglicemia e ricontrolla.');
      return out;
    }

    // 2. Parametri necessari.
    out.mancanti = S.mancantiGenerali().concat(App.Parametri.mancanti(dati.pastoId));
    if (out.mancanti.length) { out.stato = 'mancano'; return out; }

    if (!dati.voci.length && dati.glicemia == null) { out.stato = 'vuoto'; return out; }

    var p = App.Parametri.di(dati.pastoId);
    var r = out.righe;

    // 3. Carboidrati.
    var doseCarb = tot.carb / p.rapportoIC;
    r.push({ etichetta: 'Carboidrati', valore: U.dec(tot.carb) + ' g ÷ ' + U.dec(p.rapportoIC) + ' g/U', nota: '= ' + U.dec(doseCarb, 2) + ' U' });

    // 4. Correzione.
    var corr = 0;
    if (dati.glicemia != null) {
      corr = (dati.glicemia - p.obiettivo) / p.sensibilita;
      r.push({ etichetta: 'Correzione', valore: '(' + dati.glicemia + ' − ' + p.obiettivo + ') ÷ ' + U.dec(p.sensibilita), nota: '= ' + U.dec(corr, 2) + ' U' });
    } else {
      r.push({ etichetta: 'Correzione', valore: 'senza glicemia', nota: '= 0 U' });
      out.avvisi.push('Manca la glicemia: la dose non tiene conto della correzione.');
    }

    // 5. Insulina ancora attiva (solo se sei sopra l'obiettivo).
    var ms = U.momento(dati.data, dati.ora);
    var iob = App.InsulinaAttiva.calcola(dati.data, ms, dati.data + '|' + dati.pastoId);
    var corrNetta = corr;
    if (corr > 0) {
      corrNetta = Math.max(0, corr - iob.totale);
      r.push({ etichetta: 'Insulina ancora attiva', valore: '− ' + U.dec(iob.totale, 2) + ' U', nota: 'correzione netta = ' + U.dec(corrNetta, 2) + ' U' });
    } else if (iob.totale > 0) {
      r.push({ etichetta: 'Insulina ancora attiva', valore: U.dec(iob.totale, 2) + ' U', nota: 'non sottratta: sei sotto l\'obiettivo' });
      out.avvisi.push('Hai ' + U.dec(iob.totale, 1) + ' U ancora attive e sei sotto l\'obiettivo: valuta bene la dose.');
    }
    var base = doseCarb + corrNetta;

    // 6. Attività e stato d'animo.
    var pct = 0, motivi = [];
    (dati.attivitaIds || []).forEach(function (id) {
      var a = imp.attivita.filter(function (x) { return x.id === id; })[0];
      if (a && a.correzionePct) { pct += a.correzionePct; motivi.push(a.nome + ' ' + (a.correzionePct > 0 ? '+' : '') + a.correzionePct + '%'); }
    });
    var umore = imp.umori.filter(function (x) { return x.id === dati.umoreId; })[0];
    if (umore && umore.correzionePct) { pct += umore.correzionePct; motivi.push(umore.nome + ' ' + (umore.correzionePct > 0 ? '+' : '') + umore.correzionePct + '%'); }
    var corretta = base;
    if (pct !== 0 && base > 0) {
      corretta = base * (1 + pct / 100);
      r.push({ etichetta: 'Attività e umore', valore: motivi.join(', '), nota: U.dec(base, 2) + ' → ' + U.dec(corretta, 2) + ' U' });
    }

    // 7. Arrotondamento al passo della penna.
    out.esatta = Math.max(0, corretta);
    out.suggerita = U.arrotonda(out.esatta, imp.insulinaRapida.passo);
    if (corretta < 0) out.avvisi.push('Il calcolo dà un valore negativo: dose 0. Potresti aver bisogno di carboidrati in più.');

    // 8. Avvisi finali.
    if (S.oltreMassimo(out.suggerita)) {
      out.avvisi.push('La dose suggerita supera il tuo massimo di ' + imp.doseMax + ' U: ricontrolla cibi e grammi.');
    }
    if (App.Nutrienti.pastoGrasso(tot)) {
      out.avvisi.push('Pasto ricco di grassi (' + U.dec(tot.grassi) + ' g): la glicemia potrebbe salire anche ore dopo.');
    }
    return out;
  }
};
