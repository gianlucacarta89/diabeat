/* ============================================================
   ui/ui-giorno.js
   Scheda "Diario": un giorno con i sei pasti, le attività, la
   basale, i boli extra, le ipoglicemie e le note.
   Dipende da: App.Stato, App.Diario, App.InsulinaAttiva, App.Nutrienti,
               App.Sicurezza, App.Parametri, App.UIComune, App.UIPasto,
               App.UIGiornoExtra, App.Nav, App.Utils.
   Usato da: ui/navigazione.js.
   ============================================================ */
window.App = window.App || {};

App.UIGiorno = {
  disegna: function (c) {
    var U = App.Utils, S = App.Stato, UC = App.UIComune;
    var iso = S.giornoAperto || U.oggi();
    S.giornoAperto = iso;
    var g = S.giorno(iso) || { pasti: {}, attivita: [], ipo: [], boliExtra: [], basale: null, note: '' };
    var self = this;

    // --- Navigazione tra i giorni ---
    var diff = Math.round((U.daISO(iso) - U.daISO(U.oggi())) / 86400000);
    var nomeRel = diff === 0 ? 'Oggi' : diff === -1 ? 'Ieri' : diff === 1 ? 'Domani' : '';
    var nav = U.el(
      '<div class="nav-giorno">' +
        '<button class="btn-icona" data-az="prec" aria-label="Giorno precedente">◀</button>' +
        '<label class="data" style="margin:0;color:inherit;cursor:pointer">' + (nomeRel || U.formattaData(iso)) +
          '<small>' + (nomeRel ? U.formattaData(iso) : 'tocca per cambiare data') + '</small>' +
          '<input type="date" class="nascosto" value="' + iso + '"></label>' +
        '<button class="btn-icona" data-az="succ" aria-label="Giorno successivo">▶</button>' +
      '</div>');
    nav.querySelector('[data-az=prec]').onclick = function () { self.vaiA(U.aggiungiGiorni(iso, -1)); };
    nav.querySelector('[data-az=succ]').onclick = function () { self.vaiA(U.aggiungiGiorni(iso, 1)); };
    var inData = nav.querySelector('input[type=date]');
    nav.querySelector('.data').onclick = function (e) {
      if (e.target === inData) return;
      if (inData.showPicker) { try { inData.showPicker(); return; } catch (err) { /* continua */ } }
      inData.classList.remove('nascosto'); inData.focus();
    };
    inData.onchange = function () { if (inData.value) self.vaiA(inData.value); };
    c.appendChild(nav);
    if (diff !== 0) {
      var torna = U.el('<div class="centro" style="margin-top:6px"><button class="btn btn-piccolo btn-contorno">↩ Torna a oggi</button></div>');
      torna.querySelector('button').onclick = function () { self.vaiA(U.oggi()); };
      c.appendChild(torna);
    }

    // --- Avviso parametri mancanti ---
    var mancanti = App.Sicurezza.mancantiGenerali();
    var pastiSenza = App.Config.pasti.filter(function (p) { return App.Parametri.mancanti(p.id).length; });
    if (mancanti.length || pastiSenza.length) {
      var avv = U.el('<div class="riquadro riquadro-avviso">⚙️ <b>Dose suggerita non ancora attiva.</b> ' +
        'Mancano: ' + U.esc(mancanti.concat(pastiSenza.length ? ['parametri di ' + pastiSenza.length + ' pasti'] : []).join(', ')) +
        '.<div style="margin-top:8px"><button class="btn btn-piccolo">Vai alle impostazioni</button></div></div>');
      avv.querySelector('button').onclick = function () { App.Nav.vai('impostazioni'); };
      c.appendChild(avv);
    }

    // --- Insulina attiva adesso (solo per oggi) ---
    if (diff === 0) {
      var iob = App.InsulinaAttiva.calcola(iso, Date.now());
      if (iob.disponibile && iob.totale > 0) {
        c.appendChild(U.el('<div class="riquadro riquadro-info">⏳ Insulina rapida ancora attiva adesso: <b>' +
          U.dec(iob.totale, 1) + ' U</b></div>'));
      }
    }

    // --- Pasti ---
    c.appendChild(U.el('<div class="sezione"><h2>Pasti</h2></div>'));
    var griglia = U.el('<div class="griglia-pasti"></div>');
    App.Config.pasti.forEach(function (p) {
      var dati = g.pasti[p.id];
      var bozza = App.Diario.leggiBozza(iso, p.id);
      var card;
      if (dati) {
        var tot = App.Nutrienti.totali(dati.voci);
        var nomi = (dati.voci || []).map(function (v) { return v.nome; }).join(', ');
        card = U.el('<div class="card card-cliccabile">' +
          '<div class="pasto-testa"><span class="pasto-icona">' + p.icona + '</span>' +
          '<div class="cresce" style="flex:1;min-width:0"><div class="pasto-nome">' + p.nome + ' <small class="tenue">' + U.esc(dati.ora) + '</small></div>' +
          (nomi ? '<small class="tenue" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + U.esc(nomi) + '</small>' : '') +
          '</div></div>' +
          '<div class="pasto-dati">' + UC.chipGlicemia(dati.glicemia) +
          (tot.carb ? '<span class="chip">🍞 ' + U.dec(tot.carb, 0) + ' g CHO</span>' : '') +
          (dati.dose != null ? UC.chipDose(dati.dose) : '<span class="chip">💉 dose non inserita</span>') +
          (bozza ? '<span class="chip chip-g-alta">✏️ modifiche non salvate</span>' : '') +
          '</div></div>');
      } else {
        card = U.el('<div class="card card-cliccabile ' + (bozza ? '' : 'card-vuota') + '">' +
          '<div class="pasto-testa"><span class="pasto-icona">' + p.icona + '</span>' +
          '<div style="flex:1"><div class="pasto-nome">' + p.nome + '</div>' +
          (bozza ? '<small style="color:var(--arancio)">✏️ bozza non salvata</small>' : '<small>＋ tocca per inserire</small>') +
          '</div></div></div>');
      }
      card.onclick = function () { App.UIPasto.apri(iso, p.id); };
      griglia.appendChild(card);
    });
    c.appendChild(griglia);

    // --- Attività, basale, boli extra, ipoglicemie, note ---
    App.UIGiornoExtra.disegnaSezioni(c, iso, g);
  },

  vaiA: function (iso) {
    App.Stato.giornoAperto = iso;
    App.Nav.disegna();
    window.scrollTo(0, 0);
  }
};
