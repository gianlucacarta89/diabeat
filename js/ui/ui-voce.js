/* ============================================================
   ui/ui-voce.js
   Inserimento dei cibi a voce (riconoscimento vocale del
   telefono) o scrivendo una frase: "80 grammi di pasta e 150 di pollo".
   L'app propone i cibi trovati in archivio: si controlla e si conferma.
   Al primo uso chiede l'ok, perché la frase dettata passa da internet.
   Dipende da: App.VoceTesto, App.Nutrienti, App.Sicurezza, App.Stato,
               App.Config, App.UIComune, App.Avvisi, App.Utils.
   Usato da: ui/ui-pasto.js.
   ============================================================ */
window.App = window.App || {};

App.UIVoce = {
  supportato: function () { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); },

  // callback(voci) con i cibi confermati.
  apri: function (callback) {
    var self = this, imp = App.Stato.imp();
    if (this.supportato() && !imp.vocaleOk) {
      App.Avvisi.conferma({ titolo: 'Riconoscimento vocale', icona: '🎤', ok: 'Ho capito, usa la voce', annulla: 'Solo testo',
        testo: App.Config.testi.avvisoVoce })
        .then(function (si) {
          if (si) { imp.vocaleOk = true; App.Stato.salva('impostazioni'); }
          self.finestra(callback, si);
        });
      return;
    }
    this.finestra(callback, this.supportato() && imp.vocaleOk);
  },

  finestra: function (callback, conVoce) {
    var U = App.Utils, self = this;
    var proposte = [];
    var corpo = U.el('<div>' +
      (conVoce ? '<button class="mic" aria-label="Parla">🎤</button><p class="centro tenue" id="v-stato">Tocca il microfono e di\' cosa mangi.</p>'
               : '<div class="riquadro riquadro-info">Scrivi cosa mangi, oppure usa il microfono della tastiera.</div>') +
      '<label for="v-testo">Frase</label>' +
      '<textarea id="v-testo" placeholder="es. 2 uova, una tazza e mezza di latte, 3 biscotti secchi"></textarea>' +
      '<button class="btn btn-contorno btn-pieno" data-az="analizza" style="margin-top:8px">Trova i cibi</button>' +
      '<div id="v-proposte"></div>' +
    '</div>');
    var testo = corpo.querySelector('#v-testo');

    var mostra = function () {
      var box = corpo.querySelector('#v-proposte');
      proposte = App.VoceTesto.analizza(testo.value);
      box.innerHTML = '';
      if (!proposte.length) { if (testo.value.trim()) box.innerHTML = '<p class="tenue">Non ho capito nessun cibo: prova a riformulare.</p>'; return; }
      var card = U.el('<div class="card" style="margin-top:10px"><ul class="elenco"></ul></div>');
      proposte.forEach(function (p, i) {
        var opz = p.candidati.map(function (a, j) {
          return '<option value="' + j + '">' + U.esc(a.nome) + ' (' + U.dec(a.carb) + ' g CHO/100 g)</option>';
        }).join('') + '<option value="-1">— non aggiungere —</option>';
        var li = U.el('<li style="flex-wrap:wrap"><div style="width:100%"><small class="tenue">“' + U.esc(p.testo) + '”</small></div>' +
          (p.candidati.length
            ? '<select class="cresce" style="flex:1;min-width:0" data-i="' + i + '">' + opz + '</select>'
            : '<div class="nome" style="color:var(--arancio)">Non trovato in archivio: aggiungilo da 🔍 Cerca</div>') +
          '<input class="voce-grammi" inputmode="decimal" data-g="' + i + '" placeholder="g" value="' + (p.grammi != null ? p.grammi : '') + '"><span class="tenue">g</span>' +
          '<div style="width:100%"><small class="tenue" data-q="' + i + '">' + U.esc(p.quantita || '') + '</small></div>' +
          '</li>');
        // Cambiando cibo, se avevi detto dei pezzi ("2 uova") i grammi si ricalcolano con la sua unità.
        var sel = li.querySelector('select');
        if (sel) sel.onchange = function () {
          var a = p.candidati[+sel.value];
          var dp = App.VoceTesto.daPezzi(a, p.pezzi);
          if (dp) { li.querySelector('input').value = dp.grammi; p.quantita = dp.quantita; }
          else if (p.pezzi != null) { li.querySelector('input').value = ''; p.quantita = ''; }
          li.querySelector('[data-q]').textContent = p.quantita || '';
        };
        li.querySelector('input').oninput = function () { p.quantita = ''; li.querySelector('[data-q]').textContent = ''; };
        card.querySelector('ul').appendChild(li);
      });
      box.appendChild(card);
    };
    corpo.querySelector('[data-az=analizza]').onclick = mostra;

    if (conVoce) this.collegaMicrofono(corpo, testo, mostra);

    App.Avvisi.finestra({ titolo: 'Cibi a voce', icona: '🎤', contenuto: corpo,
      allaChiusura: function () { self.ferma(); },
      pulsanti: [
        { testo: 'Annulla', classe: 'btn-neutro' },
        { testo: '＋ Aggiungi al pasto', classe: 'btn-verde', azione: function (f) {
          if (!proposte.length) mostra();
          var voci = [];
          for (var i = 0; i < proposte.length; i++) {
            var sel = corpo.querySelector('select[data-i="' + i + '"]');
            if (!sel || sel.value === '-1') continue;
            var a = proposte[i].candidati[+sel.value];
            var g = U.numero(corpo.querySelector('input[data-g="' + i + '"]').value);
            var e = App.Sicurezza.grammi(g);
            if (e) { App.UIComune.errore(f.corpo, 'input[data-g="' + i + '"]', a.nome + ' – ' + e); return false; }
            voci.push(App.Nutrienti.voce(a, g, proposte[i].quantita));
          }
          if (!voci.length) { App.Avvisi.toast('Nessun cibo da aggiungere.', 'avviso'); return false; }
          callback(voci);
          App.Avvisi.toast(voci.length + (voci.length === 1 ? ' cibo aggiunto' : ' cibi aggiunti'), 'ok');
        } }
      ] });
  },

  _rec: null,
  ferma: function () { if (this._rec) { try { this._rec.abort(); } catch (e) { /* già fermo */ } this._rec = null; } },

  collegaMicrofono: function (corpo, testo, dopo) {
    var self = this;
    var btn = corpo.querySelector('.mic'), stato = corpo.querySelector('#v-stato');
    btn.onclick = function () {
      if (self._rec) { self.ferma(); btn.classList.remove('ascolta'); return; }
      var R = window.SpeechRecognition || window.webkitSpeechRecognition;
      var rec = new R();
      rec.lang = App.Config.lingua; rec.interimResults = true; rec.continuous = false;
      var base = testo.value ? testo.value.trim() + ', ' : '';
      rec.onresult = function (ev) {
        var t = '';
        for (var i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript;
        testo.value = base + t;
      };
      rec.onerror = function (ev) {
        stato.textContent = ev.error === 'not-allowed' ? 'Permesso del microfono negato: abilitalo nelle impostazioni del browser.'
          : ev.error === 'network' ? 'Serve internet per il riconoscimento vocale. Puoi scrivere la frase.'
          : 'Non ho sentito bene: riprova o scrivi la frase.';
      };
      rec.onend = function () { self._rec = null; btn.classList.remove('ascolta'); if (testo.value.trim()) { stato.textContent = 'Controlla i cibi trovati.'; dopo(); } };
      self._rec = rec;
      btn.classList.add('ascolta');
      stato.textContent = 'Ti ascolto…';
      try { rec.start(); } catch (e) { self._rec = null; btn.classList.remove('ascolta'); }
    };
  }
};
