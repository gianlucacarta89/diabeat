# MAPPA — Diario Insulina v1.1

Indice per modifiche chirurgiche: cerca qui il file giusto, poi apri solo quello.

## Radice
| File | Scopo |
|---|---|
| `index.html` | Scheletro della pagina e ordine di caricamento: librerie → config → core → catalogo → servizi → stampa → dati → ui → avvio |
| `manifest.webmanifest` | Nome, icona, colori per "Aggiungi a schermata Home" |
| `sw.js` | Copia offline dei file. **A ogni versione cambia `VERSIONE` e, se aggiungi file, la lista `FILE`** |
| `icone/` | Icona 192 e 512 px |
| `lib/` | jsPDF 2.5.1, jsPDF-AutoTable 3.8.2, html5-qrcode 2.3.8 (in locale) |

## CSS
| File | Scopo |
|---|---|
| `css/base.css` | Colori (anche colori per funzione: verde salva, rosso cancella, viola PDF, blu backup), testata, barra in basso, piè di pagina |
| `css/componenti.css` | Pulsanti, card, chip glicemia, campi, finestre, toast, riquadro del calcolo, statistiche, microfono |
| `css/schermi-grandi.css` | Tablet (pasti su 2 colonne, finestre centrate) e computer (barra in alto) |

## js/config.js
Nome, versione, nome archivio, **pasti**, **categorie** (ordine = priorità di ricerca), attività di partenza, intensità, **stati d'animo**, **limiti dei valori accettati**, **`pastoGrasso`** (soglie di grassi e proteine, % della dose aggiuntiva, orari dei controlli), passi penna, range statistiche, Open Food Facts, testi (premessa, **regole del calcolo mostrate nell'app**, avviso voce, avviso catalogo).

## js/core/ (base comune, core 1.0)
| File | Funzioni principali |
|---|---|
| `utils.js` | `esc`, `id`, date (`oggi`, `dataISO`, `aggiungiGiorni`, `formattaData`, `momento`), `numero` (accetta la virgola), `arrotonda`, `dec`, `normalizza`, `scarica`, `el` |
| `archivio.js` | `apri` (IndexedDB, riserva localStorage; `?archivio=locale` la forza), `leggi`, `scrivi` |
| `stato.js` | `dati` in memoria, `impostazioniIniziali` (rapporto I/C VUOTO), `completa` (migra i dati della v1.0), `carica`, `salva(chiavi)`, `giorno`, `assicuraGiorno`, `pulisciGiorno` |
| `avvisi.js` | `toast`, `finestra` (sovrapponibili), `conferma` → Promise |

## js/catalogo/ (catalogo iniziale, righe `[nome, carb, prot, grassi]` per 100 g)
`alimenti-primi.js`, `alimenti-secondi.js`, `alimenti-contorni.js`, `alimenti-antipasti-dolci.js`, `alimenti-altro.js` (pane, colazione, frutta, bevande, condimenti).

## js/servizi/ (logica, senza interfaccia)
| File | Funzioni principali | Usato da |
|---|---|---|
| `sicurezza.js` | `controlla` (limiti di config), `glicemia`, `grammi`, `dose`, `macro`, `ora`, `sottoSoglia`, `oltreMassimo`, `mancantiGenerali` (soglia ipo, dose max) | tutto |
| `parametri.js` | `rapportoIC`, `mancanti`, `salva` (con **storico**), `storico` | Impostazioni → Rapporto insulina/carboidrati |
| `nutrienti.js` | `per`, `voce` (copia i valori nel pasto), `aggiornaGrammi`, `totali` | pasto, modelli |
| `alimenti.js` | `catalogo`, `tutti`, `cerca` (punteggio + priorità categoria), `recenti`, `salva`, `elimina` (catalogo = nascosto), `ripristina`, `perCodice` | Archivio, ricerca cibi, voce, scanner |
| `modelli.js` | `tutti`, `salva`, `elimina`, `vociDa`, `carboidrati` | Archivio → Modelli, pulsante 📋 Modello |
| `insulina-attiva.js` | `boli`, `calcola` (modello lineare sulla durata impostata) | informazione nel calcolo, riquadro "insulina attiva adesso" |
| `pasto-grasso.js` | `livello` (nessuno/medio/alto), `valuta` (dose aggiuntiva indicativa, orari di controllo), `oraPiu` | **riquadro 🧈 pasto grasso**, chip nel diario, statistiche, PDF |
| `calcolo-bolo.js` | **`calcola`: tutte le regole della dose** (ipo → parametri → carboidrati ÷ I/C → arrotondamento → avvisi e informazioni → pasto grasso) | riquadro del calcolo |
| `diario.js` | `salvaPasto`, `eliminaPasto`, **bozze** (`leggiBozza`, `salvaBozza`, `togliBozza`), `salvaUmore` (uno al giorno), `aggiungiAttivita` (con intensità), `aggiungiIpo`, `aggiungiBoloExtra`, `rimuovi`, `salvaNote`, `cancellaDiario` | Diario |
| `voce-testo.js` | `analizza(frase)` → cibi + grammi + candidati; `parolaNumero`, `pezzo`, `dividi` | pulsante 🎤 Voce |
| `open-food-facts.js` | `cerca(codice)` | pulsante 📷 Codice |
| `statistiche.js` | `calcola(da, a)` | Statistiche, PDF |

## js/stampa/ (solo ASCII)
| File | Scopo |
|---|---|
| `stampa-base.js` | `pulisci` (filtro caratteri), `intestazione`, `titoloSezione`, `tabella`, `testo`, `salva` (doc.save) |
| `stampa-report.js` | pulsante **📄 Scarica PDF** in Statistiche → `crea(da, a)` |

## js/dati/
| File | Scopo |
|---|---|
| `backup.js` | pulsanti **⬇️ Esporta backup** / **⬆️ Importa backup** in Impostazioni |

## js/ui/ (un file per schermata o finestra)
| File | Schermata / pulsante |
|---|---|
| `navigazione.js` | testata, barra in basso (Diario · Archivio · Statistiche · Impostazioni), piè di pagina con versione |
| `ui-comune.js` | chip glicemia e dose, campi numerici, `errore`, nomi di pasti/attività/umori |
| `ui-giorno.js` | scheda **Diario**: navigazione tra i giorni, avviso parametri mancanti, insulina attiva adesso, **stato d'animo del giorno**, sei pasti (con chip 🧈 pasto grasso) |
| `ui-giorno-extra.js` | nel Diario: **Attività (con intensità), Boli extra, Ipoglicemie, Note** e le loro finestre; `finestraBolo` usata anche per la dose aggiuntiva del pasto grasso |
| `ui-pasto.js` | finestra del **pasto** (ora, glicemia, cibi, dose, note, salva/elimina/scarta bozza) |
| `ui-calcolo.js` | riquadro **Dose** nel pasto (passaggi, dose suggerita, avvisi, informazioni, **riquadro 🧈 pasto grasso** con pulsante "Registra la dose aggiuntiva", "Come si calcola") |
| `ui-pasto-cibi.js` | pulsanti **🔍 Cerca** (ricerca + recenti), finestra **grammi**, **📋 Modello** |
| `ui-voce.js` | pulsante **🎤 Voce** (consenso, microfono, frase scritta, conferma cibi) |
| `ui-scanner.js` | pulsanti **📷 Codice** / **📷 Codice a barre** |
| `ui-alimento-form.js` | finestra **Nuovo cibo / Modifica cibo / Controlla il prodotto** |
| `ui-archivio.js` | scheda **Archivio** → Cibi (ricerca, categorie, modifica, elimina, ripristina) |
| `ui-modelli.js` | scheda **Archivio** → Modelli di pasto |
| `ui-statistiche.js` | scheda **Statistiche** |
| `ui-impostazioni.js` | scheda **Impostazioni**: Rapporto I/C, Insulina rapida, Sicurezza, Attività, Dati e backup, Cancella diario, voce |
| `ui-parametri.js` | Impostazioni → **Rapporto insulina/carboidrati** (+ storico) |
| `ui-attivita-umori.js` | Impostazioni → **Le tue attività** (solo nomi; il nome del file è quello della v1.0) |

## js/avvio.js
Sempre l'ultimo: apre l'archivio, carica i dati, disegna, registra `sw.js` solo se aperta da https.

## Dati salvati (chiavi dell'archivio)
`impostazioni`, `alimenti` (personali e correzioni del catalogo), `modelli` → permanenti.
`giorni` (`{ 'AAAA-MM-GG': { pasti, umoreId, attivita, ipo, boliExtra, note } }`), `bozze` → diario. Eventuali `basale`, `attivitaIds` e `umoreId` dentro i pasti arrivano dalla v1.0 e non sono più usati.
