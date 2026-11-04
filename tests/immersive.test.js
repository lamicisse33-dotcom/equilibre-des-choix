import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {frameCards,screenLayout} from '../immersive-layout.js';
import {DuelController} from '../duel-controller.js';
test('la scène originale reste l’entrée par défaut, avec le même rendu des cartes',()=>{
 const s=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(s,/get\('vue'\) !== 'strategie'/);assert.match(s,/main.js\?v=70/);
 const c=fs.readFileSync(new URL('../card-controller.js',import.meta.url),'utf8');assert.match(c,/to\(\{ y: slot.y, z: slot.z \}, 750\)/);assert.match(c,/baseSlot: slot.clone\(\)/);
});
test('3 et 4 cartes, au repos et sélectionnées, restent dans la zone sûre sur chaque écran',()=>{
 for(const [w,h] of [[320,568],[390,844],[430,932],[844,390],[1366,768],[1920,1080],[3840,2160]])for(const n of [3,4]){
  const l=screenLayout(w,h),xs=l.portrait?(n>3?[0]:[-1.58,0,1.58]):Array.from({length:n},(_,i)=>(i-(n-1)/2)*Math.max(4.3/(n-1),1.49*1.12));
  const f=frameCards({width:w,height:h,xs});assert.ok(f.bounds.left>=l.left&&f.bounds.right<=l.right,`${w}×${h} : côté rogné`);assert.ok(f.bounds.top>=l.top&&f.bounds.bottom<=l.bottom,`${w}×${h} : hauteur rognée`);
 }
});
test('le carrousel atteint réellement les quatre cartes après distribution',()=>{
 let s=fs.readFileSync(new URL('../card-controller.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export class CardController','globalThis.C=class CardController');
 class V{constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}clone(){return new V(this.x,this.y,this.z);}}
 class Tween{to(){return this;}easing(){return this;}delay(){return this;}start(){return this;}}
 const ctx={window:{innerWidth:390,innerHeight:844},THREE:{Vector3:V},TWEEN:{Tween,Easing:{Quartic:{Out:0},Back:{Out:0}}}};vm.runInNewContext(s,ctx);
 const cc=Object.create(ctx.C.prototype);cc.cards=[];cc.scene={add(){}};cc.clear=()=>{cc.cards=[];};cc.generateCardMesh=()=>({scale:{setScalar(){}},position:{set(x,y,z){Object.assign(this,{x,y,z});}},rotation:{}});
 const slots=[-3,-1,1,3].map(x=>new V(x,1,4));cc.createCards([1,2,3,4].map(id=>({id})),slots);
 cc.centrerSur(3,true);assert.equal(cc.indexActif,3);assert.ok(cc.cards[3].position.x<cc.cards[0].position.x+7);assert.notEqual(cc.cards[0].position.x,-3);assert.ok(cc.cards.every(m=>m.userData.baseSlot));
});
test('le duel de la vue 3D joue un véritable tour et se reprend sans doubler sa réponse',async()=>{
 const data=[];const d=new DuelController({onOpponentUpdate:v=>data.push(v)});await d.connect(44);d.updateMyScore(200,1,false);assert.equal(d.engine.turn,1);d.updateMyScore(200,1,true);assert.equal(d.engine.turn,1);const copy=new DuelController({onOpponentUpdate(){}});copy.restore(d.getState());assert.deepEqual(copy.hand,d.hand);assert.equal(copy.engine.score,d.engine.score);assert.ok(data.at(-1).score>0);
});
