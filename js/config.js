/* ============================================================
   config.js — Impostazioni e REGOLE dell'app DiabEat (ex Diario Insulina).
   È l'unico file che cambia tra app "sorelle".
   Dipende da: nulla (è il primo file dopo le librerie).
   Usato da: tutti i moduli.
   ============================================================ */
window.App = window.App || {};

App.Config = {
  nome: 'DiabEat',
  versione: '1.12',
  // Nome dello spazio di salvataggio: deve essere diverso per ogni app.
  // NON cambiarlo: è quello della prima versione, cambiarlo farebbe sparire i dati salvati.
  nomeArchivio: 'diario-insulina-gc',

  // I sei pasti della giornata, nell'ordine in cui compaiono.
  pasti: [
    { id: 'colazione',          nome: 'Colazione',          icona: '☕', ora: '07:30' },
    { id: 'spuntinoMattina',    nome: 'Spuntino mattina',   icona: '🍎', ora: '10:30' },
    { id: 'pranzo',             nome: 'Pranzo',             icona: '🍝', ora: '13:30' },
    { id: 'spuntinoPomeriggio', nome: 'Spuntino pomeriggio', icona: '🥪', ora: '17:00' },
    { id: 'cena',               nome: 'Cena',               icona: '🍽️', ora: '20:30' },
    { id: 'spuntinoNotte',      nome: 'Spuntino prenanna',  icona: '🌙', ora: '23:00' }
  ],

  // Unità di misura per la quantità di un cibo. 'peso' = di quale misura del cibo
  // si usa il peso (vedi catalogo/porzioni.js); 'fattore' = quante volte quel peso.
  // grammi e ml non hanno bisogno di pesi (1 ml conta come 1 g: va bene per acqua, latte, succhi).
  unitaMisura: [
    { id: 'g',           nome: 'grammi',       uno: 'g',            molti: 'g',            rapidi: [30, 50, 80, 100, 150, 200] },
    { id: 'ml',          nome: 'ml',           uno: 'ml',           molti: 'ml',           rapidi: [50, 100, 150, 200, 250, 330] },
    { id: 'cucchiaio',   nome: 'cucchiaio',    uno: 'cucchiaio',    molti: 'cucchiai',     rapidi: [1, 2, 3, 4], peso: 'cucchiaio' },
    { id: 'tazza',       nome: 'tazza',        uno: 'tazza',        molti: 'tazze',        rapidi: [0.5, 1, 1.5, 2], peso: 'tazza' },
    { id: 'piatto',      nome: 'piatto',       uno: 'piatto',       molti: 'piatti',       rapidi: [1, 1.5, 2], peso: 'piatto' },
    { id: 'mezzoPiatto', nome: 'mezzo piatto', uno: 'mezzo piatto', molti: 'mezzi piatti', rapidi: [1], peso: 'piatto', fattore: 0.5 },
    { id: 'numero',      nome: 'numero',       uno: 'pezzo',        molti: 'pezzi',        rapidi: [1, 2, 3, 4, 5, 6], peso: 'numero' }
  ],

  // Attività della giornata: si registrano con ora, durata e intensità.
  // Non cambiano la dose: servono al diario e alle statistiche.
  attivitaPredefinite: [
    { id: 'pesi',     nome: 'Allenamento pesi',           icona: '🏋️' },
    { id: 'calcio',   nome: 'Allenamento calcio',         icona: '⚽' },
    { id: 'partita',  nome: 'Partita di calcio',          icona: '🏟️' },
    { id: 'trekking', nome: 'Trekking',                   icona: '🥾' },
    { id: 'scuola',   nome: 'Lavoro a scuola',            icona: '🏫' },
    { id: 'personal', nome: 'Lavoro da personal trainer', icona: '💪' }
  ],
  intensita: ['bassa', 'media', 'alta'],

  // Stati d'animo: uno al giorno. Non cambiano la dose.
  umoriPredefiniti: [
    { id: 'sereno',     nome: 'Sereno',          icona: '😌' },
    { id: 'normale',    nome: 'Normale',         icona: '🙂' },
    { id: 'stanco',     nome: 'Stanco',          icona: '😴' },
    { id: 'stressato',  nome: 'Stressato',       icona: '😣' },
    { id: 'ansioso',    nome: 'Ansioso',         icona: '😰' },
    { id: 'arrabbiato', nome: 'Arrabbiato',      icona: '😠' },
    { id: 'malato',     nome: 'Malato / febbre', icona: '🤒' }
  ],

  // Valori accettati: fuori da qui il dato viene rifiutato.
  limiti: {
    glicemia:    { min: 20, max: 600,  unita: 'mg/dL' },
    grammi:      { min: 1,  max: 2000, unita: 'g' },
    dose:        { min: 0,  max: 100,  unita: 'U' },
    rapportoIC:  { min: 1,  max: 150,  unita: 'g per 1 U' },
    fattoreCorrezione: { min: 5, max: 300, unita: 'mg/dL per 1 U' },
    obiettivo:   { min: 80, max: 180,  unita: 'mg/dL' },
    durataOre:   { min: 2,  max: 8,    unita: 'ore' },
    sogliaIpo:   { min: 50, max: 100,  unita: 'mg/dL' },
    doseMax:     { min: 1,  max: 60,   unita: 'U' },
    macro:       { min: 0,  max: 100,  unita: 'g per 100 g' }
  },

  // PASTO GRASSO O PROTEICO (vedi ricerca "Grassi e glicemia nel diabete di tipo 1").
  // Il riquadro compare quando il pasto supera le soglie. La dose suggerita
  // NON cambia: la dose aggiuntiva è mostrata a parte, da valutare più tardi.
  pastoGrasso: {
    grassiMedio: 20,        // g di grassi: effetto lieve, solo controllo
    grassiAlto: 40,         // g di grassi: rialzo tardivo atteso (Bell 2020, Wolpert 2013)
    proteineAlte: 50,       // g di proteine: con almeno grassiMedio conta come pasto alto
    pctAggiuntiva: 20,      // % del bolo dei carboidrati, punto di partenza ISPAD 2022
    controlloDa: 2,         // ore dopo il pasto: primo controllo della glicemia
    controlloA: 3,          // ore dopo il pasto: fine della finestra per la dose aggiuntiva
    durataEffetto: 6,       // ore in cui tenere d'occhio la glicemia
    doseMinima: 1           // U: sotto questo bolo la % non ha senso (pasto con pochi carboidrati)
  },

  // Passi possibili della penna.
  passiPenna: [0.5, 1],

  // Range delle statistiche (consenso internazionale sul "tempo nel range").
  // Serve solo alle statistiche, non al calcolo della dose.
  rangeStatistiche: { basso: 70, alto: 180 },

  // Open Food Facts: database gratuito dei prodotti confezionati.
  openFoodFacts: {
    url: 'https://world.openfoodfacts.org/api/v2/product/',
    // Ricerca per nome: tre motori interrogati insieme (vince il primo che trova prodotti).
    urlRicerca: 'https://search.openfoodfacts.net/search',          // Search-a-licious (aggiornato, accetta le richieste dal sito)
    urlRicercaClassica: 'https://world.openfoodfacts.org/cgi/search.pl', // ricerca classica (spesso lenta o in errore 503)
    urlRicercaRiserva: 'https://search.openfoodfacts.org/search',   // Search-a-licious principale
    risultati: 24,
    campi: 'product_name,product_name_it,brands,nutriments,serving_quantity,serving_size'
  },

  // Obiettivi della glicemia per la correzione, scelti pasto per pasto (menu nella finestra del pasto).
  obiettiviGlicemia: [
    { id: 'riposo',  da: 90,  a: 110, nome: '90-110',  nota: 'giornata tranquilla, a riposo' },
    { id: 'normale', da: 110, a: 130, nome: '110-130', nota: 'giornata normale' },
    { id: 'sport',   da: 130, a: 160, nome: '130-160', nota: 'allenamento o partita in arrivo' }
  ],
  obiettivoPredefinito: 'normale',

  // Cibi che pesi crudi: se scrivi o dici solo "pasta" o "riso", la ricerca propone prima la versione cruda.
  pesatiCrudi: ['pasta', 'riso'],

  // Riconoscimento vocale.
  lingua: 'it-IT',

  testi: {
    premessa: 'L\'app fa i conti con i parametri che inserisci tu (meglio se concordati con il diabetologo). ' +
              'È un aiuto al calcolo: la decisione sulla dose resta tua.',
    regoleCalcolo: [
      'Dose suggerita = carboidrati del pasto ÷ rapporto insulina/carboidrati (uno solo per tutta la giornata).',
      'Correzione con la glicemia (solo se imposti il fattore di correzione): l\'obiettivo si sceglie in ogni pasto (90-110, 110-130, 130-160). Dentro l\'obiettivo nessuna correzione; sopra: (glicemia − limite alto) ÷ fattore in più; sotto: (limite basso − glicemia) ÷ fattore in meno. La dose non scende sotto 0.',
      'Se imposti la durata d\'azione, l\'insulina ancora attiva si toglie solo dalla correzione in aumento (per non sommare due correzioni).',
      'Il risultato si arrotonda al passo della penna.',
      'Glicemia sotto la soglia di ipoglicemia: la dose suggerita si calcola comunque (con la correzione, se attiva, che la riduce) e compare un avviso; la decisione è tua.',
      'Dose sopra il massimo impostato: avviso e conferma prima di salvarla.',
      'Pasto ricco di grassi o proteine: la dose suggerita non cambia; compare a parte una dose aggiuntiva indicativa da valutare dopo 2-3 ore.'
    ],
    avvisoVoce: 'Il riconoscimento vocale lo fa il telefono tramite i servizi di Google o Apple: ' +
                'la frase che detti passa da internet. Gli altri dati restano solo sul telefono. ' +
                'In alternativa puoi scrivere, o usare il microfono della tastiera, nel campo di testo.',
    avvisoCatalogo: 'Catalogo iniziale: valori medi per 100 g, indicativi, basati sulle tabelle di composizione ' +
                    'degli alimenti (CREA) e sulle etichette più comuni. Il "cotto" vale per cotture senza condimento. ' +
                    'Anche i pesi di cucchiaio, tazza, piatto e pezzo sono indicativi. ' +
                    'Controlla i cibi che usi più spesso: ogni valore si può correggere. Per i prodotti confezionati ' +
                    'vale sempre l\'etichetta (usa il codice a barre).'
  }
};
