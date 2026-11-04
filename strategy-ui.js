import { PILLARS, PILLAR_DEFINITIONS as DEF, PANTHEONS, PARCOURS, MECHANICS } from './game-config.js';
import { PersistenceController } from './persistence-controller.js?v=68';
import { MODES, createEngine, restoreEngine, chooseSage, dateDakar, duelOutcome } from './strategy-mode.js?v=68';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const round=v=>Math.round(v), fmt=v=>Math.floor(v).toLocaleString('fr-FR');
const store=new PersistenceController(), KEY='equilibre_strategie_v1', RESULTS='equilibre_resultats_strategie_v1';
const root=document.createElement('main');root.id='strategie';
document.documentElement.classList.add('strategie');
document.body.replaceChildren(root);
const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='./strategy-ui.css?v=68';document.head.append(sheet);
const banner=document.createElement('div');banner.id='update-banner';banner.innerHTML='<span>Une mise à jour est prête.</span><button id="update-apply">Mettre à jour</button><button id="update-later">Plus tard</button>';document.body.append(banner);
let run=null,selected=null,dialog=null,home=true,locked=false,character='balanced',notice='';
let saved=read(KEY),music=null,sound=read('equilibre_strategie_son')!==false,voice=false;
const special={extra_choice:'Un choix supplémentaire au prochain tour',protection:'Protection au prochain tour',multiplier:'Effets doublés au prochain tour',refresh:'Changement de main offert au prochain tour',corruption:'Corruption : −10 sur chaque pilier au prochain tour'};
function read(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{notice='La sauvegarde est indisponible sur ce navigateur.';}}
function playSound(id,vol=.55){if(!sound)return;const src={select:'card-select-ping-minimal.mp3',play:'card-play-elegant-bell-v2.mp3',deal:'card-appear-soft-rustle.mp3',win:'equilibre-milestone-victory.mp3'}[id];const a=new Audio('assets/audio/'+src);a.volume=vol;a.play().catch(()=>{});}
function startMusic(){if(!sound||document.hidden||home)return;if(!music){music=new Audio('assets/audio/equilibre-heritage-theme-v2.mp3');music.loop=true;music.volume=.12;}music.play().catch(()=>{});}
function pauseAudio(){music?.pause();window.speechSynthesis?.cancel();}
function persist(){if(!run)return;write(KEY,{...run,engine:JSON.parse(JSON.stringify(run.engine)),opponent:run.opponent?JSON.parse(JSON.stringify(run.opponent)):null});saved=read(KEY);}
function restore(){try{if(!saved?.engine||!MODES[saved.mode]||!Array.isArray(saved.hand))return;run={...saved,engine:restoreEngine(saved.engine),opponent:saved.opponent?restoreEngine(saved.opponent):null};home=false;selected=null;startMusic();render();}catch{notice='La reprise de cette partie est indisponible.';render();}}
function start(mode){
  const day=dateDakar(),seed=mode==='daily'?Number(day.replaceAll('-','')):Math.floor(Math.random()*4294967296);
  const options={mode,seed,stage:store.getEtape(),stats:store.getStats(),heritage:store.getHeritage(),character:PANTHEONS.find(p=>p.id===character)};
  const engine=createEngine(options);
  run={mode,day,seed,engine,hand:engine.generateCards(),redraws:2,recorded:false,feedback:'Choisis une carte. Compare son effet sur les quatre piliers avant de la jouer.',opponent:mode==='duel'?createEngine(options):null,opponentHand:null};
  if(run.opponent)run.opponentHand=run.opponent.generateCards();
  home=false;selected=null;dialog=null;persist();startMusic();playSound('deal');render();
}
function newRun(mode){if((run&&!run.engine.isGameOver)||(!run&&saved?.engine&&!saved.engine.isGameOver)){dialog={type:'replace',mode};render();return;}start(mode);}
function finish(){
  if(run.recorded)return;run.recorded=true;
  const e=run.engine;
  if(run.mode==='parcours'){
    if(e.isVictory){if(!e.unlockedTrophies.includes('premiere_victoire'))e.unlockedTrophies.push('premiere_victoire');store.setEtape(Math.min(PARCOURS.length-1,e.etapeParcours+1));store.ajouterSemaines(e.turn);}
    store.recordGameEnd(e.score,e.turn,e.reachedHarmony,e.unlockedTrophies);
  }
  const rows=read(RESULTS)||[];rows.unshift({mode:run.mode,day:run.day,date:new Date().toISOString(),score:e.score,turn:e.turn,victory:e.isVictory,opponent:run.opponent?.score??null});write(RESULTS,rows.slice(0,50));
  if(e.isVictory)playSound('win');persist();
}
function commit(){
  if(locked||selected===null||!run||run.engine.isGameOver)return;
  const card=run.hand[selected];if(!card)return;locked=true;
  const before={...run.engine.pillars};run.engine.applyCard(card);
  if(run.opponent&&!run.opponent.isGameOver){const choice=chooseSage(run.opponent,run.opponentHand);run.opponent.applyCard(choice);run.lastOpponent=choice.title;if(!run.opponent.isGameOver)run.opponentHand=run.opponent.generateCards();}
  run.lastCard=card.title;run.delta=Object.fromEntries(PILLARS.map(p=>[p,run.engine.pillars[p]-before[p]]));
  run.feedback=run.engine.dernierFilet?'Un filet de sécurité a ramené un pilier à 50. Il est maintenant utilisé.':`${card.title} joué. ${run.engine.pilliersEnZone()} pilier(s) dans la zone d’équilibre.`;
  run.engine.dernierFilet=null;
  if(!run.engine.isGameOver)run.hand=run.engine.generateCards();else finish();
  selected=null;playSound('play');persist();locked=false;render();
  document.querySelector('[data-action="select"]')?.focus({preventScroll:true});
}
function redraw(){
  if(!run||run.engine.isGameOver)return;
  if(run.engine.activeModifiers.refreshAvailable)run.engine.activeModifiers.refreshAvailable=false;
  else if(run.redraws>0)run.redraws--;else return;
  run.hand=run.engine.generateCards();run.feedback='Nouvelle main. Aucune semaine écoulée ; les autres effets restent actifs.';selected=null;playSound('deal');persist();render();
}
function header(){return `<header class="s-header"><button class="s-brand" data-action="home" aria-label="Menu principal"><span>ÉQUILIBRE <i>DES CHOIX</i></span><small>PAR KHALAM</small></button><div class="s-tools"><button class="s-icon" data-action="sound" aria-label="${sound?'Couper':'Activer'} le son">${sound?'♫':'♪'}</button><button class="s-icon" data-action="rules" aria-label="Règles du jeu">?</button><button class="s-icon" data-action="settings" aria-label="Paramètres">⚙</button></div></header>`;}
function renderHome(){
  const stage=PARCOURS[Math.min(store.getEtape(),PARCOURS.length-1)],rows=read(RESULTS)||[];
  return `${header()}<section class="s-home"><div class="s-hero"><p class="s-eyebrow">UNE VIE. QUATRE PILIERS. VOS CHOIX.</p><h1>Trouver l’équilibre.<br><em>Tenir dans la durée.</em></h1><p>Chaque carte ouvre une voie et demande un sacrifice. Anticipez les conséquences, préservez vos quatre piliers et écrivez votre parcours.</p><div class="s-emblems">${PILLARS.map(p=>`<div style="--pillar:${DEF[p].color}"><img src="${DEF[p].art}" alt=""><span>${DEF[p].name}</span></div>`).join('')}</div></div><div class="s-menu"><div class="s-menu-head"><span class="s-eyebrow">VOTRE PROCHAINE ÉTAPE</span><b>${stage.titre}</b><span>${stage.semaines} semaines · objectif ${stage.bas}–${stage.haut}</span></div>${saved?.engine&&!saved.engine.isGameOver?`<button class="s-primary s-resume" data-action="resume">Reprendre · ${MODES[saved.mode]?.title||'Partie'} <span>Semaine ${saved.engine.turn}</span></button>`:''}<label class="s-character">Votre voie <select id="character">${PANTHEONS.map(p=>`<option value="${p.id}" ${p.id===character?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><div class="s-modes">${Object.entries(MODES).map(([id,m])=>`<button class="s-mode" data-action="start" data-mode="${id}"><span class="s-tag">${m.tag}</span><strong>${m.title}</strong><span>${m.desc}</span><b aria-hidden="true">↗</b></button>`).join('')}</div><div class="s-menu-foot"><button data-action="stats">Vos résultats · ${rows.length}</button><a href="?vue=immersive">Vue immersive</a></div></div></section><footer class="s-home-footer">${esc(notice||'Jeu gratuit · Sauvegarde sur cet appareil · Prenez le temps de choisir.')}</footer>`;
}
function pillar(p,preview){
  const e=run.engine,v=e.pillars[p],next=preview?.pillars[p],z=e.zoneEquilibre(),ok=v>=z.bas&&v<=z.haut,danger=v<15||v>85;
  return `<div class="s-pillar ${ok?'in-zone':''} ${danger?'danger':''}" style="--pillar:${DEF[p].color};--zone-left:${z.bas}%;--zone-width:${z.haut-z.bas}%"><div class="s-pillar-title"><img src="${DEF[p].icon}" alt=""><span>${DEF[p].name}</span><b>${round(v)}${next!==undefined?`<small> → ${round(next)}</small>`:''}</b></div><div class="s-meter" role="meter" aria-label="${DEF[p].name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${round(v)}"><i class="s-zone"></i><i class="s-fill" style="width:${v}%"></i>${next!==undefined?`<i class="s-next" style="left:${next}%"></i>`:''}</div><small>${danger?'Proche d’une limite':ok?'Dans la zone':'À rééquilibrer'}</small></div>`;
}
function card(c,i){
  const def=DEF[c.category]||DEF.spirituality;
  return `<button class="s-choice ${selected===i?'selected':''}" data-action="select" data-index="${i}" aria-pressed="${selected===i}" style="--pillar:${def.color}"><span class="s-card-top"><small>${esc(({common:'Commun',uncommon:'Peu commun',rare:'Rare',epic:'Épique',legendary:'Légendaire'})[c.rarity]||'Événement')}</small><b>${i+1}</b></span><img src="${esc(c.art||def.art)}" alt=""><h2>${esc(c.title)}</h2><p>${esc(c.desc)}</p><div class="s-effects">${PILLARS.filter(p=>c.effects?.[p]).map(p=>`<span title="${DEF[p].name}"><img src="${DEF[p].icon}" alt="${DEF[p].name}"><b class="${c.effects[p]<0?'negative':'positive'}">${c.effects[p]>0?'+':''}${c.effects[p]}</b></span>`).join('')||'<span>Effet sur plusieurs semaines</span>'}</div>${c.specialEffect?'<small class="s-special">✦ Effet spécial</small>':''}</button>`;
}
function analysis(c,preview){
  if(!c)return `<section class="s-analysis s-empty"><p class="s-eyebrow">LE TEMPS DE LA DÉCISION</p><h2>Quelle voie choisir ?</h2><p>Sélectionnez une carte pour voir l’état réel des piliers après le tour, y compris les événements, les protections et le retour vers le centre.</p><div class="s-legend"><i></i> La bande claire marque votre zone d’équilibre.</div><p class="s-tip">${run.mode==='duel'?'La Sage prend une décision à chaque carte jouée.':run.engine.turn===0?'L’excès peut être aussi dangereux que le manque.':'Un gain n’est pas toujours un progrès : surveillez les limites.'}</p></section>`;
  const risk=preview.isGameOver&&!preview.isVictory,cl=preview.isVictory?'Victoire de l’étape':risk?'Ce choix termine la partie':preview.safetyNet?'Ce choix consomme votre filet':`${preview.inZone}/4 piliers dans la zone`;
  return `<section class="s-analysis"><div class="s-analysis-content"><div class="s-analysis-head"><span class="s-eyebrow">APRÈS CETTE DÉCISION</span><button data-action="deselect" aria-label="Annuler la sélection">×</button></div><h2>${esc(c.title)}</h2><p class="s-description">${esc(c.desc)}</p><div class="s-outcome ${risk?'risk':''}"><b>${cl}</b><span>+${fmt(preview.deltaScore)} points${preview.harmony?' · Harmonie':''}</span></div><div class="s-forecast">${PILLARS.map(p=>`<div><span>${DEF[p].name}</span><b>${round(run.engine.pillars[p])}<small> → </small>${round(preview.pillars[p])}</b></div>`).join('')}</div>${c.specialEffect?`<p class="s-rule">✦ ${esc(special[c.specialEffect]||c.specialEffect)}</p>`:''}${c.isWorldEvent?`<p class="s-rule">Événement : ${c.duration} semaines, effet immédiat inclus.</p>`:''}${c.synergyStatus?`<p class="s-rule">${esc(c.synergyStatus.message)} · modificateur déjà inclus dans la carte.</p>`:''}</div><button class="s-primary ${risk?'s-danger-btn':''}" data-action="commit">${risk?'Assumer ce choix':'Jouer cette carte'} <span>↗</span></button></section>`;
}
function renderGame(){
  const e=run.engine,c=selected===null?null:run.hand[selected],preview=c?e.previewCard(c):null,z=e.zoneEquilibre(),step=e.etapeCourante();
  if(e.isGameOver)return renderEnd();
  return `${header()}<section class="s-status"><div><span class="s-eyebrow">${MODES[run.mode].title}</span><h1>${run.mode==='parcours'?esc(step.titre):run.mode==='daily'?esc(run.day):run.mode==='duel'?'Face à la Sage':'Le temps de l’exploration'}</h1></div><div class="s-score"><small>VOTRE SCORE</small><b>${fmt(e.score)}</b></div><div class="s-progress"><small>SEMAINE ${e.turn}${e.isMeditationMode?'':' / '+e.semainesRequises()}</small><div><i style="width:${e.isMeditationMode?100:Math.min(100,e.turn/e.semainesRequises()*100)}%"></i></div></div></section><section class="s-pillars" aria-label="Vos quatre piliers">${PILLARS.map(p=>pillar(p,preview)).join('')}</section><section class="s-context"><span class="s-zone-label">Objectif <b>${z.bas}–${z.haut}</b> · ${e.pilliersEnZone()}/4 piliers</span><span class="s-context-message" aria-live="polite">${esc(run.feedback)}</span>${run.opponent?`<span class="s-rival">Sage <b>${fmt(run.opponent.score)}</b>${run.opponent.isGameOver?' · terminée':''}</span>`:''}</section><section class="s-arena"><div class="s-table"><div class="s-table-head"><span>LES VOIES POSSIBLES</span><span>${run.hand.length} cartes · 1 décision</span></div><div class="s-hand" style="--choices:${run.hand.length}">${run.hand.map(card).join('')}</div><div class="s-table-foot">${e.activeEvents.length?e.activeEvents.map(a=>`${esc(a.title)} · ${a.remainingTurns} sem.`).join(' / '):'Les effets affichés sur les cartes sont immédiats. La prévision inclut tout le tour.'}</div></div>${analysis(c,preview)}</section><footer class="s-actions"><button data-action="redraw" ${run.redraws===0&&!e.activeModifiers.refreshAvailable?'disabled':''}>↻ Changer la main <b>${e.activeModifiers.refreshAvailable?'Offert':run.redraws+' restant'+(run.redraws>1?'s':'')}</b></button><button data-action="history">Vos décisions</button><span>Sauvegarde automatique</span></footer>`;
}
function renderEnd(){
  const e=run.engine,duel=run.mode==='duel',won=duel?duelOutcome(e,run.opponent)>0:e.isVictory,draw=duel&&duelOutcome(e,run.opponent)===0;
  const out=PILLARS.filter(p=>e.pillars[p]<=0||e.pillars[p]>=100);
  return `${header()}<section class="s-end"><p class="s-eyebrow">${MODES[run.mode].title} · BILAN</p><h1>${draw?'À égalité':won?'L’équilibre vous appartient.':'Une décision, une leçon.'}</h1><p>${duel?`Vous : ${fmt(e.score)} · La Sage : ${fmt(run.opponent?.score||0)}${run.lastOpponent?' · Dernier choix : '+esc(run.lastOpponent):''}`:won?`Étape franchie en ${e.turn} semaines.`:out.length?`${out.map(p=>DEF[p].name).join(', ')} a atteint une limite.`:`La durée est écoulée : ${e.pilliersEnZone()}/4 piliers dans la zone ${e.zoneEquilibre().bas}–${e.zoneEquilibre().haut}.`}</p><strong class="s-end-score">${fmt(e.score)}<small>POINTS</small></strong><section class="s-pillars">${PILLARS.map(p=>pillar(p,null)).join('')}</section><div class="s-end-actions"><button class="s-primary" data-action="start" data-mode="${run.mode}">${run.mode==='parcours'&&won?'Étape suivante':'Rejouer'}</button><button data-action="history">Revoir mes décisions</button><button data-action="home">Retour au menu</button></div></section>`;
}
function modal(){
  if(!dialog)return '';
  let title='',body='';
  if(dialog.type==='rules'){title='L’art de l’équilibre';body=`<p>Une carte représente une semaine. Choisissez parmi les cartes proposées, comparez la prévision, puis validez.</p><p>Spiritualité, Amour, Santé et Argent doivent rester entre <b>0 et 100</b> : toucher une limite termine la partie. Une protection ou le filet des débutants peut vous sauver.</p><p>En Parcours, atteignez la durée de l’étape avec <b>les quatre piliers dans la zone annoncée</b>. La bande claire sur les jauges matérialise cette zone.</p><p>L’harmonie augmente les points. Les enchaînements de catégories modifient les cartes. Les effets spéciaux préparent le tour suivant ; les événements durent plusieurs semaines.</p><p><b>Deux changements de main</b> par partie, sans avancer le temps. La carte de renouvellement offre un changement supplémentaire.</p><p>Défi du jour et duel : 13 semaines, sans héritage ni filet. Le défi donne la même graine de départ à tous ; la Sage simule ses choix avec le vrai moteur du jeu.</p><p>Clavier / télécommande : flèches pour choisir, Entrée pour sélectionner puis jouer, Échap pour revenir. Les boutons restent accessibles avec Tab.</p>`;}
  else if(dialog.type==='settings'){title='Votre expérience';body=`<label class="s-setting">Musique et effets <button data-action="sound">${sound?'Activés':'Désactivés'}</button></label><label class="s-setting">Lecture de la carte <button data-action="voice">${voice?'Activée':'Désactivée'}</button></label><p>La musique reste en retrait des sons des cartes. L’audio s’arrête quand vous quittez l’onglet.</p><p><a href="?vue=immersive">Ouvrir la vue immersive</a> — vos anciennes parties et votre héritage y restent accessibles.</p>`;}
  else if(dialog.type==='replace'){title='Commencer une nouvelle partie ?';body='<p>La partie en cours sera remplacée dans cette vue. Votre progression et vos résultats restent conservés.</p><button class="s-primary" data-action="replace-confirm">Commencer</button>';}
  else if(dialog.type==='history'){title='Vos décisions';body=run?.engine.history.length?`<ol class="s-history">${run.engine.history.map(h=>`<li><small>SEMAINE ${h.turn+1}</small><strong>${esc(h.title)}</strong><span>${PILLARS.filter(p=>h.effects[p]).map(p=>`${DEF[p].name} ${h.effects[p]>0?'+':''}${h.effects[p]}`).join(' · ')}</span></li>`).reverse().join('')}</ol>`:'<p>Votre première décision n’a pas encore été jouée.</p>';}
  else {title='Vos résultats sur cet appareil';const rows=read(RESULTS)||[];body=rows.length?`<ol class="s-history">${rows.map(r=>`<li><small>${MODES[r.mode]?.title} · ${esc(r.day)}</small><strong>${fmt(r.score)} points</strong><span>${r.turn} semaines · ${r.victory?'Objectif atteint':'Partie terminée'}</span></li>`).join('')}</ol>`:'<p>Vos résultats apparaîtront après votre première partie dans cette vue.</p>';}
  return `<div class="s-overlay"><section class="s-dialog" role="dialog" aria-modal="true" aria-labelledby="s-dialog-title"><header><h2 id="s-dialog-title">${title}</h2><button data-action="close" aria-label="Fermer">×</button></header><div class="s-dialog-body">${body}</div><button class="s-secondary" data-action="close">Fermer</button></section></div>`;
}
let previousDialog=false;
function render(){root.className=home?'is-home':run?.engine.isGameOver?'is-end':'is-game';root.innerHTML=(home?renderHome():renderGame())+modal();if(dialog&&!previousDialog)requestAnimationFrame(()=>root.querySelector('.s-dialog button')?.focus());previousDialog=!!dialog;}
function speak(c){if(!voice||!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(c.title+'. '+c.desc);u.lang='fr-FR';u.rate=1;music?.pause();u.onend=()=>{if(!dialog)startMusic();};u.onerror=u.onend;window.speechSynthesis.speak(u);}
root.addEventListener('click',event=>{
  const b=event.target.closest('[data-action]');if(!b||b.disabled)return;const action=b.dataset.action;
  if(action==='home'){home=true;selected=null;pauseAudio();render();}
  if(action==='start')newRun(b.dataset.mode);
  if(action==='replace-confirm'){const mode=dialog.mode;start(mode);}
  if(action==='resume')restore();
  if(['rules','settings','stats','history'].includes(action)){dialog={type:action};pauseAudio();render();}
  if(action==='close'){dialog=null;startMusic();render();}
  if(action==='sound'){sound=!sound;write('equilibre_strategie_son',sound);if(sound)startMusic();else pauseAudio();render();}
  if(action==='voice'){voice=!voice;if(!voice)window.speechSynthesis?.cancel();render();}
  if(action==='select'){selected=Number(b.dataset.index);playSound('select',.35);speak(run.hand[selected]);render();}
  if(action==='deselect'){selected=null;window.speechSynthesis?.cancel();render();}
  if(action==='commit')commit();if(action==='redraw')redraw();
});
root.addEventListener('change',e=>{if(e.target.id==='character')character=e.target.value;});
document.addEventListener('keydown',e=>{
  if(e.target.matches('input,select,textarea'))return;
  if(dialog&&e.key==='Tab'){const all=[...root.querySelectorAll('.s-dialog button,.s-dialog a,.s-dialog select')];const first=all[0],last=all.at(-1);if((e.shiftKey&&document.activeElement===first)||(!e.shiftKey&&document.activeElement===last)){e.preventDefault();(e.shiftKey?last:first)?.focus();}return;}
  if(e.key==='Escape'){if(dialog)dialog=null;else if(selected!==null)selected=null;else {home=true;pauseAudio();}render();return;}
  if(home||dialog||run?.engine.isGameOver)return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
    e.preventDefault();selected=(selected===null?0:(selected+(e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1)+run.hand.length)%run.hand.length);playSound('select',.25);render();
  }else if(e.key==='Enter'&&!e.target.closest('button,a')){e.preventDefault();if(selected===null){selected=0;render();}else commit();}
  else if(/^[1-4]$/.test(e.key)&&Number(e.key)<=run.hand.length){selected=Number(e.key)-1;render();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){persist();pauseAudio();}else if(!dialog)startMusic();});
window.addEventListener('pagehide',()=>{persist();pauseAudio();});
render();
