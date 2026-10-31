/* ============================================================
   ui/ui-alimento-form.js
   Finestra per creare o correggere un cibo dell'archivio.
   Usata anche dopo la scansione del codice a barre, per
   controllare i valori prima di salvarli.
   Dipende da: App.Alimenti, App.Config, App.UIComune, App.Avvisi, App.Utils.
   Usato da: ui/ui-archivio.js, ui/ui-pasto-cibi.js, ui/ui-scanner.js.
   ============================================================ */
window.App = window.App || {};

App.UIAlimentoForm = {
  /* dati: cibo esistente o valori di partenza { id?, nome, categoria, carb, prot, grassi, codice, fonte }
     opz: { titolo, avviso } — callback(alimento) dopo il salvataggio. */
  apri: function (dati, callback, opz) {
    var U = App.Utils, UC = App.UIComune;
    dati = dati || {};
    opz = opz || {};
    var cats = App.Config.categorie.map(function (c) {
      return '<option value="' + c.id + '"' + (dati.categoria === c.id ? ' selected' : '') + '>' + c.icona + ' ' + c.nome +
        (c.descrizione ? ' (' + c.descrizione + ')' : '') + '</option>';
    }).join('');
    var corpo = U.el('<div>' +
      (opz.avviso ? '<div class="riquadro riquadro-avviso">' + opz.avviso + '</div>' : '') +
      '<label for="f-nome">Nome</label><input id="f-nome" value="' + U.esc(dati.nome || '') + '" placeholder="es. Pasta di semola, cruda">' +
      '<label for="f-cat">Categoria</label><select id="f-cat"><option value="">— scegli —</option>' + cats + '</select>' +
      '<p class="aiuto" style="margin-top:12px"><b>Valori per 100 g</b> (dall\'etichetta, colonna "per 100 g")</p>' +
      '<div class="griglia-3">' +
        '<div>' + UC.campo('f-carb', 'Carboidrati', dati.carb, 'g') + '</div>' +
        '<div>' + UC.campo('f-prot', 'Proteine', dati.prot, 'g') + '</div>' +
        '<div>' + UC.campo('f-grassi', 'Grassi', dati.grassi, 'g') + '</div>' +
      '</div>' +
      '<div class="aiuto">Dall\'etichetta usa i "carboidrati" (non solo gli zuccheri).</div>' +
      (dati.codice ? '<p class="tenue" style="margin-top:10px">Codice a barre: <b>' + U.esc(dati.codice) + '</b></p>' : '') +
      (dati.fonte ? '<p class="tenue">Fonte: ' + U.esc(dati.fonte) + '</p>' : '') +
    '</div>');

    App.Avvisi.finestra({
      titolo: opz.titolo || (dati.id ? 'Modifica cibo' : 'Nuovo cibo'), icona: '🥫', classe: 'piccola', contenuto: corpo,
      pulsanti: [
        { testo: 'Annulla', classe: 'btn-neutro' },
        { testo: '💾 Salva', classe: 'btn-verde', azione: function (f) {
          var r = App.Alimenti.salva({
            id: dati.id, codice: dati.codice, fonte: dati.fonte,
            nome: UC.testo(corpo, '#f-nome'), categoria: corpo.querySelector('#f-cat').value,
            carb: UC.num(corpo, '#f-carb'), prot: UC.num(corpo, '#f-prot'), grassi: UC.num(corpo, '#f-grassi')
          });
          if (r.errore) { UC.errore(f.corpo, null, r.errore); return false; }
          App.Avvisi.toast('Cibo salvato in archivio', 'ok');
          if (callback) setTimeout(function () { callback(r.alimento); }, 0);
        } }
      ]
    });
    if (!dati.nome) setTimeout(function () { corpo.querySelector('#f-nome').focus(); }, 150);
  }
};
