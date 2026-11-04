import { GameEngine } from './game-engine.js?v=70';
import { PILLARS, PARCOURS } from './game-config.js';

export const MODES = {
  parcours: { title:'Le Parcours', tag:'Progression', desc:'Cinq étapes, de trois semaines à une année. Chaque palier gagné reste acquis.' },
  daily: { title:'Défi du jour', tag:'Mêmes conditions', desc:'Treize semaines, une même graine pour tous, sans avantage d’héritage.' },
  duel: { title:'Face à la Sage', tag:'Duel tactique', desc:'Un véritable adversaire local. Mêmes règles, même départ, treize décisions chacun.' },
  meditation: { title:'Méditation', tag:'Sans défaite', desc:'Explore les cartes et les enchaînements à ton rythme, sans limite de durée.' }
};
export function dateDakar(date=new Date()) {
  const parts=new Intl.DateTimeFormat('fr-CA',{timeZone:'Africa/Dakar',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const part=t=>parts.find(p=>p.type===t).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function createEngine({mode='parcours',seed,stage=0,stats={},heritage={upgrades:{}},character=null}={}) {
  const fair=mode==='daily'||mode==='duel';
  const engine=new GameEngine(fair?{unlockedTrophies:['premiere_victoire']}:stats,fair?{upgrades:{}}:heritage);
  engine.reset(seed??Math.floor(Math.random()*4294967296),fair?null:character,mode==='meditation');
  engine.etapeParcours=fair?2:Math.max(0,Math.min(PARCOURS.length-1,stage));
  return engine;
}
export function restoreEngine(state) {
  const e=new GameEngine(state.globalStats||{},state.heritage||{upgrades:{}});
  e.loadState(state);return e;
}
export function evaluateChoice(engine,card) {
  const p=engine.previewCard(card), zone=engine.zoneEquilibre();
  const distance=PILLARS.reduce((sum,k)=>sum+Math.max(0,zone.bas-p.pillars[k],p.pillars[k]-zone.haut),0);
  const danger=PILLARS.reduce((sum,k)=>sum+(p.pillars[k]<15||p.pillars[k]>85?1:0),0);
  return (p.isVictory?100000:0)-(p.isGameOver&&!p.isVictory?100000:0)+p.inZone*100-distance*3-danger*40+(p.harmony?35:0)+p.deltaScore/100-(p.safetyNet?100:0);
}
export function chooseSage(engine,cards) {
  return cards.reduce((best,card)=>!best||evaluateChoice(engine,card)>evaluateChoice(engine,best)?card:best,null);
}
/** Le duel privilégie la survie, puis l'objectif et enfin le score. */
export function duelOutcome(player,opponent) {
  if(player.turn!==opponent.turn)return Math.sign(player.turn-opponent.turn);
  const playerAlive=!player.isGameOver||player.isVictory;
  const opponentAlive=!opponent.isGameOver||opponent.isVictory;
  if(playerAlive!==opponentAlive)return playerAlive?1:-1;
  if(player.isVictory!==opponent.isVictory)return player.isVictory?1:-1;
  return Math.sign(player.score-opponent.score);
}
/** La Sage dispose, comme le joueur, de deux renouvellements au maximum. */
export function playSageTurn(engine,cards,budget=2) {
  if(engine.isGameOver)return {card:null,hand:cards,redrawsLeft:budget};
  let choice=chooseSage(engine,cards);
  while(engine.activeModifiers.refreshAvailable||(budget>0&&evaluateChoice(engine,choice)<100)){
    if(engine.activeModifiers.refreshAvailable)engine.activeModifiers.refreshAvailable=false;else budget--;
    cards=engine.generateCards();choice=chooseSage(engine,cards);
  }
  engine.applyCard(choice);
  return {card:choice,hand:engine.isGameOver?cards:engine.generateCards(),redrawsLeft:budget};
}
