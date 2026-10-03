export interface EfficiencyBet { status:string; sport_tag?:string; league_tag?:string; selection_details?:{sport:string}[] }
export function sportEfficiency(bets:EfficiencyBet[]) {
 const groups=new Map<string,{name:string;won:number;lost:number}>(['Fútbol','MLB','KBO','NFL'].map(name=>[name,{name,won:0,lost:0}]));
 for(const bet of bets){
  if(!['won','lost'].includes(bet.status))continue;
  const sports=[...new Set(bet.selection_details?.map(d=>d.sport) ?? [])];
  const sport=sports.length>1?'Mixto':sports[0] ?? bet.sport_tag;
  const name=sport==='Mixto'?'Mixtos':sport==='Fútbol'?'Fútbol':sport==='Americano'?'NFL':sport==='Béisbol'?(['MLB','KBO'].includes(bet.league_tag??'')?bet.league_tag!:'Béisbol · mixto/sin liga'):'Sin clasificar';
  if(!groups.has(name))groups.set(name,{name,won:0,lost:0});
  const group=groups.get(name)!;if(bet.status==='won')group.won++;else group.lost++;
 }
 return [...groups.values()].map(g=>({...g,total:g.won+g.lost,rate:g.won+g.lost?g.won/(g.won+g.lost)*100:null}));
}
