export interface SelectionDetail { source_text?:string; sport:string; market:string; pick:string; line:number|null; description:string; game_id:string; event_label:string }
export const SELECTION_MARKETS: Record<string,string[]> = {
  'Fútbol':['ML','Goles','Córners','Tarjetas','Hándicap asiático','Hándicap','Ambos anotan','Otro'],
  'Béisbol':['ML','Carreras','Hándicap','Hits','Ponches','Otro'],
  'Americano':['ML','Puntos','Hándicap','Yardas','Otro'],
  'Básquetbol':['ML','Puntos','Hándicap','Triples','Rebotes','Asistencias','Otro']
};
export function newSelection(sport='Fútbol'): SelectionDetail { const valid=Object.keys(SELECTION_MARKETS).includes(sport)?sport:'Fútbol'; return {sport:valid,market:'ML',pick:'Local',line:null,description:'',game_id:'',event_label:''}; }
export function selectionText(d:SelectionDetail) { return d.market==='Otro' ? 'Otro: '+d.description.trim() : [d.market==='ML'?'Moneyline':d.market,d.pick,d.line===null?'':String(d.line)].filter(Boolean).join(' · '); }
