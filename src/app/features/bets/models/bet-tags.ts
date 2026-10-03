export const LEAGUE_TAGS = ['Sin clasificar','NFL','MLB','MLS','KBO','Fútbol Europeo','Selecciones','Liga MX','Mixto','Otro'];
export const MARKET_TAGS = ['Sin clasificar','ML','Over','Under','Hándicap','Ambos anotan','Mixto','Otro','Over goles','Under goles','Empate','Over carreras','Under carreras','Run line','Over puntos','Under puntos','Spread puntos','Goles','Córners','Tarjetas','Carreras','Puntos','Hándicap asiático'];
export const SPORT_TAGS = ['Fútbol','Béisbol','Americano','Mixto','Otro','Sin clasificar'];
export interface TagFilter { sport: string; league: string; market: string }
export function matchesTags(bet: {sport_tag?:string;league_tag?:string;market_tag?:string}, filter: TagFilter) {
  return (!filter.sport || (bet.sport_tag ?? 'Sin clasificar') === filter.sport) &&
    (!filter.league || (bet.league_tag ?? 'Sin clasificar') === filter.league) &&
    (!filter.market || (bet.market_tag ?? 'Sin clasificar') === filter.market);
}

export const SPORT_BY_LEAGUE: Record<string,string> = {NFL:'Americano',MLB:'Béisbol',KBO:'Béisbol',MLS:'Fútbol','Selecciones':'Fútbol','Fútbol Europeo':'Fútbol','Liga MX':'Fútbol',Mixto:'Mixto',Otro:'Otro','Sin clasificar':'Sin clasificar'};
export const MARKETS_BY_SPORT: Record<string,string[]> = {
  'Fútbol':['Goles','Córners','Tarjetas','Hándicap asiático','ML','Empate','Over goles','Under goles','Ambos anotan','Hándicap'],
  'Béisbol':['Carreras','Hándicap','ML','Over carreras','Under carreras','Run line'],
  'Americano':['Puntos','Hándicap','ML','Over puntos','Under puntos','Spread puntos'],
};
export function sportForLeague(league: string) { return SPORT_BY_LEAGUE[league] ?? 'Sin clasificar'; }
export function marketsForLeague(league: string, legacy = '') {
  const options = ['Sin clasificar', ...(MARKETS_BY_SPORT[sportForLeague(league)] ?? ['ML','Over','Under','Hándicap']), 'Mixto','Otro'];
  // Old generic Over/Under remain explicit until the user classifies them.
  return ['Over','Under','Hándicap'].includes(legacy) && !options.includes(legacy) ? [...options,legacy] : options;
}
export function marketLabel(market: string) { return market === 'ML' ? 'Moneyline (ML)' : ['Over','Under'].includes(market) ? market + ' · sin unidad registrada' : market; }
