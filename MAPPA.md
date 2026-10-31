# MAPPA — Diario Insulina v1.0

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
Nome, versione, nome archivio, **pasti**, **categorie** (ordine = priorità di ricerca), attività e stati d'animo di partenza, **limiti dei valori accettati**, passi penna, range statistiche, soglia promemoria grassi, Open Food Facts, testi (premessa, **regole del calcolo mostrate nell'app**, avviso voce, avviso catalogo).

## js/core/ (base comune, core 1.0)
| File | Funzioni principali |
|---|---|
| `utils.js` | `esc`, `id`, date (`oggi`, `dataISO`, `aggiungiGiorni`, `formattaData`, `momento`), `numero` (accetta la virgola), `arrotonda`, `dec`, `normalizza`, `scarica`, `el` |
| `archivio.js` | `apri` (IndexedDB, riserva localStorage; `?archivio=locale` la forza), `leggi`, `scrivi` |
| `stato.js` | `dati` in memoria, `impostazioniIniziali` (parametri dose VUOTI), `completa`, `carica`, `salva(chiavi)`, `giorno`, `assicuraGiorno`, `pulisciGiorno` |
| `avvisi.js` | `toast`, `finestra` (sovrapponibili), `conferma` → Promise |

## js/catalogo/ (catalogo iniziale, righe `[nome, carb, prot, grassi]` per 100 g)
`alimenti-primi.js`, `alimenti-secondi.js`, `alimenti-contorni.js`, `alimenti-antipasti-dolci.js`, `alimenti-altro.js` (pane, colazione, frutta, bevande, condimenti).

## js/servizi/ (logica, senza interfaccia)
| File | Funzioni principali | Usato da |
|---|---|---|
| `sicurezza.js` | `controlla` (limiti di config), `glicemia`, `grammi`, `dose`, `macro`, `ora`, `sottoSoglia`, `oltreMassimo`, `mancantiGenerali` | tutto |
| `parametri.js` | `di(pasto)`, `mancanti`, `salva` (con **storico**), `inData` | Impostazioni → Parametri per pasto |
| `nutrienti.js` | `per`, `voce` (copia i valori nel pasto), `aggiornaGrammi`, `totali`, `pastoGrasso` | pasto, modelli |
| `alimenti.js` | `catalogo`, `tutti`, `cerca` (punteggio + priorità categoria), `recenti`, `salva`, `elimina` (catalogo = nascosto), `ripristina`, `perCodice` | Archivio, ricerca cibi, voce, scanner |
| `modelli.js` | `tutti`, `salva`, `elimina`, `vociDa`, `carboidrati` | Archivio → Modelli, pulsante 📋 Modello |
| `insulina-attiva.js` | `boli`, `calcola` (modello lineare sulla durata impostata) | calcolo, riquadro "insulina attiva adesso" |
| `calcolo-bolo.js` | **`calcola`: tutte le regole della dose** (ipo → parametri → carboidrati → correzione → insulina attiva → % attività/umore → arrotondamento → avvisi) | riquadro del calcolo |
| `diario.js` | `salvaPasto`, `eliminaPasto`, **bozze** (`leggiBozza`, `salvaBozza`, `togliBozza`), `aggiungiAttivita`, `aggiungiIpo`, `aggiungiBoloExtra`, `rimuovi`, `salvaBasale`, `ultimaBasale`, `salvaNote`, `cancellaDiario` | Diario |
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
| `ui-giorno.js` | scheda **Diario**: navigazione tra i giorni, avviso parametri mancanti, insulina attiva adesso, sei pasti |
| `ui-giorno-extra.js` | nel Diario: **Attività, Basale, Boli extra, Ipoglicemie, Note** e le loro finestre |
| `ui-pasto.js` | finestra del **pasto** (ora, glicemia, cibi, attività, umore, dose, note, salva/elimina/scarta bozza) |
| `ui-calcolo.js` | riquadro **Dose** nel pasto (passaggi, dose suggerita, avvisi, "Come si calcola") |
| `ui-pasto-cibi.js` | pulsanti **🔍 Cerca** (ricerca + recenti), finestra **grammi**, **📋 Modello** |
| `ui-voce.js` | pulsante **🎤 Voce** (consenso, microfono, frase scritta, conferma cibi) |
| `ui-scanner.js` | pulsanti **📷 Codice** / **📷 Codice a barre** |
| `ui-alimento-form.js` | finestra **Nuovo cibo / Modifica cibo / Controlla il prodotto** |
| `ui-archivio.js` | scheda **Archivio** → Cibi (ricerca, categorie, modifica, elimina, ripristina) |
| `ui-modelli.js` | scheda **Archivio** → Modelli di pasto |
| `ui-statistiche.js` | scheda **Statistiche** |
| `ui-impostazioni.js` | scheda **Impostazioni**: Insuline, Sicurezza, Dati e backup, Cancella diario, voce |
| `ui-parametri.js` | Impostazioni → **Parametri per pasto** (+ Copia a tutti, storico) |
| `ui-attivita-umori.js` | Impostazioni → **Attività e stati d'animo** (% di correzione) |

## js/avvio.js
Sempre l'ultimo: apre l'archivio, carica i dati, disegna, registra `sw.js` solo se aperta da https.

## Dati salvati (chiavi dell'archivio)
`impostazioni`, `alimenti` (personali e correzioni del catalogo), `modelli` → permanenti.
`giorni` (`{ 'AAAA-MM-GG': { pasti, attivita, basale, ipo, boliExtra, note } }`), `bozze` → diario.
