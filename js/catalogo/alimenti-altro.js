/* ============================================================
   catalogo/alimenti-altro.js — Catalogo iniziale: ALTRO
   (pane, colazione, frutta, bevande, condimenti).
   Formato di ogni riga: [nome, carboidrati, proteine, grassi] per 100 g.
   Valori medi indicativi (tabelle CREA ed etichette comuni): da controllare.
   Dipende da: nulla. Usato da: servizi/alimenti.js.
   ============================================================ */
window.App = window.App || {};
App.Catalogo = App.Catalogo || {};

App.Catalogo.altro = [
  // Pane e sostituti
  ['Pane comune (tipo 0/00)', 56, 8.5, 1],
  ['Pane integrale', 48, 9.5, 2],
  ['Pane di semola di grano duro', 54, 9, 1],
  ['Pane carasau', 75, 12, 2],
  ['Pane in cassetta', 49, 8, 4.5],
  ['Piadina', 51, 8, 12],
  ['Focaccia', 48, 8, 11],
  ['Grissini', 69, 12, 9],
  ['Cracker salati', 69, 9.5, 11],
  ['Gallette di riso', 79, 8, 3],
  // Colazione
  ['Fette biscottate', 73, 11.5, 6],
  ['Biscotti secchi', 76, 7.5, 11],
  ['Biscotti frollini', 69, 6.5, 20],
  ['Cornetto vuoto', 47, 8, 20],
  ['Cornetto alla marmellata', 51, 6.5, 16],
  ['Corn flakes', 84, 7, 0.9],
  ['Muesli', 63, 9, 6],
  ['Fiocchi d\'avena', 59, 13.5, 7],
  ['Latte intero', 4.9, 3.3, 3.6],
  ['Latte parzialmente scremato', 5, 3.5, 1.5],
  ['Latte scremato', 5.3, 3.6, 0.2],
  ['Bevanda di soia senza zucchero', 0.5, 3.3, 1.8],
  ['Bevanda di avena', 7, 1, 1.5],
  ['Yogurt bianco intero', 4.3, 3.8, 3.9],
  ['Yogurt greco 0% grassi', 4, 10, 0],
  ['Yogurt greco intero', 3.5, 9, 5],
  ['Yogurt alla frutta', 14, 3.3, 2.7],
  ['Zucchero', 100, 0, 0],
  ['Miele', 80, 0.5, 0],
  ['Marmellata', 58, 0.5, 0],
  // Frutta
  ['Mela', 11, 0.3, 0.2],
  ['Pera', 8.8, 0.3, 0.1],
  ['Banana', 15.4, 1.2, 0.3],
  ['Arancia', 7.8, 0.7, 0.2],
  ['Mandarino', 17.6, 0.9, 0.3],
  ['Clementina', 8.7, 0.9, 0.2],
  ['Kiwi', 9, 1.2, 0.6],
  ['Fragole', 5.3, 0.9, 0.4],
  ['Uva', 15.6, 0.5, 0.1],
  ['Pesca', 6.1, 0.8, 0.1],
  ['Albicocche', 6.8, 0.4, 0.1],
  ['Ciliegie', 9, 0.8, 0.1],
  ['Prugne (susine)', 10.5, 0.5, 0.1],
  ['Fichi', 11.2, 0.9, 0.2],
  ['Cachi', 16, 0.6, 0.3],
  ['Ananas', 10, 0.5, 0],
  ['Anguria', 3.7, 0.4, 0],
  ['Melone', 7.4, 0.8, 0.2],
  ['Mirtilli', 5.1, 0.9, 0.2],
  ['Datteri secchi', 63, 2.7, 0.6],
  ['Uvetta', 72, 1.9, 0.6],
  // Bevande
  ['Succo d\'arancia 100%', 9, 0.7, 0.1],
  ['Succo di frutta (nettare)', 13, 0.3, 0],
  ['Cola classica', 10.6, 0, 0],
  ['Bibita zero o light', 0, 0, 0],
  ['Tè freddo zuccherato', 7, 0, 0],
  ['Bevanda sportiva (isotonica)', 6, 0, 0],
  ['Birra chiara', 3.5, 0.5, 0],
  ['Vino', 0.2, 0.1, 0],
  // Condimenti e sughi
  ['Olio extravergine d\'oliva', 0, 0, 100],
  ['Burro', 1.1, 0.8, 83],
  ['Passata di pomodoro', 4.5, 1.3, 0.2],
  ['Ragù alla bolognese, pronto', 6, 6, 6],
  ['Pesto alla genovese', 6, 5, 48],
  ['Maionese', 1.5, 1.2, 75],
  ['Ketchup', 23, 1.2, 0.1]
];
