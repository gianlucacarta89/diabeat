/* ============================================================
   servizi/modelli.js
   Modelli di pasto: elenchi di cibi con i grammi, da caricare
   in un pasto con un tocco.
   Dipende da: App.Stato, App.Alimenti, App.Nutrienti, App.Sicurezza, App.Utils.
   Usato da: ui/ui-modelli.js, ui/ui-pasto-cibi.js.
   ============================================================ */
window.App = window.App || {};

App.Modelli = {
  tutti: function () {
    return App.Stato.dati.modelli.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome, 'it'); });
  },

  trova: function (id) {
    return App.Stato.dati.modelli.filter(function (m) { return m.id === id; })[0] || null;
  },

  // modello: { id?, nome, pastoId (facoltativo), voci: [{alimentoId, grammi}] }
  salva: function (m) {
    if (!m.nome || !m.nome.trim()) return { errore: 'Scrivi il nome del modello.' };
    if (!m.voci || !m.voci.length) return { errore: 'Aggiungi almeno un cibo al modello.' };
    for (var i = 0; i < m.voci.length; i++) {
      var e = App.Sicurezza.grammi(m.voci[i].grammi);
      if (e) return { errore: e };
    }
    var lista = App.Stato.dati.modelli;
    var nuovo = { id: m.id || App.Utils.id(), nome: m.nome.trim(), pastoId: m.pastoId || '',
      voci: m.voci.map(function (v) { return { alimentoId: v.alimentoId, nome: v.nome, grammi: v.grammi }; }) };
    var idx = lista.map(function (x) { return x.id; }).indexOf(nuovo.id);
    if (idx >= 0) lista[idx] = nuovo; else lista.push(nuovo);
    App.Stato.salva('modelli');
    return { modello: nuovo };
  },

  elimina: function (id) {
    App.Stato.dati.modelli = App.Stato.dati.modelli.filter(function (m) { return m.id !== id; });
    App.Stato.salva('modelli');
  },

  /* Trasforma il modello in voci di pasto con i valori attuali dell'archivio.
     Restituisce { voci, mancanti: [nomi dei cibi non più in archivio] } */
  vociDa: function (m) {
    var voci = [], mancanti = [];
    m.voci.forEach(function (v) {
      var a = App.Alimenti.trova(v.alimentoId);
      if (a) voci.push(App.Nutrienti.voce(a, v.grammi));
      else mancanti.push(v.nome || v.alimentoId);
    });
    return { voci: voci, mancanti: mancanti };
  },

  carboidrati: function (m) {
    return App.Nutrienti.totali(this.vociDa(m).voci).carb;
  }
};
