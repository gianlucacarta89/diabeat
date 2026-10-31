/* ============================================================
   dati/backup.js
   Backup completo in JSON: esporta e importa tutti i dati
   (impostazioni, archivio cibi, modelli, diario, bozze).
   L'importazione chiede sempre conferma prima di sostituire.
   Dipende da: App.Stato, App.Config, App.Avvisi, App.Nav, App.Utils.
   Usato da: ui/ui-impostazioni.js.
   ============================================================ */
window.App = window.App || {};

App.Backup = {
  esporta: function () {
    var pacchetto = {
      app: App.Config.nomeArchivio, versione: App.Config.versione, creato: new Date().toISOString(),
      dati: App.Stato.dati
    };
    var ora = new Date();
    var nome = 'backup_diabeat_' + App.Utils.dataISO(ora) + '_' + App.Utils.oraAdesso().replace(':', '') + '.json';
    App.Utils.scarica(nome, JSON.stringify(pacchetto, null, 1), 'application/json');
    App.Avvisi.toast('Backup scaricato: ' + nome, 'ok', 5000);
  },

  importa: function (file) {
    var lettore = new FileReader();
    lettore.onload = function () {
      var p;
      try { p = JSON.parse(lettore.result); } catch (e) {
        App.Avvisi.toast('File non valido: non è un backup di questa app.', 'errore', 5000);
        return;
      }
      if (!p || p.app !== App.Config.nomeArchivio || !p.dati || typeof p.dati !== 'object') {
        App.Avvisi.toast('File non valido: non è un backup di ' + App.Config.nome + '.', 'errore', 5000);
        return;
      }
      var giorni = Object.keys(p.dati.giorni || {}).length;
      App.Avvisi.conferma({
        titolo: 'Importa backup', icona: '⬆️', pericolo: true, ok: 'Sostituisci i dati',
        testo: 'Backup del ' + (p.creato ? new Date(p.creato).toLocaleString('it-IT') : '?') + ' con ' + giorni + ' giorni di diario.\n' +
          'Tutti i dati attuali di questo dispositivo verranno SOSTITUITI. Vuoi procedere?'
      }).then(function (si) {
        if (!si) return;
        App.Stato.dati = App.Stato.completa(p.dati);
        App.Stato.salva();
        App.Avvisi.toast('Backup importato', 'ok');
        App.Nav.disegna();
      });
    };
    lettore.onerror = function () { App.Avvisi.toast('Non riesco a leggere il file.', 'errore'); };
    lettore.readAsText(file);
  }
};
