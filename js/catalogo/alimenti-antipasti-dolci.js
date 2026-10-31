/* ============================================================
   catalogo/alimenti-antipasti-dolci.js — Catalogo iniziale:
   ANTIPASTI e DOLCI.
   Formato di ogni riga: [nome, carboidrati, proteine, grassi] per 100 g.
   Valori medi indicativi (tabelle CREA ed etichette comuni): da controllare.
   Dipende da: nulla. Usato da: servizi/alimenti.js.
   ============================================================ */
window.App = window.App || {};
App.Catalogo = App.Catalogo || {};

App.Catalogo.antipasto = [
  ['Bruschetta al pomodoro', 30, 5, 6],
  ['Olive verdi in salamoia', 1, 1, 15],
  ['Hummus di ceci', 12, 7, 17],
  ['Taralli', 64, 9, 18],
  ['Patatine in busta', 51, 6, 33],
  ['Mandorle', 4.6, 22, 55],
  ['Noci', 5.1, 14.3, 68],
  ['Arachidi tostate', 8.5, 29, 50],
  ['Pistacchi', 8.1, 18.1, 56]
];

App.Catalogo.dolce = [
  ['Tiramisù', 30, 6, 16],
  ['Gelato alla crema', 23, 4, 9],
  ['Sorbetto alla frutta', 28, 0.5, 0.5],
  ['Torta da forno (ciambellone)', 55, 6, 15],
  ['Crostata di marmellata', 63, 5.5, 15],
  ['Panettone', 54, 7, 15],
  ['Pandoro', 55, 7.5, 20],
  ['Cioccolato fondente 70%', 34, 9.5, 42],
  ['Cioccolato al latte', 56, 7, 32],
  ['Crema spalmabile alle nocciole', 57.5, 6.3, 31],
  ['Budino al cioccolato', 21, 3, 3]
];
