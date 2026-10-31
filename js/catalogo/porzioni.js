/* ============================================================
   catalogo/porzioni.js — Unità di misura casalinghe del catalogo.
   Formato: 'Nome del cibo come nel catalogo': [unità, plurale, grammi per unità].
   Pesi indicativi (porzioni medie): ogni valore si corregge dal cibo in archivio.
   Dipende da: nulla. Usato da: servizi/alimenti.js.
   ============================================================ */
window.App = window.App || {};
App.Catalogo = App.Catalogo || {};

App.Catalogo.porzioni = {
  // Uova e latticini
  'Uovo di gallina intero': ['uovo', 'uova', 55],
  'Albume d\'uovo': ['albume', 'albumi', 33],
  'Mozzarella di vacca': ['mozzarella', 'mozzarelle', 125],
  'Latte intero': ['tazza', 'tazze', 200],
  'Latte parzialmente scremato': ['tazza', 'tazze', 200],
  'Latte scremato': ['tazza', 'tazze', 200],
  'Bevanda di soia senza zucchero': ['tazza', 'tazze', 200],
  'Bevanda di avena': ['tazza', 'tazze', 200],
  'Yogurt bianco intero': ['vasetto', 'vasetti', 125],
  'Yogurt alla frutta': ['vasetto', 'vasetti', 125],
  'Yogurt greco 0% grassi': ['vasetto', 'vasetti', 150],
  'Yogurt greco intero': ['vasetto', 'vasetti', 150],
  // Colazione
  'Biscotti secchi': ['biscotto', 'biscotti', 6],
  'Biscotti frollini': ['biscotto', 'biscotti', 10],
  'Fette biscottate': ['fetta', 'fette', 9],
  'Cornetto vuoto': ['cornetto', 'cornetti', 55],
  'Cornetto alla marmellata': ['cornetto', 'cornetti', 65],
  'Corn flakes': ['tazza', 'tazze', 30],
  'Muesli': ['tazza', 'tazze', 40],
  'Fiocchi d\'avena': ['cucchiaio', 'cucchiai', 10],
  'Zucchero': ['cucchiaino', 'cucchiaini', 5],
  'Miele': ['cucchiaino', 'cucchiaini', 7],
  'Marmellata': ['cucchiaino', 'cucchiaini', 8],
  'Crema spalmabile alle nocciole': ['cucchiaio', 'cucchiai', 15],
  // Pane e sostituti
  'Pane comune (tipo 0/00)': ['fetta', 'fette', 30],
  'Pane integrale': ['fetta', 'fette', 30],
  'Pane di semola di grano duro': ['fetta', 'fette', 30],
  'Pane in cassetta': ['fetta', 'fette', 25],
  'Gallette di riso': ['galletta', 'gallette', 8],
  'Cracker salati': ['pacchetto', 'pacchetti', 25],
  'Grissini': ['grissino', 'grissini', 6],
  'Taralli': ['tarallo', 'taralli', 6],
  // Frutta (parte edibile)
  'Mela': ['mela', 'mele', 150],
  'Pera': ['pera', 'pere', 150],
  'Banana': ['banana', 'banane', 120],
  'Arancia': ['arancia', 'arance', 150],
  'Mandarino': ['mandarino', 'mandarini', 70],
  'Clementina': ['clementina', 'clementine', 60],
  'Kiwi': ['kiwi', 'kiwi', 75],
  'Pesca': ['pesca', 'pesche', 150],
  'Albicocche': ['albicocca', 'albicocche', 40],
  'Prugne (susine)': ['prugna', 'prugne', 40],
  'Fichi': ['fico', 'fichi', 50],
  'Cachi': ['caco', 'cachi', 180],
  'Datteri secchi': ['dattero', 'datteri', 8],
  // Bevande
  'Succo d\'arancia 100%': ['bicchiere', 'bicchieri', 200],
  'Succo di frutta (nettare)': ['bicchiere', 'bicchieri', 200],
  'Cola classica': ['lattina', 'lattine', 330],
  'Bibita zero o light': ['lattina', 'lattine', 330],
  'Tè freddo zuccherato': ['bicchiere', 'bicchieri', 200],
  'Birra chiara': ['bottiglia', 'bottiglie', 330],
  'Vino': ['bicchiere', 'bicchieri', 125],
  // Condimenti
  'Olio extravergine d\'oliva': ['cucchiaio', 'cucchiai', 10],
  // Altro
  'Pizza margherita': ['pizza', 'pizze', 300],
  'Hamburger di manzo, crudo': ['hamburger', 'hamburger', 100],
  'Salsiccia di maiale, cruda': ['salsiccia', 'salsicce', 100],
  'Bastoncini di pesce impanati': ['bastoncino', 'bastoncini', 25],
  'Patate, crude': ['patata', 'patate', 150],
  'Gelato alla crema': ['pallina', 'palline', 40],
  'Cioccolato fondente 70%': ['quadretto', 'quadretti', 5],
  'Cioccolato al latte': ['quadretto', 'quadretti', 5]
};
