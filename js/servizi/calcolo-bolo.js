/* ============================================================
   servizi/calcolo-bolo.js
   Calcolo della dose suggerita per un pasto, passo per passo.
   Dalla v1.1: solo carboidrati ÷ rapporto insulina/carboidrati,
   nessuna correzione automatica. Le regole sono scritte anche in
   App.Config.testi.regoleCalcolo e mostrate nell'app: se cambi una
   regola qui, aggiorna il testo.
   Dipende da: App.Stato, App.Parametri, App.Sicurezza, App.InsulinaAttiva,
               App.Nutrienti, App.PastoGrasso, App.Utils.
   Usato da: ui/ui-calcolo.js.
   ============================================================ */
window.App = window.App || {};

App.CalcoloBolo = {
  /* dati: { data, pastoId, ora, glicemia, voci }
     Restituisce:
     { stato: 'ok' | 'mancano' | 'ipo' | 'vuoto', mancanti: [], righe: [{etichetta, valore, nota}],
       esatta, suggerita, avvisi: [], info: [], totali, grasso } */
  calcola: function (dati) {
    var U = App.Utils, S = App.Sicurezza, imp = App.Stato.imp();
    var tot = App.Nutrienti.totali(dati.voci);
    var out = { stato: 'ok', mancanti: [], righe: [], esatta: null, suggerita: null, avvisi: [], info: [], totali: tot, grasso: null };

    // 1. Blocco ipoglicemia: viene prima di tutto.
    if (dati.glicemia != null && S.sottoSoglia(dati.glicemia)) {
      out.stato = 'ipo';
      out.avvisi.push('Glicemia ' + dati.glicemia + ' mg/dL, sotto la tua soglia di ' + imp.sogliaIpo +
        ' mg/dL: nessuna dose suggerita. Prima tratta l\'ipoglicemia e ricontrolla.');
      return out;
    }

    // 2. Parametri necessari.
    out.mancanti = App.Parametri.mancanti().concat(S.mancantiGenerali());
    if (out.mancanti.length) { out.stato = 'mancano'; return out; }
    if (!dati.voci.length) { out.stato = 'vuoto'; return out; }

    // 3. Carboidrati.
    var ic = App.Parametri.rapportoIC();
    out.esatta = tot.carb / ic;
    out.suggerita = U.arrotonda(out.esatta, imp.insulinaRapida.passo);
    out.righe.push({ etichetta: 'Carboidrati', valore: U.dec(tot.carb) + ' g ÷ ' + U.dec(ic) + ' g/U', nota: '= ' + U.dec(out.esatta, 2) + ' U' });

    // 4. Informazioni che NON entrano nel calcolo.
    if (dati.glicemia != null && imp.range && dati.glicemia > imp.range.alto) {
      out.info.push('Glicemia ' + dati.glicemia + ' mg/dL: la dose suggerita non include una correzione.');
    }
    if (imp.insulinaRapida.durataOre != null) {
      var iob = App.InsulinaAttiva.calcola(dati.data, U.momento(dati.data, dati.ora), dati.data + '|' + dati.pastoId);
      if (iob.totale > 0) out.info.push('Hai ancora circa ' + U.dec(iob.totale, 1) + ' U di insulina rapida attiva da boli precedenti.');
    }

    // 5. Avvisi di sicurezza.
    if (S.oltreMassimo(out.suggerita)) {
      out.avvisi.push('La dose suggerita supera il tuo massimo di ' + imp.doseMax + ' U: ricontrolla cibi e grammi.');
    }

    // 6. Pasto ricco di grassi o proteine (riquadro a parte).
    out.grasso = App.PastoGrasso.valuta(tot, out.suggerita, dati.ora);
    return out;
  }
};
