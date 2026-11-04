import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine} from '../game-engine.js';
import {PersistenceController} from '../persistence-controller.js';
import {createEngine,restoreEngine,chooseSage,dateDakar} from '../strategy-mode.js';
const card=(effects,other={})=>({id:'test',title:'Test',category:'health',effects,...other});
test('la prévision reproduit tout le tour sans modifier le moteur ni sa graine',()=>{
 const e=createEngine({seed:42,stage:2});e.activeEvents=[{eventId:'e',title:'Test',effectsPerTurn:{money:-3,love:2},remainingTurns:2}];
 e.activeModifiers.protected=true;e.activeModifiers.corruption=2;
 const c=card({health:12,love:-3,money:-8},{specialEffect:'extra_choice'}),before=JSON.stringify(e),p=e.previewCard(c);
 assert.equal(JSON.stringify(e),before);e.applyCard(c);assert.deepEqual(p.pillars,e.pillars);assert.equal(p.score,e.score);assert.equal(p.inZone,e.pilliersEnZone());assert.deepEqual(p.activeEvents,e.activeEvents);
});
test('prévision de défaite, victoire et filet fidèle au résultat',()=>{
 for(const mode of ['daily','parcours']){
  const e=createEngine({mode,seed:12});e.pillars.money=3;const c=card({money:-20});const p=e.previewCard(c);e.applyCard(c);assert.equal(p.isGameOver,e.isGameOver);assert.equal(p.isVictory,e.isVictory);assert.equal(p.safetyNet,e.filetUtilise);
 }
 const e=createEngine({seed:9});e.turn=2;const p=e.previewCard(card({}));e.applyCard(card({}));assert.equal(p.isVictory,true);assert.equal(e.isVictory,true);
});
test('graine du jour et duel : mêmes cartes indépendamment de l’héritage ou de l’expérience',()=>{
 const a=createEngine({mode:'daily',seed:20261104,stats:{},heritage:{upgrades:{open_heart:5}}});
 const b=createEngine({mode:'daily',seed:20261104,stats:{unlockedTrophies:['premiere_victoire']},heritage:{upgrades:{}}});
 for(let i=0;i<13&&!a.isGameOver;i++){const ah=a.generateCards(),bh=b.generateCards();assert.deepEqual(ah,bh);a.applyCard(ah[0]);b.applyCard(bh[0]);assert.deepEqual(a.pillars,b.pillars);assert.equal(a.score,b.score);}
 assert.equal(dateDakar(new Date('2026-11-04T00:30:00Z')),'2026-11-04');
});
test('reprendre conserve le palier, la graine zéro et le filet déjà utilisé',()=>{
 const e=createEngine({seed:0,stage:3});e.filetUtilise=true;e.generateCards();const snapshot=JSON.parse(JSON.stringify(e)),copy=restoreEngine(snapshot);
 assert.equal(copy.etapeParcours,3);assert.equal(copy.filetUtilise,true);assert.equal(copy.currentSeed,e.currentSeed);assert.deepEqual(copy.generateCards(),e.generateCards());
 const zero=restoreEngine({...snapshot,currentSeed:0});assert.equal(zero.currentSeed,0);
});
test('la sauvegarde historique conserve les nouveaux champs de reprise',()=>{
 const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
 const p=new PersistenceController(),e=createEngine({stage:4,seed:24});e.filetUtilise=true;p.saveGameProgress(e);const copy=restoreEngine(p.data.progression);assert.equal(copy.etapeParcours,4);assert.equal(copy.filetUtilise,true);
});
test('la Sage joue de vraies décisions légales et n’altère pas l’état en réfléchissant',()=>{
 const e=createEngine({mode:'duel',seed:42});const cards=e.generateCards(),before=JSON.stringify(e),chosen=chooseSage(e,cards);assert.ok(cards.includes(chosen));assert.equal(JSON.stringify(e),before);e.applyCard(chosen);assert.equal(e.turn,1);
});
test('la maîtrise de l’harmonie porte sur le tour actuel, pas sur le précédent',()=>{
 const plain=createEngine({seed:2}),master=createEngine({seed:2,character:{ability:{id:'harmony_mastery'}}});plain.reachedHarmony=false;master.reachedHarmony=false;plain.applyCard(card({}));master.applyCard(card({}));assert.equal(master.score,plain.score*2);
});
test('200 parcours simulés : effets et prévisions restent cohérents jusqu’à la fin',()=>{
 let victories=0;
 for(let seed=0;seed<200;seed++){
  const e=createEngine({mode:'daily',seed});while(!e.isGameOver){const hand=e.generateCards(),c=chooseSage(e,hand),p=e.previewCard(c);e.applyCard(c);assert.deepEqual(p.pillars,e.pillars);for(const value of Object.values(e.pillars))assert.ok(Number.isFinite(value)&&value>=0&&value<=100);assert.ok(e.turn<=13);}
  if(e.isVictory)victories++;
 }
 assert.ok(victories>0,`aucune victoire sur 200 graines`);
 console.log(`Sage : ${victories}/200 défis gagnés`);
});
