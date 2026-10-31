# NOVITÀ — DiabEat (ex Diario Insulina)

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
