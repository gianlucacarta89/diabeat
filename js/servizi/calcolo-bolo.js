/* ============================================================
   servizi/calcolo-bolo.js
   Calcolo della dose suggerita per un pasto, passo per passo.
   Carboidrati ÷ rapporto insulina/carboidrati; dalla v1.10, se
   impostato il fattore di correzione, con l'obiettivo scelto nel pasto (es. 110-130):
   sopra → + (glicemia − limite alto) ÷ fattore; sotto → − (limite basso −
   glicemia) ÷ fattore; dentro → nessuna correzione. Le regole sono scritte anche in
   App.Config.testi.regoleCalcolo e mostrate nell'app: se cambi una
   regola qui, aggiorna il testo.
   Dipende da: App.Stato, App.Parametri, App.Sicurezza, App.InsulinaAttiva,
               App.Nutrienti, App.PastoGrasso, App.Utils.
   Usato da: ui/ui-calcolo.js.
   ============================================================ */
window.App = window.App || {};

App.CalcoloBolo = {
  /* dati: { data, pastoId, ora, glicemia, voci, obiettivo (id dell'obiettivo glicemico) }
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

    // 4. Insulina ancora attiva (se è impostata la durata d'azione).
    var iobTot = 0;
    if (imp.insulinaRapida.durataOre != null) {
      iobTot = App.InsulinaAttiva.calcola(dati.data, U.momento(dati.data, dati.ora), dati.data + '|' + dati.pastoId).totale || 0;
    }

    // 5. Correzione con la glicemia (facoltativa).
    var corr = App.Parametri.correzione(dati.obiettivo);
    if (corr && dati.glicemia != null) {
      var rif = dati.glicemia > corr.alto ? corr.alto : dati.glicemia < corr.basso ? corr.basso : null;
      var c = rif == null ? 0 : (dati.glicemia - rif) / corr.fattore;
      out.correzione = c;
      out.righe.push(rif == null
        ? { etichetta: 'Correzione glicemia', valore: dati.glicemia + ' mg/dL, dentro l\'obiettivo ' + corr.testo, nota: '= 0 U' }
        : { etichetta: 'Correzione glicemia', valore: '(' + dati.glicemia + ' − ' + rif + ') ÷ ' + U.dec(corr.fattore),
            nota: '= ' + (c > 0 ? '+' : '') + U.dec(c, 2) + ' U' });
      if (c > 0 && iobTot > 0) {
        var tolta = Math.min(c, iobTot);
        c -= tolta;
        out.righe.push({ etichetta: 'Insulina ancora attiva', valore: U.dec(iobTot, 1) + ' U', nota: '− ' + U.dec(tolta, 2) + ' U dalla correzione' });
      }
      out.esatta = Math.max(0, out.esatta + c);
      out.suggerita = U.arrotonda(out.esatta, imp.insulinaRapida.passo);
      out.righe.push({ etichetta: 'Totale', valore: '', nota: '= ' + U.dec(out.esatta, 2) + ' U' });
      if (dati.glicemia < corr.basso) out.info.push('Glicemia sotto l\'obiettivo (' + corr.testo + ' mg/dL): la dose è ridotta di ' + U.dec(-out.correzione, 1) + ' U.');
    } else {
      if (!corr && dati.glicemia != null && imp.range && dati.glicemia > imp.range.alto) {
        out.info.push('Glicemia ' + dati.glicemia + ' mg/dL: la dose suggerita non include una correzione (puoi impostarla in Impostazioni).');
      }
      if (corr && dati.glicemia == null) out.info.push('Scrivi la glicemia per includere la correzione.');
    }
    if (iobTot > 0) out.info.push('Hai ancora circa ' + U.dec(iobTot, 1) + ' U di insulina rapida attiva da boli precedenti.');

    // 6. Avvisi di sicurezza.
    if (S.oltreMassimo(out.suggerita)) {
      out.avvisi.push('La dose suggerita supera il tuo massimo di ' + imp.doseMax + ' U: ricontrolla cibi e grammi.');
    }

    // 7. Pasto ricco di grassi o proteine (riquadro a parte).
    out.grasso = App.PastoGrasso.valuta(tot, out.suggerita, dati.ora);
    return out;
  }
};
