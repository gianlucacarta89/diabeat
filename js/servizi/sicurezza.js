/* ============================================================
   servizi/sicurezza.js
   Controlli sui dati e blocchi di sicurezza. Ogni controllo
   restituisce null se il valore va bene, altrimenti un messaggio
   che spiega cosa è valido. Nessuna interfaccia.
   Dipende da: App.Config, App.Stato, App.Utils.
   Usato da: servizi/parametri.js, servizi/calcolo-bolo.js,
             servizi/diario.js, servizi/alimenti.js, ui/*.
   ============================================================ */
window.App = window.App || {};

App.Sicurezza = {
  // Controllo generico su un limite di config.js.
  controlla: function (chiave, valore, etichetta, obbligatorio) {
    var L = App.Config.limiti[chiave];
    var U = App.Utils;
    if (valore == null) return obbligatorio ? (etichetta + ': campo obbligatorio.') : null;
    if (!isFinite(valore)) return etichetta + ': scrivi un numero.';
    if (valore < L.min || valore > L.max) {
      return etichetta + ': valore non valido. Sono accettati valori da ' +
        U.dec(L.min) + ' a ' + U.dec(L.max) + ' ' + L.unita + '.';
    }
    return null;
  },

  glicemia: function (v, obbl) { return this.controlla('glicemia', v, 'Glicemia', obbl); },
  grammi: function (v) { return this.controlla('grammi', v, 'Grammi', true); },
  dose: function (v, obbl) { return this.controlla('dose', v, 'Dose', obbl); },
  correzione: function (v) { return this.controlla('correzione', v, 'Correzione', false); },

  // Valori nutrizionali per 100 g.
  macro: function (carb, prot, grassi) {
    var m = [['Carboidrati', carb], ['Proteine', prot], ['Grassi', grassi]];
    for (var i = 0; i < m.length; i++) {
      var e = this.controlla('macro', m[i][1], m[i][0], true);
      if (e) return e;
    }
    if (carb + prot + grassi > 100.5) {
      return 'Carboidrati + proteine + grassi superano 100 g su 100 g di prodotto: controlla i valori.';
    }
    return null;
  },

  ora: function (ora) {
    return App.Utils.oraValida(ora) ? null : 'Ora non valida: scrivi ore e minuti, per esempio 13:30.';
  },

  // Sotto la soglia di ipoglicemia? (null se la soglia non è impostata)
  sottoSoglia: function (glicemia) {
    var s = App.Stato.imp().sogliaIpo;
    if (s == null || glicemia == null) return false;
    return glicemia < s;
  },

  // Dose oltre il massimo impostato?
  oltreMassimo: function (dose) {
    var m = App.Stato.imp().doseMax;
    if (m == null || dose == null) return false;
    return dose > m;
  },

  // Cosa manca per poter suggerire una dose (parametri generali).
  mancantiGenerali: function () {
    var imp = App.Stato.imp();
    var m = [];
    if (imp.insulinaRapida.durataOre == null) m.push('durata d\'azione della ' + imp.insulinaRapida.nome);
    if (imp.sogliaIpo == null) m.push('soglia di ipoglicemia');
    if (imp.doseMax == null) m.push('dose massima per bolo');
    return m;
  }
};
