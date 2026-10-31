/* ============================================================
   config.js — Impostazioni e REGOLE dell'app Diario Insulina.
   È l'unico file che cambia tra app "sorelle".
   Dipende da: nulla (è il primo file dopo le librerie).
   Usato da: tutti i moduli.
   ============================================================ */
window.App = window.App || {};

App.Config = {
  nome: 'Diario Insulina',
  versione: '1.0',
  // Nome dello spazio di salvataggio: deve essere diverso per ogni app.
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

  // Categorie dell'archivio cibi. L'ordine è la priorità nella ricerca:
  // i primi vengono per primi.
  categorie: [
    { id: 'primo',     nome: 'Primi',     icona: '🍝' },
    { id: 'secondo',   nome: 'Secondi',   icona: '🍗' },
    { id: 'contorno',  nome: 'Contorni',  icona: '🥗' },
    { id: 'antipasto', nome: 'Antipasti', icona: '🧀' },
    { id: 'dolce',     nome: 'Dolci',     icona: '🍰' },
    { id: 'altro',     nome: 'Altro', icona: '🥖', descrizione: 'pane, frutta, colazione, bevande, condimenti' }
  ],

  // Attività della giornata. La % di correzione la imposta l'utente:
  // finché è vuota, l'attività si registra ma non cambia la dose.
  attivitaPredefinite: [
    { id: 'pesi',     nome: 'Allenamento pesi',           icona: '🏋️' },
    { id: 'calcio',   nome: 'Allenamento calcio',         icona: '⚽' },
    { id: 'partita',  nome: 'Partita di calcio',          icona: '🏟️' },
    { id: 'trekking', nome: 'Trekking',                   icona: '🥾' },
    { id: 'scuola',   nome: 'Lavoro a scuola',            icona: '🏫' },
    { id: 'personal', nome: 'Lavoro da personal trainer', icona: '💪' }
  ],
  intensita: ['bassa', 'media', 'alta'],

  // Stati d'animo. Correzione di partenza: nessuna.
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
    sensibilita: { min: 5,  max: 400,  unita: 'mg/dL per 1 U' },
    obiettivo:   { min: 70, max: 200,  unita: 'mg/dL' },
    durataOre:   { min: 2,  max: 8,    unita: 'ore' },
    sogliaIpo:   { min: 50, max: 100,  unita: 'mg/dL' },
    doseMax:     { min: 1,  max: 60,   unita: 'U' },
    correzione:  { min: -80, max: 80,  unita: '%' },
    macro:       { min: 0,  max: 100,  unita: 'g per 100 g' }
  },

  // Grammi di grassi nel pasto oltre i quali compare il promemoria
  // "la glicemia può salire ore dopo". Non cambia la dose.
  promemoriaGrassi: 40,

  // Passi possibili della penna.
  passiPenna: [0.5, 1],

  // Range delle statistiche (consenso internazionale sul "tempo nel range").
  // Serve solo alle statistiche, non al calcolo della dose.
  rangeStatistiche: { basso: 70, alto: 180 },

  // Open Food Facts: database gratuito dei prodotti confezionati.
  openFoodFacts: {
    url: 'https://world.openfoodfacts.org/api/v2/product/',
    campi: 'product_name,product_name_it,brands,nutriments'
  },

  // Riconoscimento vocale.
  lingua: 'it-IT',

  testi: {
    premessa: 'L\'app fa i conti con i parametri che inserisci tu (meglio se concordati con il diabetologo). ' +
              'È un aiuto al calcolo: la decisione sulla dose resta tua.',
    regoleCalcolo: [
      'Dose per i carboidrati = carboidrati del pasto ÷ rapporto insulina/carboidrati del pasto.',
      'Correzione = (glicemia − obiettivo) ÷ fattore di sensibilità. Senza glicemia la correzione è 0.',
      'Se sei sopra l\'obiettivo, dalla correzione si toglie l\'insulina ancora attiva (mai sotto 0). Se sei sotto, la correzione negativa riduce la dose del pasto.',
      'Insulina ancora attiva: ogni bolo cala in modo lineare fino a zero nella durata d\'azione impostata.',
      'Alla somma si applicano le % delle attività spuntate e dello stato d\'animo (se le hai impostate).',
      'Il risultato si arrotonda al passo della penna. Sotto 0 diventa 0.',
      'Glicemia sotto la soglia di ipoglicemia: nessuna dose suggerita.',
      'Dose sopra il massimo impostato: avviso e conferma prima di salvarla.'
    ],
    avvisoVoce: 'Il riconoscimento vocale lo fa il telefono tramite i servizi di Google o Apple: ' +
                'la frase che detti passa da internet. Gli altri dati restano solo sul telefono. ' +
                'In alternativa puoi scrivere, o usare il microfono della tastiera, nel campo di testo.',
    avvisoCatalogo: 'Catalogo iniziale: valori medi per 100 g, indicativi, basati sulle tabelle di composizione ' +
                    'degli alimenti (CREA) e sulle etichette più comuni. Il "cotto" vale per cotture senza condimento. ' +
                    'Controlla i cibi che usi più spesso: ogni valore si può correggere. Per i prodotti confezionati ' +
                    'vale sempre l\'etichetta (usa il codice a barre).'
  }
};
