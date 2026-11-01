# NOVITÀ — DiabEat (ex Diario Insulina)

## v1.9 — 01/11/2026
- **Pasto sbagliato? Spostalo:** nella finestra del pasto, sotto ora e glicemia, il pulsante "🔁 Pasto sbagliato? Spostalo in un altro pasto" porta ora, glicemia, cibi, dose e note in un altro pasto dello stesso giorno (es. da cena a spuntino prenanna). Funziona sia con i pasti salvati sia con quelli ancora da salvare; se il pasto di arrivo è già compilato chiede prima di sostituirlo.

File: js/servizi/diario.js, js/ui/ui-pasto.js, js/config.js, sw.js, MAPPA.md.

## v1.8.1 — 01/11/2026
- **Ricerca dei prodotti in commercio più affidabile:** la vecchia ricerca per nome di Open Food Facts va spesso in errore. Ora l'app interroga insieme tre motori di ricerca di Open Food Facts e usa il primo che trova prodotti; se un motore dà solo il nome, i valori nutrizionali vengono letti dalla scheda del prodotto.
- Se la ricerca non riesce: pulsante **🔄 Riprova** e una riga di dettagli tecnici (utile per capire il problema).

File: js/servizi/open-food-facts.js, js/ui/ui-pasto-cibi.js, js/config.js, sw.js.

## v1.8 — 01/11/2026
- **Aggiornamenti sicuri:** con internet l'app prende sempre i file nuovi dal sito ("prima la rete"); senza internet usa la copia sul telefono. Prima il telefono poteva restare su una versione vecchia.
- **Impostazioni → 🔄 Aggiorna app:** mostra la versione in uso e forza l'aggiornamento (i dati non si toccano).

File: sw.js, js/avvio.js, js/ui/ui-impostazioni.js, js/config.js, MAPPA.md.

## v1.7 — 01/11/2026
- **Prodotti in commercio per nome e marca:** nella ricerca dei cibi, il pulsante "🌐 Cerca … tra i prodotti in commercio" (o Invio sulla tastiera) cerca su Open Food Facts i prodotti venduti in Italia, es. "gnocchi patarò", "oro saiwa". Toccandone uno viene salvato nel tuo archivio (con la porzione della confezione) e si sceglie la quantità. Serve internet; Open Food Facts permette circa 10 ricerche al minuto.

File: js/servizi/open-food-facts.js, js/ui/ui-pasto-cibi.js, js/ui/ui-scanner.js, js/config.js, sw.js, MAPPA.md.

## v1.6 — 01/11/2026
- **Report per la diabetologa** (Statistiche, in fondo): periodo a scelta 7, 14 o 30 giorni; il PDF ora riporta per ogni pasto **glicemia, cibi con quantità e grammi, carboidrati e unità di insulina fatte** (con la dose suggerita se diversa), più boli extra, ipoglicemie, attività, stato d'animo e note.
- **Nome sul report** (facoltativo), salvato per le volte successive.
- **📤 Invia:** sul telefono apre il menu "Condividi" (WhatsApp, email, Drive…) con il PDF già allegato.

File: js/stampa/stampa-report.js, js/stampa/stampa-base.js, js/ui/ui-statistiche.js, js/config.js, sw.js, MAPPA.md.

## v1.5 — 01/11/2026
- **Cibi recenti:** nella ricerca, a campo vuoto, i **20 cibi inseriti più di recente** con la quantità dell'ultima volta. Il pulsante verde (es. "＋ 1 piatto") lo rimette uguale con un tocco; toccando il nome si apre la finestra già impostata con la stessa misura.
- **Codice a barre:** il prodotto trovato su Open Food Facts viene **salvato subito in archivio**, con la porzione indicata sulla confezione come "1 porzione". Se mancano dei valori, si apre il modulo per completarli dall'etichetta.
- **Aggiornamenti più rapidi:** quando c'è una versione nuova, l'app la scarica e si ricarica da sola, invece di aspettare l'apertura successiva.

File: js/avvio.js, sw.js, js/config.js, js/servizi/open-food-facts.js, js/servizi/alimenti.js, js/servizi/nutrienti.js, js/ui/ui-scanner.js, js/ui/ui-pasto-cibi.js, js/ui/ui-voce.js, MAPPA.md.

## v1.4 — 01/11/2026
- **Niente più categorie** dei cibi: un unico elenco, ordinato per pertinenza nella ricerca e alfabetico nell'archivio.
- **Unità di misura** per la quantità: grammi, ml, cucchiaio, tazza, piatto, mezzo piatto, numero (pezzi). Ogni cibo ha i suoi pesi (es. 1 piatto di pasta cotta = 230 g, 1 cucchiaio d'olio = 10 g, 1 uovo = 55 g). Se un peso manca, l'app lo chiede una volta e lo ricorda; se lo cambi, ricorda il nuovo.
- **Voce:** capisce anche "un piatto di pasta", "mezzo piatto di riso", "2 cucchiai di olio", "200 ml di latte".
- I cibi salvati con la v1.3 (unità casalinga) vengono convertiti da soli.

File: js/config.js, js/catalogo/porzioni.js, js/servizi/alimenti.js, js/servizi/nutrienti.js, js/servizi/voce-testo.js, js/ui/ui-pasto-cibi.js, js/ui/ui-archivio.js, js/ui/ui-alimento-form.js, js/ui/ui-scanner.js, js/ui/ui-voce.js, sw.js, MAPPA.md, LEGGIMI.txt.

## v1.3 — 31/10/2026
- **Porzioni casalinghe:** molti cibi hanno un'unità (1 uovo = 55 g, 1 tazza di latte = 200 g, 1 biscotto secco = 6 g…). Scegliendo il cibo compaiono i pulsanti "1 uovo, 2 uova…" o "½ tazza, 1 tazza, 1½ tazze…", e nel pasto si vede "2 uova · 110 g". Pesi indicativi, modificabili per ogni cibo (anche quelli nuovi).
- **Voce:** capisce "2 uova", "una tazza e mezza di latte", "mezza tazza di corn flakes", "3 biscotti", "una fetta di pane" e calcola i grammi.
- **Ricerca:** riconosce singolare e plurale (uova → uovo, mele → mela) e, a voce, preferisce i cibi usati di recente.

File: js/catalogo/porzioni.js (nuovo), js/servizi/alimenti.js, js/servizi/nutrienti.js, js/servizi/voce-testo.js, js/ui/ui-pasto-cibi.js, js/ui/ui-pasto.js, js/ui/ui-voce.js, js/ui/ui-alimento-form.js, js/config.js, index.html, sw.js, MAPPA.md, LEGGIMI.txt.

## v1.2.2 — 31/10/2026
- Nuova identità dell'app installata (`id` e `start_url` nel manifest), perché Android permetta di installare DiabEat anche se ricorda ancora la vecchia "Diario Insulina". Stesso indirizzo, stessi dati.

File: manifest.webmanifest, js/config.js, sw.js.

## v1.2.1 — 31/10/2026
- File dell'icona rinominati (`logo-192.png`, `logo-512.png`) perché Android riconosca il nuovo logo e aggiorni l'icona dell'app installata.

File: icone/logo-192.png, icone/logo-512.png, manifest.webmanifest, index.html, js/ui/navigazione.js, js/config.js, sw.js.

## v1.2 — 31/10/2026
- Nuovo nome **DiabEat** e nuovo logo: cerchio blu con forchetta blu al centro (icona, testata, schermata Home).
- PDF e backup si chiamano ora `diabeat_…`. I dati salvati non cambiano.

File: js/config.js, manifest.webmanifest, index.html, icone/logo-192.png, icone/logo-512.png, js/ui/navigazione.js, css/base.css, js/stampa/stampa-report.js, js/dati/backup.js, sw.js, LEGGIMI.txt, MAPPA.md.

## v1.1 — 31/10/2026
- Dose suggerita calcolata solo con il **rapporto insulina/carboidrati**, uno per tutta la giornata. Tolti fattore di sensibilità, obiettivo e correzione automatica. Se avevi lo stesso rapporto in tutti i pasti, viene recuperato.
- **Pasti ricchi di grassi o proteine:** riquadro con la strategia suggerita (dose normale prima del pasto, controllo dopo 2-3 ore, dose aggiuntiva indicativa del 20% se la glicemia sale, osservazione fino a 6 ore), pulsante per registrare la dose aggiuntiva, avviso nel diario, conteggio nelle statistiche e nel PDF.
- **Stato d'animo:** uno solo al giorno, scelto in cima al diario.
- **Attività:** si registrano con intensità bassa, media o alta; nessuna percentuale.
- **Basale:** tolta dal diario, dalle statistiche e dal PDF.
- Durata d'azione della rapida ora facoltativa (solo per l'informazione sull'insulina ancora attiva).

File: js/config.js, js/core/stato.js, js/servizi/parametri.js, js/servizi/sicurezza.js, js/servizi/calcolo-bolo.js, js/servizi/pasto-grasso.js (nuovo), js/servizi/diario.js, js/servizi/statistiche.js, js/servizi/nutrienti.js, js/ui/ui-comune.js, js/ui/ui-giorno.js, js/ui/ui-giorno-extra.js, js/ui/ui-pasto.js, js/ui/ui-calcolo.js, js/ui/ui-parametri.js, js/ui/ui-attivita-umori.js, js/ui/ui-impostazioni.js, js/ui/ui-statistiche.js, js/stampa/stampa-report.js, index.html, sw.js, LEGGIMI.txt, MAPPA.md.

## v1.0 — 31/10/2026
Prima versione.
- Diario giornaliero con sei pasti, attività, basale, boli extra, ipoglicemie e note.
- Calcolo della dose suggerita con i parametri per pasto, insulina ancora attiva, % per attività e stato d'animo, blocchi di sicurezza (soglia ipo, dose massima). Il calcolo è mostrato passo per passo.
- Bozze dei pasti non salvati, conservate anche dopo la chiusura.
- Archivio cibi con catalogo iniziale, categorie (primi per primi), ricerca, cibi recenti, cibi personali e correzioni.
- Codice a barre con fotocamera e Open Food Facts.
- Inserimento dei cibi a voce o con una frase scritta.
- Modelli di pasto.
- Statistiche (media, tempo nel range, ipo, insulina, carboidrati, glicemie per pasto, umore e attività) e PDF per il diabetologo.
- Backup JSON, installazione sul telefono e uso offline.

File: tutti (prima consegna).
