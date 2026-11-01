/* ============================================================
   ui/ui-alimento-form.js
   Finestra per creare o correggere un cibo dell'archivio.
   Usata anche dopo la scansione del codice a barre, per
   controllare i valori prima di salvarli.
   Dipende da: App.Alimenti, App.UIComune, App.Avvisi, App.Utils.
   Usato da: ui/ui-archivio.js, ui/ui-pasto-cibi.js, ui/ui-scanner.js.
   ============================================================ */
window.App = window.App || {};

App.UIAlimentoForm = {
  /* dati: cibo esistente o valori di partenza { id?, nome, carb, prot, grassi, misure, codice, fonte }
     opz: { titolo, avviso } — callback(alimento) dopo il salvataggio. */
  apri: function (dati, callback, opz) {
    var U = App.Utils, UC = App.UIComune;
    dati = dati || {};
    opz = opz || {};
    var m = App.Alimenti.misure(dati);
    var corpo = U.el('<div>' +
      (opz.avviso ? '<div class="riquadro riquadro-avviso">' + opz.avviso + '</div>' : '') +
      '<label for="f-nome">Nome</label><input id="f-nome" value="' + U.esc(dati.nome || '') + '" placeholder="es. Pasta di semola, cruda">' +
      '<p class="aiuto" style="margin-top:12px"><b>Valori per 100 g</b> (dall\'etichetta, colonna "per 100 g")</p>' +
      '<div class="griglia-3">' +
        '<div>' + UC.campo('f-carb', 'Carboidrati', dati.carb, 'g') + '</div>' +
        '<div>' + UC.campo('f-prot', 'Proteine', dati.prot, 'g') + '</div>' +
        '<div>' + UC.campo('f-grassi', 'Grassi', dati.grassi, 'g') + '</div>' +
      '</div>' +
      '<div class="aiuto">Dall\'etichetta usa i "carboidrati" (non solo gli zuccheri).</div>' +
      '<p class="aiuto" style="margin-top:14px"><b>Pesi delle misure</b> (facoltativi): servono per indicare la quantità in cucchiai, tazze, piatti o pezzi. ' +
      'Grammi e ml non hanno bisogno di pesi. Il mezzo piatto è la metà del piatto.</p>' +
      '<div class="griglia-3">' +
        '<div>' + UC.campo('f-cucchiaio', '1 cucchiaio', m.cucchiaio, 'g') + '</div>' +
        '<div>' + UC.campo('f-tazza', '1 tazza', m.tazza, 'g') + '</div>' +
        '<div>' + UC.campo('f-piatto', '1 piatto', m.piatto, 'g') + '</div>' +
      '</div>' +
      '<div class="griglia-3">' +
        '<div>' + UC.campo('f-numero', '1 pezzo', m.numero, 'g') + '</div>' +
        '<div><label for="f-nnome">Nome del pezzo</label><input id="f-nnome" placeholder="es. uovo" value="' + U.esc(m.numeroNome) + '"></div>' +
        '<div><label for="f-nplur">Plurale</label><input id="f-nplur" placeholder="es. uova" value="' + U.esc(m.numeroPlurale) + '"></div>' +
      '</div>' +
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
            nome: UC.testo(corpo, '#f-nome'),
            carb: UC.num(corpo, '#f-carb'), prot: UC.num(corpo, '#f-prot'), grassi: UC.num(corpo, '#f-grassi'),
            misure: {
              cucchiaio: UC.num(corpo, '#f-cucchiaio'), tazza: UC.num(corpo, '#f-tazza'), piatto: UC.num(corpo, '#f-piatto'),
              numero: UC.num(corpo, '#f-numero'), numeroNome: UC.testo(corpo, '#f-nnome'), numeroPlurale: UC.testo(corpo, '#f-nplur')
            }
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
