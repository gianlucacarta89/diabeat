/* ============================================================
   catalogo/alimenti-secondi.js — Catalogo iniziale: SECONDI.
   Formato di ogni riga: [nome, carboidrati, proteine, grassi] per 100 g.
   Valori medi indicativi (tabelle CREA ed etichette comuni): da controllare.
   Dipende da: nulla. Usato da: servizi/alimenti.js.
   ============================================================ */
window.App = window.App || {};
App.Catalogo = App.Catalogo || {};

App.Catalogo.secondo = [
  // Carne (cruda, salvo indicazione)
  ['Petto di pollo, crudo', 0, 23, 1],
  ['Petto di pollo, ai ferri', 0, 30, 2.5],
  ['Coscia di pollo senza pelle, cruda', 0, 19, 5],
  ['Fesa di tacchino, cruda', 0, 24, 1.2],
  ['Manzo magro (fesa), crudo', 0, 21, 3],
  ['Costata di manzo, cruda', 0, 19, 11],
  ['Carne macinata di manzo, cruda', 0, 19, 12],
  ['Hamburger di manzo, crudo', 1, 18, 15],
  ['Vitello (fesa), crudo', 0, 21, 3],
  ['Lonza di maiale, cruda', 0, 21, 5],
  ['Salsiccia di maiale, cruda', 1, 15, 25],
  ['Agnello, crudo', 0, 20, 9],
  ['Coniglio, crudo', 0, 21, 5],
  // Uova
  ['Uovo di gallina intero', 0.5, 12.5, 9],
  ['Albume d\'uovo', 0.7, 11, 0.2],
  // Pesce (crudo, salvo indicazione)
  ['Salmone fresco, crudo', 0, 20, 12],
  ['Salmone affumicato', 0.5, 23, 6],
  ['Tonno al naturale, sgocciolato', 0, 25, 1],
  ['Tonno sott\'olio, sgocciolato', 0, 25, 10],
  ['Merluzzo o nasello, crudo', 0, 17, 0.5],
  ['Orata, cruda', 0, 20, 6],
  ['Branzino (spigola), crudo', 0, 19, 4],
  ['Sgombro, crudo', 0, 17, 11],
  ['Pesce spada, crudo', 0, 19.5, 4],
  ['Gamberi, crudi', 0, 17, 1],
  ['Calamari, crudi', 1, 14, 1.5],
  ['Cozze, sgusciate', 3, 12, 2.5],
  ['Bastoncini di pesce impanati', 19, 12.5, 9],
  // Salumi
  ['Prosciutto crudo', 0, 26, 18],
  ['Prosciutto cotto', 1, 19, 9],
  ['Bresaola', 0.5, 32, 2.5],
  ['Speck', 0.5, 28, 20],
  ['Mortadella', 1, 15, 28],
  ['Salame', 1, 25, 32],
  // Formaggi
  ['Mozzarella di vacca', 1, 18.5, 19.5],
  ['Ricotta di vacca', 3.5, 9, 11],
  ['Parmigiano Reggiano', 0, 33, 28],
  ['Grana Padano', 0, 33, 29],
  ['Pecorino', 0, 26, 32],
  ['Stracchino o crescenza', 0, 16, 22],
  ['Fiocchi di latte', 3, 12, 4.5],
  ['Formaggio fresco spalmabile', 4, 5.5, 21],
  ['Feta', 1, 16, 22],
  // Legumi e vegetali proteici
  ['Ceci secchi, crudi', 47, 21, 6],
  ['Ceci in scatola, sgocciolati', 16, 7, 2.5],
  ['Fagioli borlotti secchi, crudi', 47.5, 20, 2],
  ['Fagioli borlotti in scatola, sgocciolati', 15, 7, 0.5],
  ['Fagioli cannellini in scatola, sgocciolati', 14, 6.5, 0.5],
  ['Lenticchie secche, crude', 51, 23, 2.5],
  ['Lenticchie in scatola, sgocciolate', 13, 7, 0.5],
  ['Tofu', 2, 13, 7.5]
];
