import {initialiserSource,sourceVisible,enregistrerSource,celebrerSource} from './source-harmonie.js?v=85';
import { dessinerVisuel, visuelEcho } from './visuels-contextuels.js?v=83';
/**
 * ÉQUILIBRE - Main Application Controller (Mediator)
 * Orchestrates all modules and handles the game loop.
 */

import { createEngine } from './strategy-mode.js?v=70';
import { GameEngine } from './game-engine.js?v=83';
import { recordJourney, journeyStats, portrait, explicationChoix } from './choix-simples.js?v=82';
import { SceneManager } from './scene-manager.js?v=83';
import { UIController } from './ui-controller.js?v=84';
import { AudioController } from './audio-controller.js';
import { HomeController } from './home-controller.js?v=72';
import { PersistenceController } from './persistence-controller.js?v=70';
import { ConfigController } from './config-controller.js?v=70';
import { NarrativeController } from './narrative-controller.js';
import { TransitionController } from './transition-controller.js';
import { DuelController } from './duel-controller.js?v=70';


/* Cinématiques vectorielles légères : aucun téléchargement vidéo. */
function jouerVision(echo,audio,done){
 const t=echo.titre.toLowerCase(),v=echo.texte.toLowerCase(),good=echo.nature==='positive';
 const type=/coffre/.test(t)?'coffre':/semences/.test(t)?'recolte':/allié silencieux/.test(t)?'operation':/maison du serment/.test(t)?'maison':/vent soudain/.test(t)?'tempete':/puissance instable|réparation invisible|congélateur/.test(t)?'panne':/promotion/.test(v)?'promotion':/réconciliation|pardon|dialogue reprend/.test(v)?'lien':/contrat|commande|trésorerie|revenu|dette/.test(v)?'argent':'destin';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const d=document.createElement('dialog');d.setAttribute('aria-label','Vision du destin');d.style.cssText='position:fixed;inset:0;margin:0;width:100%;height:100%;max-width:none;max-height:none;border:0;padding:0;background:#070a13;color:#f5d99a;overflow:hidden';
 const c=document.createElement('canvas');c.style.cssText='width:100%;height:100%;display:block';d.append(c);
 const label=document.createElement('div');label.style.cssText='position:absolute;top:8%;left:5%;right:5%;text-align:center;font:600 clamp(18px,4vw,36px) Georgia;letter-spacing:.08em;text-shadow:0 2px 12px #000';label.textContent='LES ÉCHOS DU DESTIN';d.append(label);
 const skip=document.createElement('button');skip.textContent='Passer';skip.style.cssText='position:absolute;bottom:5%;right:5%;padding:10px 22px;border:1px solid #bfa36b;border-radius:20px;background:#111c26;color:#f5d99a';d.append(skip);document.body.append(d);
 let frame=0,timer=0,finished=false,ctxAudio=null;const finish=()=>{if(finished)return;finished=true;cancelAnimationFrame(frame);clearTimeout(timer);try{ctxAudio?.close().catch(()=>{});}catch{}d.remove();done();};skip.onclick=finish;d.addEventListener('cancel',e=>{e.preventDefault();finish();});d.addEventListener('close',finish,{once:true});
 try{d.showModal();}catch{finish();return;}
 const W=c.width=640,H=c.height=Math.max(320,Math.min(640,Math.round(640*innerHeight/innerWidth))),x=W/2,y=H*.54,g=c.getContext('2d');if(!g){finish();return;}
 const particles=Array.from({length:48},(_,i)=>({a:i*2.39996,r:30+(i*37%180),s:1+i%4}));
 const color=good?'#7fe7c4':'#ffac62';const chest=type==='coffre',blast=chest&&/éclate/.test(v)&&!/sécuriser/.test(v);
 function sound(){try{const vol=Math.min(.2,.20*(audio.settings?.sfx??1)*(audio.settings?.master??1));if(!vol)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctxAudio=new AC();ctxAudio.resume().catch(()=>{});const now=ctxAudio.currentTime;const gain=ctxAudio.createGain();gain.connect(ctxAudio.destination);gain.gain.setValueAtTime(vol,now);gain.gain.exponentialRampToValueAtTime(.001,now+1.5);if(blast||type==='tempete'||type==='panne'||type==='maison'){const buf=ctxAudio.createBuffer(1,ctxAudio.sampleRate*1.5,ctxAudio.sampleRate),a=buf.getChannelData(0);let last=0;for(let i=0;i<a.length;i++){last=.9*last+.1*(Math.random()*2-1);a[i]=last*Math.exp(-i/a.length*3)*2;}const n=ctxAudio.createBufferSource();n.buffer=buf;n.connect(gain);n.start();}else{[0,good?7:3,good?12:6].forEach((note,i)=>{const o=ctxAudio.createOscillator();o.type='sine';o.frequency.value=196*Math.pow(2,note/12);o.connect(gain);o.start(now+i*.13);o.stop(now+1.4);});}}catch{}}
 let sounded=false;const start=performance.now();
 function draw(now){const p=Math.min(1,(now-start)/3000),q=reduced?1:p;if(!sounded&&p>.3){sounded=true;sound();}
 g.fillStyle='#080b15';g.fillRect(0,0,W,H);const glow=g.createRadialGradient(x,y,5,x,y,W*.65);glow.addColorStop(0,good?'#174b42':'#4a231e');glow.addColorStop(1,'#080b15');g.fillStyle=glow;g.fillRect(0,0,W,H);
 g.save();g.translate(x,y);g.strokeStyle=color;g.lineWidth=2;g.globalAlpha=.45;g.beginPath();g.ellipse(0,80,100+q*85,24+q*20,0,0,7);g.stroke();g.globalAlpha=1;
 if(chest){g.fillStyle='#51351e';g.strokeStyle='#e4ba70';g.lineWidth=4;g.fillRect(-75,-32,150,95);g.strokeRect(-75,-32,150,95);g.save();g.translate(-75,-32);g.rotate(blast? -Math.min(1,Math.max(0,q-.32)*3):0);g.fillStyle='#72502b';g.beginPath();g.roundRect(0,-45,150,48,15);g.fill();g.stroke();g.restore();g.fillStyle='#eac47c';g.fillRect(-8,-30,16,28);}
 else if(type==='recolte'){for(let i=0;i<16;i++){const h=good?10+q*(30+i%5*8):Math.max(3,(55+i%5*6)*(1-q));const xx=-120+i*16;g.strokeStyle=good?'#99d78a':'#a98751';g.beginPath();g.moveTo(xx,70);g.lineTo(xx,70-h);g.stroke();g.fillStyle=g.strokeStyle;g.beginPath();g.ellipse(xx,70-h,5,11,.4,0,7);g.fill();}}
 else if(type==='maison'){g.fillStyle='#594c42';g.fillRect(-75,-15,150,90);g.strokeStyle='#d5b78c';g.strokeRect(-75,-15,150,90);g.beginPath();g.moveTo(-95,-15);g.lineTo(0,-95);g.lineTo(95,-15);g.closePath();g.stroke();if(!good){g.strokeStyle='#eec18e';g.beginPath();g.moveTo(0,-15);g.lineTo(-14,10*q);g.lineTo(12,35*q);g.lineTo(-9,73*q);g.stroke();}}
 else if(type==='tempete'){for(let j=0;j<5;j++){g.strokeStyle='#7ccce8';g.beginPath();for(let i=-180;i<=180;i+=6){const yy=30+j*13+Math.sin(i*.035+q*9+j)*10;(i===-180?g.moveTo(i,yy):g.lineTo(i,yy));}g.stroke();}g.fillStyle='#d6bb82';g.beginPath();g.moveTo(-45,10);g.lineTo(48,10);g.lineTo(30,37);g.lineTo(-29,37);g.closePath();g.fill();g.beginPath();g.moveTo(0,4);g.lineTo(0,-83);g.lineTo(48,4);g.closePath();g.fill();}
 else if(type==='argent'){for(let i=0;i<20;i++){let xx=(i*83%280)-140,yy=((i*37+q*180)%190)-95;if(!good)yy+=q*85;g.fillStyle='#dcb15e';g.globalAlpha=good?1:1-q*.8;g.beginPath();g.ellipse(xx,yy,11,6,.3,0,7);g.fill();}g.globalAlpha=1;}
 else if(type==='lien'){for(let i of [-1,1]){const xx=i*(good?80-q*48:32+q*65);g.fillStyle='#bb916c';g.beginPath();g.arc(xx,-35,19,0,7);g.fill();g.beginPath();g.roundRect(xx-22,-10,44,75,12);g.fill();}g.strokeStyle=color;g.beginPath();g.moveTo(-45,5);g.lineTo(45,5);if(good)g.stroke();}
 else {g.strokeStyle=color;g.lineWidth=3;g.strokeRect(-100,-62,200,118);g.beginPath();g.moveTo(-72,25);for(let i=0;i<7;i++)g.lineTo(-72+i*24,Math.sin(i*2+q*5)*25);g.stroke();g.font='bold 52px Georgia';g.fillStyle=color;g.textAlign='center';g.fillText(good?'✦':'!',0,8);}
 for(const z of particles){const k=blast?Math.max(0,q-.30)*2.2:q;g.globalAlpha=(1-q*.65)*(blast?Math.min(1,k*4):.55);g.fillStyle=color;const rr=z.r*k;g.beginPath();g.arc(Math.cos(z.a)*rr,Math.sin(z.a)*rr*.65,z.s,0,7);g.fill();}g.restore();
 if(p>.65){g.fillStyle='#f4dfb1';g.font='bold 24px Georgia';g.textAlign='center';g.fillText(chest?(blast?'COFFRE PIÉGÉ':'DANGER ÉVITÉ'):echo.titre.toUpperCase().slice(0,36),x,H*.86);}
 if(p<1&&!finished)frame=requestAnimationFrame(draw);else if(!finished)timer=setTimeout(finish,450);
 }frame=requestAnimationFrame(draw);timer=setTimeout(finish,4200);
}

class App {
    constructor() {
        // Initialize controllers
        this.persistence = new PersistenceController();
        this.narrative = new NarrativeController();
        this.transition = new TransitionController();
        this.opponentData = null;
        
        this.config = new ConfigController({
            onConfigChange: async (key, val) => {
                this.persistence.saveConfig({ [key]: val });
                
                if (key === 'language') {
                    this.scene.updateCardsLocalization((k) => this.config.getTranslation(k));
                }

                if (key === 'confirmClick' || key === 'screenShake') {
                    this.ui.syncConfig(this.config.currentConfig);
                    if (key === 'screenShake') this.scene.vfx.screenShakeEnabled = val;
                }

                if (key === 'theme' || key === 'lightMode') {
                    // Smooth transition when changing theme/light mode
                    await this.transition.fade(1, 400);
                    if (key === 'lightMode') this.scene.setLightMode(val);
                    this.ui.syncConfig(this.config.currentConfig);
                    await this.transition.fade(0, 400);
                } else {
                    this.ui.syncConfig(this.config.currentConfig);
                }
            }
        });

        this.engine = new GameEngine(this.persistence.getStats(), this.persistence.getHeritage());
        // Le parcours : cinq etapes, de trois semaines a une annee.
        import('./game-config.js').then(m => { this.parcours = m.PARCOURS; });
        this.audio = new AudioController(this.persistence.getSettings());
        
        this.duel = new DuelController({
            onOpponentUpdate: (data) => {
                this.opponentData = data;
                this.ui.updateOpponent(data);
            }
        });
        
        this.home = new HomeController({
            onPlay: async (isContinue, pantheon = null, meditationMode = false) => {
                if(!isContinue||!this.persistence.data.progression?.duelState){this.duel.disconnect();this.opponentData=null;}
                this.ui.showDuelUI(this.duel.isDuelActive);
                await this.transition.fade(1, 600);
                
                this.audio.playSignature();
                this.audio.playSFX('ui-confirm-sfx', 0.2);
                this.audio.startBGM(meditationMode);
                
                if (!isContinue) {
                    this.engine=new GameEngine(this.persistence.getStats(),this.persistence.getHeritage());
                    this.engine.reset(null, pantheon, meditationMode);
                    if (!meditationMode && new URLSearchParams(location.search).get('vue') !== 'classique') this.engine.activerChoixSimples();
                    this.narrative.reset();
                    this.persistence.clearGameProgress();
                }
                
                this.home.startExperience();
                
                await this.transition.fade(0, 800);
                
                this.scene.playIntro(() => {
                    // Initiation : trois messages avant la premiere main, une
                    // seule fois dans la vie du joueur.
                    if (!this.engine.choixSimples && !this.persistence.getStats().gamesPlayed && !this.initiationFaite) {
                        this.initiationFaite = true;
                        this.ui.lancerInitiation(() => this.startNewTurn());
                    } else {
                        this.startNewTurn();
                    }
                });
            },
            onDuel: async () => {
                this.opponentData = null;
                await this.transition.fade(1, 600);
                
                this.audio.playSignature();
                this.audio.playSFX('ui-confirm-sfx', 0.2);
                this.audio.startBGM();
                
                this.engine=createEngine({mode:'duel'});
                this.narrative.reset();
                this.persistence.clearGameProgress();
                
                await this.duel.connect(this.engine.currentSeed);
                this.ui.showDuelUI(true);
                
                this.home.startExperience();
                
                await this.transition.fade(0, 800);
                
                this.scene.playIntro(() => {
                    this.startNewTurn();
                });
            },
            onShowStats: () => {
                this.audio.playSFX('ui-click-sfx', 0.1);
                this.home.updateStats(this.persistence.getStats());
            },
            onShowMemories: () => {
                this.audio.playSFX('ui-click-sfx', 0.1);
                const stats = this.persistence.getStats();
                this.home.updateMemoriesList(stats.history, stats.unlockedTrophies);
            },
            onShowHeritage: () => {
                this.audio.playSFX('ui-click-sfx', 0.1);
                this.home.updateHeritageTree(this.persistence.getHeritage());
            },
            onShowLeaderboard: () => {
                this.audio.playSFX('ui-click-sfx', 0.1);
                this.ui.updateLeaderboard(this.persistence.getLeaderboard());
            },
            onBuyUpgrade: (id, cost) => {
                if (this.persistence.buyUpgrade(id, cost)) {
                    this.audio.playSFX('ui-confirm-sfx', 0.2);
                    this.home.updateHeritageTree(this.persistence.getHeritage());
                    // Update engine with new heritage if a game is running or when starting
                    this.engine.heritage = this.persistence.getHeritage();
                } else {
                    this.audio.playSFX('card-fade-sfx', 0.1);
                }
            },
            onOpenSettings: () => {
                this.audio.playSFX('ui-click-sfx', 0.1);
                this.ui.showSettings(true);
            },
            // Bascule de la lecture vocale depuis le menu. Un seul reglage
            // pilote le bouton du menu et la ligne des parametres : les deux
            // restent toujours d'accord.
            onToggleVoice: () => {
                const actif = !(this.config.currentConfig.cardReading !== false);
                this.audio.playSFX('ui-click-sfx', 0.1);
                this.appliquerReglageVoix(actif);
            },
            getTranslation: (key) => this.config.getTranslation(key)
        });

        this.ui = new UIController({
            onVolumeChange: (type, val) => {
                this.audio.setVolume(type, val);
                this.persistence.saveSettings({ [type]: val });
            },
            onConfigChange: (key, val) => {
                this.audio.playSFX('ui-click-sfx', 0.05);
                if (key === 'language') this.config.setLanguage(val);
                if (key === 'playerName') this.config.setPlayerName(val);
                if (key === 'theme') this.config.setTheme(val);
                if (key === 'lightMode') this.config.setLightMode(val);
                // La ligne des parametres et le bouton du menu passent par le
                // meme chemin : impossible qu'ils se contredisent.
                if (key === 'cardReading') this.appliquerReglageVoix(val);
                if (key === 'conseil') {
                    this.config.currentConfig.conseil = val;
                    this.persistence.saveSettings?.(this.config.currentConfig);
                    this.ui.lastSyncConfig = { ...(this.ui.lastSyncConfig || {}), conseil: val };
                    this.ui.syncConfig?.(this.config.currentConfig);
                }
            },
            onPauseStateChange: (isPaused) => {
                this.isPaused = isPaused;
                // Le jeu se met en pause : la voix ne doit pas continuer seule.
                if (isPaused) {clearTimeout(this._lectureSituationTimer);this.ui.arreterLecture?.();}
                this.audio.playSFX('ui-click-sfx', 0.1);
                if (isPaused) {
                    this.audio.fadeBGM(0.3, 500);
                } else {
                    this.audio.fadeBGM(1.0, 500, this.engine.turn);
                }
            },
            getTranslation: (key) => this.config.getTranslation(key),
            // La synthese vocale d'iOS se tait des qu'une autre source audio
            // joue : on efface la musique le temps de l'enonce.
            onLectureDebut: () => {
                if (this._musiqueBaissee) return;
                this._musiqueBaissee = true;
                this.audio.couperPourVoix();
            },
            onLectureFin: () => {
                if (!this._musiqueBaissee) return;
                this._musiqueBaissee = false;
                if (!this.isPaused) this.audio.retablirApresVoix(this.engine.turn);
            },
            onRestart: () => this.restartGame(),
            onRestartHover: () => this.audio.playSFX('ui-click-sfx', 0.1),
            onResetData: async () => {
                await this.transition.fade(1, 1000);
                this.persistence.data.statistics = {
                    gamesPlayed: 0,
                    totalTurns: 0,
                    highestScore: 0,
                    totalLegacy: 0,
                    totalHarmonyShards: 0,
                    harmoniesReached: 0,
                    lastPlayedDate: null,
                    history: [],
                    unlockedTrophies: []
                };
                this.persistence.data.heritage = {
                    harmonyShards: 0,
                    upgrades: {}
                };
                this.persistence.save(this.persistence.STORAGE_KEYS.STATISTICS, this.persistence.data.statistics);
                this.persistence.save('equilibre_heritage', this.persistence.data.heritage);
                this.persistence.clearGameProgress();
                this.restartGame();
            },
            onBackToMenu: async () => {
                this.audio.playSFX('ui-confirm-sfx', 0.2);
                await this.transition.fade(1, 600);
                
                this.duel.disconnect();
                this.ui.showDuelUI(false);
                
                this.isPaused = false;
                this.ui.showPause(false);
                this.ui.showSettings(false);
                this.audio.stopDefeatAmbient();
                this.audio.fadeBGM(0, 1000);
                this.audio.startMenuMusic();
                this.ui.hideGameOver();
                this.home.showHome();
                
                // Update home with latest stats
                const stats = this.persistence.getStats();
                const initialPillars = {};
                import('./game-config.js').then(config => {
                    config.PILLARS.forEach(p => initialPillars[p] = config.INITIAL_PILLAR_VALUE);
                    this.ui.update({ 
                        score: 0, 
                        turn: 0, 
                        highScore: stats.highestScore, 
                        lifetimeScore: stats.totalLegacy,
                        pillars: initialPillars 
                    });
                });

                await this.transition.fade(0, 800);
            }
        });

        this.scene = new SceneManager(document.getElementById('game-container'), {
            onBalanceTilt: (tilt) => {
                if (Math.abs(tilt) > 0.05) this.audio.playSFX('balance-tilt-sfx', 0.15);
                if (Math.abs(tilt) < 0.001) this.audio.playSFX('balance-level-sfx', 0.2);
            }
        });

        this.selectedCard = null;
        this.lastHovered = null;
        this.isPaused = false;
        this.isProcessing = false;

        this.init();
    }

    async init() {
        this.scene.animate();
        
        // Detect mobile for initial optimization
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (this.isMobile) {
            this.scene.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2));
        }

        // Pause handling via ESC
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && !this.engine.isGameOver) {
                const isHomeVisible = !this.home.elements.homeScreen.classList.contains('hidden');
                if (!isHomeVisible && !this.isProcessing) {
                    this.ui.showPause(!this.isPaused);
                }
            }
        });
        
        // Load configurations
        const savedConfig = this.persistence.getConfig();
        this.config.init(savedConfig);
        this.ui.syncConfig(this.config.currentConfig);
        this.ui.syncVolume(this.audio.settings);
        
        if (this.config.currentConfig.lightMode) {
            this.scene.setLightMode(true);
        }
        
        // Setup initial game state
        const now = new Date();
        const dailySeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
        
        if (this.persistence.data.progression) {
            const prog = this.persistence.data.progression;
            this.engine.loadState(prog);
            if(prog.duelState){this.engine.heritage={upgrades:{}};this.engine.globalStats={unlockedTrophies:['premiere_victoire']};this.duel.restore(prog.duelState);this.ui.showDuelUI(true);}
            if (prog.narrativeState) this.narrative.loadState(prog.narrativeState);
            this.ui.update(this.engine);
            this.ui.updateHistory(this.engine.history);
            this.scene.updatePillars(this.engine.pillars, 50);
            this.scene.updateHeritage(this.persistence.getStats().totalLegacy);
            this.home.updateContinueButton(true);
        } else {
            this.engine.reset(dailySeed);
            this.narrative.reset();
            this.scene.updateHeritage(this.persistence.getStats().totalLegacy);
            this.home.updateContinueButton(false);
        }

        // Menu allege et initiation tant qu'aucune partie n'a ete terminee.
        this.home.appliquerModeDecouverte(this.persistence.getStats().gamesPlayed);
        
        this.setupPointerEvents();
        this.setupKeyboardEvents();
        // Deck rééquilibre : on repart sur un classement propre.
        this.persistence.migrerVersDeck(2);
        // Etat initial du bouton, avant toute interaction.
        this.appliquerReglageVoix(this.config.currentConfig.cardReading !== false);
        this.declarerSessionAudio();
        this.registerVisibilityHandler();
        
        // L'ecran de chargement est retire par SceneManager, quand textures ET
        // modeles 3D sont prets. init() s'acheve bien avant : le masquer ici
        // revenait a decouvrir une scene vide.
        // On ne garde qu'un filet de securite tardif, au cas ou le chargement
        // resterait bloque.
        setTimeout(() => {
            const l = document.getElementById('loading-screen');
            if (!l || l.style.display === 'none') return;
            // Masquer l'ecran ici ne ferait que reveler une scene vide, sans
            // que le joueur comprenne pourquoi. On le garde et on lui dit ce
            // qui se passe, plutot que de le laisser devant un ecran noir.
            const echecs = (this.scene && this.scene.erreursChargement) || [];
            const p = (this.scene && this.scene.progression) || { charges: 0, total: 0 };
            console.warn(`Chargement incomplet : ${p.charges}/${p.total} ressources.`, echecs);
            const hint = document.getElementById('loading-hint');
            if (hint) {
                hint.style.opacity = '1';
                hint.style.color = '#e74c3c';
                // Le message generique n'aidait ni le joueur ni le diagnostic.
                // On indique combien de ressources sont passees : un 0/0 designe
                // un blocage avant meme la premiere requete, un 12/45 un arret
                // en cours de route.
                let msg;
                if (echecs.length) {
                    msg = `${echecs.length} ressource(s) introuvable(s) — ${p.charges}/${p.total} chargees`;
                } else if (!p.total) {
                    msg = 'Aucune ressource demandee — rechargez la page';
                } else {
                    msg = `Chargement arrete a ${p.charges}/${p.total} — rechargez la page`;
                }
                hint.textContent = msg;
            }
            // Un cache de service worker abime bloque le chargement sans lever
            // d'erreur : on propose au joueur de repartir propre.
            this.proposerReinitialisation();
            const barre = document.getElementById('loading-bar');
            if (barre) barre.style.background = '#e74c3c';
        }, 15000);
        
        await this.transition.fade(0, 1000);

        // Start menu music on first interaction
        const startAudio = () => {
            this.audio.startMenuMusic();
            // Meme contrainte que pour l'audio : Safari exige que la synthese
            // vocale soit amorcee dans un geste de l'utilisateur.
            this.ui.deverrouillerVoix?.();
            this.declarerSessionAudio();
            this.ui.prechargerVoix?.();
            
            if (this.isMobile && document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
            }

            window.removeEventListener('pointerdown', startAudio);
            window.removeEventListener('keydown', startAudio);
        };
        window.addEventListener('pointerdown', startAudio);
        window.addEventListener('keydown', startAudio);
    }

    /** Applique l'etat de la lecture vocale partout a la fois. */
    appliquerReglageVoix(actif) {
        this.config.currentConfig.cardReading = actif;
        // Sauvegarde du reglage avec les autres preferences.
        this.persistence.saveSettings?.(this.config.currentConfig);
        this.ui.lectureActivee = actif;
        this.ui.lastSyncConfig = { ...(this.ui.lastSyncConfig || {}), cardReading: actif };
        // Un seul chemin de synchronisation, pour que les deux panneaux et le
        // moteur ne puissent jamais diverger.
        this.ui.syncConfig?.(this.config.currentConfig);
        if (!actif) this.ui.arreterLecture?.();
        for (const id of ['config-card-reading', 'config-card-reading-ref']) {
            const b = document.getElementById(id);
            if (!b) continue;
            b.textContent = actif ? 'ON' : 'OFF';
            b.style.borderColor = actif ? 'var(--gold)' : 'rgba(197,160,89,0.3)';
        }
    }

    /** Le conseil accompagne les premieres parties, puis se retire. */
    conseilActif() {
        if (this.config.currentConfig.conseil === false) return false;
        if (this.config.currentConfig.conseil === true) return true;
        // Le critere du nombre de parties etait mauvais : quelqu'un qui a
        // beaucoup joue sans jamais gagner n'est pas un joueur experimente,
        // c'est un joueur qu'on abandonne. Le conseil accompagne donc jusqu'a
        // la premiere victoire, puis se retire.
        const stats = this.persistence.getStats() || {};
        const dejaGagne = (stats.unlockedTrophies || []).includes('premiere_victoire');
        return !dejaGagne;
    }

    /**
     * Designe la carte qui laisse les quatre piliers au plus pres de la zone
     * d'harmonie. Meme raisonnement qu'un joueur experimente, rendu visible.
     */
    conseillerCarte(cartes) {
        if (!cartes || !cartes.length) return null;
        const P = ['spirituality', 'love', 'health', 'money'];
        let best = null, meilleur = -Infinity;
        for (const c of cartes) {
            let note = 0;
            for (const p of P) {
                const apres = (this.engine.pillars[p] || 0) + ((c.effects && c.effects[p]) || 0);
                if (apres <= 0 || apres >= 100) note -= 1000;
                else if (apres >= 35 && apres <= 88) note += 10;
                else note -= Math.min(Math.abs(apres - 35), Math.abs(apres - 88)) / 3;
            }
            if (note > meilleur) { meilleur = note; best = c; }
        }
        return best;
    }

    /** Ecrit l'etat courant. Appelable a tout moment, sans effet de bord. */
    sauvegarder() {
        try {
            this.persistence.saveGameProgress({
                ...this.engine,
                duelState:this.duel.isDuelActive?this.duel.getState():null,
                narrativeState: this.narrative.getState()
            });
        } catch (e) {
            console.warn('Sauvegarde impossible', e);
        }
    }

    /**
     * Safari 17+ : declare que la page produit du son de lecture. Sans cette
     * indication, la synthese vocale peut etre releguee sur un canal muet des
     * qu'une musique joue. Pose au demarrage et rappelee au premier contact.
     */
    declarerSessionAudio() {
        try {
            if (navigator.audioSession) navigator.audioSession.type = 'playback';
        } catch (e) { /* non supporte */ }
    }

    registerVisibilityHandler() {
        // Un seul evenement ne suffit pas. Sur iPhone, une application fermee
        // depuis le selecteur ne declenche pas toujours visibilitychange ;
        // pagehide est le seul signal fiable. freeze precede la mise en veille
        // des onglets par Chrome. On ecoute les quatre.
        const enregistrer = () => this.sauvegarder();

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState !== 'hidden') return;
            // La synthese vocale continue de parler en arriere-plan.
            clearTimeout(this._lectureSituationTimer);
            this.ui.arreterLecture?.();
            enregistrer();
        });
        window.addEventListener('pagehide', enregistrer);
        window.addEventListener('beforeunload', enregistrer);
        window.addEventListener('blur', enregistrer);
        document.addEventListener('freeze', enregistrer);

        // Filet supplementaire : une ecriture par minute pendant la partie.
        // Elle ne coute rien et couvre les fermetures brutales -- batterie a
        // plat, application tuee par le systeme -- qui n'emettent aucun signal.
        setInterval(() => {
            if (this.engine && !this.engine.isGameOver && this.engine.turn > 0) enregistrer();
        }, 60000);
    }

    async restartGame() {
        await this.transition.fade(1, 600);
        
        this.audio.playSFX('ui-confirm-sfx', 0.2);
        this.audio.stopDefeatAmbient();
        this.audio.fadeBGM(1.0, 1500, this.engine.turn);
        const simple=!!this.engine.choixSimples;
        this.engine.reset(null,this.engine.selectedPantheon,this.engine.isMeditationMode);
        if(simple)this.engine.activerChoixSimples();
        if(this.duel.isDuelActive)await this.duel.connect(this.engine.currentSeed);
        this.narrative.reset();
        this.persistence.clearGameProgress();
        this.ui.hideGameOver();
        
        this.ui.update(this.engine);
        this.scene.updatePillars(this.engine.pillars, 50);
        
        await this.transition.fade(0, 800);
        this.startNewTurn();
    }

    startNewTurn() {
        if (this.engine.isGameOver) {
            this.handleGameOver();
            return;
        }
        
        console.log(`ÉQUILIBRE - Starting new turn... (Meditation: ${this.engine.isMeditationMode})`);
        
        // Ecrit avant le tirage : la graine enregistree est celle d'avant la
        // main, donc une reprise redonne exactement les memes trois cartes.
        // Les statistiques evoluent d'une partie a l'autre : le moteur doit
        // voir les trophees a jour, sinon le filet ne se retire jamais -- ou
        // pire, ne se declenche jamais.
        if(!this.duel.isDuelActive)this.engine.globalStats=this.persistence.getStats();
        // L'etape courante pilote la duree de la partie. Une sauvegarde
        // anterieure au parcours ne contient pas cette valeur : sans ce
        // rappel, la partie tournait indefiniment, sans victoire ni defaite.
        this.engine.etapeParcours = this.duel.isDuelActive?2:this.persistence.getEtape();
        // Partie reprise plus longue que son etape : on la cloture proprement
        // au lieu de la laisser courir sans fin.
        if (!this.engine.isGameOver && !this.engine.isMeditationMode
            && this.engine.turn > this.engine.semainesRequises()) {
            this.engine.isVictory = this.engine.pilliersEnZone() === 4;
            this.engine.isGameOver = true;
        }
        this.sauvegarder();
        this.ui.showAutosave();
        
        this.ui.updateHistory(this.engine.history);
        if(!this.engine.choixSimples)this.audio.playSFX('card-appear-sfx', 0.15);
        
        // Narrative injection logic
        if(!this.duel.isDuelActive&&!this.engine.choixSimples)this.narrative.checkTriggers(this.engine);
        let cards = this.engine.generateCards(3);
        if(!this.duel.isDuelActive&&!this.engine.choixSimples)cards = this.narrative.injectNarrativeCards(cards);
        const situation=document.getElementById('situation-simple');
        const s=this.engine.situationSimple();
        document.body.classList.toggle('choix-simples',!!s);
        sourceVisible(!!s);
        this.scene.choixSimples=!!s;
        if(situation){
            clearTimeout(this._lectureSituationTimer);
            situation.hidden=!s;
            if(s){
                this.ui.preparerLectureSituation();
                document.getElementById('situation-numero').textContent='· '+(this.engine.turn+1)+' / 10';
                document.getElementById('situation-titre').textContent=s[1];
                document.getElementById('situation-texte').textContent=s[2];
                situation.classList.remove('ouverture');void situation.offsetWidth;situation.classList.add('ouverture');
                this.audio.playSFX('card-appear-sfx',0.22);
                const lire=()=>{clearTimeout(this._lectureSituationTimer);this.ui.lireSituation(s[1],s[2]);};
                document.getElementById('situation-lecture').onclick=lire;
                this._lectureSituationTimer=setTimeout(()=>{if(!this.isPaused&&!document.hidden&&!situation.hidden)lire();else this.ui.arreterLecture();},850);
            }
        }
        
        this.scene.createCardMeshes(cards);
        // Reperes du carrousel : autant de points que de cartes, le point
        // allonge marquant celle qui est centree.
        // Conseil : la carte qui preserve le mieux l'equilibre. Elargir la
        // cible de victoire n'aidait pas le debutant -- il ne la visait jamais.
        // Lui montrer quelle carte y mene le transforme en joueur qui vise.
        this.ui.montrerConseil(this.engine.choixSimples?null:this.conseillerCarte(cards), !this.engine.choixSimples&&this.conseilActif());

        const cc = this.scene.cardController;
        if (cc) {
            cc.onCarteActive = (i, n) => this.ui.majReperesCarrousel(i, n);
            // Les points et le rappel du geste n'apparaissent que si la rangee
            // defile vraiment -- soit une quatrieme carte en portrait.
            this.ui.majReperesCarrousel(cc.indexActif, cc.indexActif === null
                || cc.indexActif === undefined ? 0 : cards.length);
        }

        // Update UI with refresh availability if needed
        if (!this.engine.choixSimples && (this.engine.activeModifiers.refreshAvailable || this.engine.refreshCredits>0)) {
            this.ui.showRefreshButton(true, () => {
                this.audio.playSFX('card-fade-sfx', 0.2);
                if(this.engine.activeModifiers.refreshAvailable)this.engine.activeModifiers.refreshAvailable=false;
                else this.engine.refreshCredits--;
                this.ui.showRefreshButton(false);
                this.startNewTurn();
            });
        } else {
            this.ui.showRefreshButton(false);
        }
    }

    /** Bouton de secours : purge le cache hors-ligne et recharge. */
    proposerReinitialisation() {
        if (document.getElementById('reset-cache-btn')) return;
        const b = document.createElement('div');
        b.id = 'reset-cache-btn';
        b.textContent = 'VIDER LE CACHE ET RECHARGER';
        b.style.cssText = 'margin-top:26px;padding:10px 22px;border:1px solid #e74c3c;'
            + 'color:#ff9d9d;font-family:var(--font-serif);font-size:0.68rem;'
            + 'letter-spacing:2px;cursor:pointer;pointer-events:auto;background:rgba(60,10,10,0.5);';
        b.addEventListener('click', async () => {
            try {
                if ('caches' in window) {
                    const cles = await caches.keys();
                    await Promise.all(cles.map(k => caches.delete(k)));
                }
                if (navigator.serviceWorker) {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(regs.map(r => r.unregister()));
                }
            } catch (e) {
                console.warn('Purge partielle', e);
            }
            location.reload();
        });
        document.getElementById('loading-screen')?.appendChild(b);
    }

    /**
     * Avancement du parcours. Une etape franchie est acquise pour toujours ;
     * un echec ne fait rejouer que l'etape en cours. C'est ce qui fait que
     * perdre ne coute plus une soiree, mais une etape.
     */
    avancerParcours() {
        if(this.duel.isDuelActive)return null;
        const PARC = this.parcours || [];
        const etape = this.persistence.getEtape();
        if (!this.engine.isVictory) return { franchie: false, etape };

        const e = PARC[Math.min(etape, PARC.length - 1)];
        if (e) this.persistence.ajouterSemaines(e.semaines);

        if (etape >= PARC.length - 1) {
            // Le Sommet : la vie recommence, les titres restent.
            this.persistence.setEtape(0);
            this.persistence.setSemaines(0);
            return { franchie: true, sommet: true, etape, suivante: PARC[0] };
        }
        this.persistence.setEtape(etape + 1);
        return { franchie: true, sommet: false, etape, suivante: PARC[etape + 1] };
    }

    async handleGameOver() {
        sourceVisible(false);
        // Toute partie terminee entre au classement. Sans cet appel, l'ecran
        // restait vide quel que soit le nombre de parties.
        // Avancement du parcours avant toute chose : l'ecran de fin doit
        // annoncer l'etape franchie et proposer la suivante.
        this.resultatParcours = this.engine.choixSimples?null:this.avancerParcours();
        clearTimeout(this._lectureSituationTimer);this.ui.arreterLecture();
        const situation=document.getElementById('situation-simple');if(situation)situation.hidden=true;
        if (this.resultatParcours && this.parcours) {
            const e = this.parcours[Math.min(this.resultatParcours.etape, this.parcours.length - 1)];
            this.resultatParcours.tenue = e ? e.cle : 'duree_generique';
            // Le titre de l'etape reellement franchie, pas celui de la premiere.
            this.resultatParcours.titreEtape = e ? e.titre : null;
        }

        if (this.engine.turn > 0 && !this.engine.choixSimples) {
            this.persistence.saveScore(
                this.config.currentConfig.playerName || 'Gardien',
                Math.round(this.engine.score)
            );
        }
        // Une partie terminee ouvre le menu complet.
        this.home.appliquerModeDecouverte(this.persistence.getStats().gamesPlayed + 1);
        const isNewRecord = this.engine.score >= this.engine.highScore && this.engine.score > 0;
        
        // Sync Duel score
        this.duel.updateMyScore(this.engine.score, this.engine.turn, true);
        
        // Slight delay for the player to see the broken balance
        await new Promise(r => setTimeout(r, 1000));
        
        await this.transition.fade(1, 1000);
        
        this.audio.transitionToDefeat();
        this.audio.playSFX(isNewRecord ? 'victory-sfx' : 'game-over-sfx', isNewRecord ? 0.3 : 0.1);
        
        if(!this.engine.choixSimples)this.persistence.recordGameEnd(this.engine.score, this.engine.turn, this.engine.reachedHarmony, this.engine.unlockedTrophies);
        
        // Save to leaderboard if Duel mode
        if (this.duel.isDuelActive) {
            const playerName = this.persistence.getConfig().playerName || (this.config.currentConfig.language === 'fr' ? 'Gardien' : 'Guardian');
            this.persistence.saveDuelScore(playerName, this.engine.score);
        }

        this.persistence.clearGameProgress();
        this.home.updateContinueButton(false);
        
        this.engine.resultatParcours = this.resultatParcours;
        this.engine.semainesAcquises = this.persistence.getSemainesAcquises();
        if(this.engine.choixSimples){this.engine.miroir=portrait(this.engine.choixSimples);this.engine.parcoursPersonnel=recordJourney(this.engine.choixSimples);}
        this.ui.showGameOver(this.engine, isNewRecord, this.duel.isDuelActive ? this.opponentData : null);
        
        await this.transition.fade(0, 1500);
    }

    setupPointerEvents() {
        window.addEventListener('pointermove', (e) => this.handlePointer(e, 'move'));

        // --- Balayage du carrousel ---
        // En portrait les cartes sont affichees en grand, une a la fois. Un
        // glissement horizontal fait defiler la rangee ; un simple appui, sans
        // glissement, reste un choix de carte.
        this._geste = null;
        window.addEventListener('pointerdown', (e) => {
            this._geste = { x: e.clientX, y: e.clientY, t: Date.now(), glisse: false };
        });
        window.addEventListener('pointermove', (e) => {
            const g = this._geste;
            if (!g || g.glisse) return;
            const dx = e.clientX - g.x, dy = e.clientY - g.y;
            if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy) * 1.4) {
                g.glisse = true;
                if (this.carrouselActif()) {
                    this.scene.cardController.deplacerCarrousel(dx < 0 ? 1 : -1);
                    this.audio.playSFX('card-hover-sfx', 0.12);
                }
            }
        });
        window.addEventListener('pointerup', (e) => {
            const g = this._geste;
            this._geste = null;
            if (!g || g.glisse) return;              // c'etait un balayage
            this.handlePointer(e, 'click');
        });
        window.addEventListener('pointercancel', () => { this._geste = null; });

        // Right-click / secondary button flips a card for inspection (reveals the
        // ornate back). Suppress the browser context menu over the game canvas.
        window.addEventListener('contextmenu', (e) => {
            if (this.engine.isGameOver || this.isPaused || this.isProcessing) return;
            const mesh = this.getCardUnderPointer(e);
            if (mesh) {
                e.preventDefault();
                this.audio.playSFX('card-flip-sfx', 0.25);
                this.scene.cardController.flip(mesh);
            }
        });
    }

    /** Returns the card mesh currently under the given pointer event, or null. */
    getCardUnderPointer(event) {
        if (!this.scene.cardController) return null;
        const rect = this.scene.renderer.domElement.getBoundingClientRect();
        this.scene.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.scene.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.scene.raycaster.setFromCamera(this.scene.mouse, this.scene.camera);
        const intersects = this.scene.raycaster.intersectObjects(this.scene.cards);
        return intersects.length > 0 ? intersects[0].object : null;
    }

    setupKeyboardEvents() {
        window.addEventListener('keydown', (e) => {
            if (this.engine.isGameOver || this.isPaused || this.isProcessing) {
                if (!this.isProcessing && this.engine.isGameOver && (e.code === 'Space' || e.code === 'Enter')) this.restartGame();
                return;
            }

            // "Choix supplementaire" distribue une 4e carte : la borne fixe
            // a 3 la rendait injoignable au clavier.
            const meshes = this.scene.cards;
            const cardIndex = parseInt(e.key) - 1;
            if (cardIndex >= 0 && cardIndex < meshes.length) {
                if (meshes[cardIndex]) {
                    const mesh = meshes[cardIndex];
                    if (this.selectedCard === mesh) {
                        this.confirmCard(mesh.userData.data, mesh);
                    } else {
                        this.selectCard(mesh);
                        this.ui.showCardInfo(mesh.userData.data, this.engine.pillars, this.engine.previewCard(mesh.userData.data));
                    }
                }
            }

            if ((e.code === 'ArrowLeft' || e.code === 'ArrowRight') && this.carrouselActif()) {
                this.scene.cardController.deplacerCarrousel(e.code === 'ArrowRight' ? 1 : -1);
                return;
            }

            if (e.code === 'Escape' && this.selectedCard) {
                this.scene.cardController.deselect(this.selectedCard);
                this.scene.resetCamera();
                this.selectedCard = null;
                this.ui.showCardInfo(null);
            }
        });
    }

    /** Le carrousel n'est actif qu'en portrait, avec des cartes en jeu. */
    carrouselActif() {
        const cc = this.scene && this.scene.cardController;
        return !!(cc && cc.cards.length > 1 && cc.indexActif !== null && cc.indexActif !== undefined);
    }

    handlePointer(event, type) {
        if(event.target?.closest?.('#card-info,button,input,select,a,[role="dialog"]'))return;
        if (this.engine.isGameOver || this.isPaused || this.isProcessing) return;
        if (event.pointerType === 'touch' && !event.isPrimary) return;

        const rect = this.scene.renderer.domElement.getBoundingClientRect();
        this.scene.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.scene.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.scene.raycaster.setFromCamera(this.scene.mouse, this.scene.camera);
        const intersects = this.scene.raycaster.intersectObjects(this.scene.cards);

        if (intersects.length > 0) {
            const mesh = intersects[0].object;
            const data = mesh.userData.data;

            if (type === 'click') {
                const needsConfirm = this.config.currentConfig.confirmClick;
                if (this.selectedCard === mesh || !needsConfirm) {
                    this.confirmCard(data, mesh);
                } else {
                    this.selectCard(mesh);
                    // Le panneau #card-info n'etait ouvert que par le survol.
                    // Sur tactile il n'y a pas de survol : le joueur
                    // selectionnait une carte sans jamais pouvoir lire son
                    // titre, sa description ni ses effets. Le raccourci
                    // clavier le faisait deja, pas le pointeur.
                    this.ui.showCardInfo(data, this.engine.pillars, this.engine.previewCard(data));
                }
            } else {
                if (this.lastHovered !== mesh) {
                    if (this.lastHovered) this.scene.cardController.setHover(this.lastHovered, false);
                    this.lastHovered = mesh;
                    this.scene.cardController.setHover(mesh, true);
                    if(!this.ui.prioriteSituation)this.audio.playSFX('card-hover-sfx', 0.15);
                    this.ui.showCardInfo(data, this.engine.pillars, this.engine.previewCard(data));
                }
                document.body.style.cursor = 'pointer';
            }
        } else {
            if (type === 'click' && this.selectedCard) {
                this.scene.cardController.deselect(this.selectedCard);
                this.scene.resetCamera();
                this.selectedCard = null;
                this.ui.showCardInfo(null);
            }
            
            if (type === 'move') {
                if (this.lastHovered) {
                    this.scene.cardController.setHover(this.lastHovered, false);
                    this.lastHovered = null;
                }
                this.ui.showCardInfo(null);
                document.body.style.cursor = 'default';
            }
        }
    }

    selectCard(mesh) {
        if (this.selectedCard) {
            this.scene.cardController.deselect(this.selectedCard);
        }
        this.selectedCard = mesh;
        this.scene.cardController.select(mesh);
        this.scene.onCardSelected(mesh.userData.data.isNarrative);
        this.audio.refreshActiveVolumes(true, this.engine.turn);
        this.audio.playSFX('card-flip-sfx', 0.25);
    }

    continuerApresSource() {
        const rewards=this._sourceRewards||[];this._sourceRewards=[];
        celebrerSource(rewards,()=>{this.isProcessing=false;this.startNewTurn();},()=>this.audio.playSFX('harmony-sfx',0.35));
    }

    terminerDecision() {
        const h=this.engine.choixSimples?.history.at(-1);
        const echo=h?.echo;
        const dialog=document.getElementById('echo-destin');
        if(!echo||!dialog||!dialog.showModal){this.continuerApresSource();return;}
        document.getElementById('retour-decision').hidden=true;
        this.ui.arreterLecture();
        dialog.querySelector('[data-echo-origine]').textContent='Une décision du tour '+echo.origine+' vous rattrape…';
        dialog.querySelector('[data-echo-titre]').textContent=echo.titre;
        const image=dialog.querySelector('[data-echo-image]');const art=dessinerVisuel(visuelEcho(echo),'#bda875');if(image){image.replaceChildren();if(art)image.append(art);image.hidden=!art;}
        dialog.querySelector('[data-echo-texte]').textContent=echo.texte;
        dialog.querySelector('[data-echo-note]').textContent=echo.note;
        const rows=dialog.querySelector('[data-echo-effets]');rows.replaceChildren();
        ['Spiritualité','Amour','Santé','Argent'].forEach((name,i)=>{const row=document.createElement('div');row.textContent=name+' : '+(echo.delta[i]>0?'+':'')+echo.delta[i];rows.append(row);});
        dialog.addEventListener('close',()=>{this.ui.arreterLecture();this.continuerApresSource();},{once:true});
        jouerVision(echo,this.audio,()=>{dialog.showModal();this.ui.lireDestin(echo.texte);});
    }

    confirmCard(data, mesh) {
        if (this.isProcessing) return;
        clearTimeout(this._lectureSituationTimer);
        this.ui.arreterLecture();
        this.isProcessing = true;

        this.engine.applyCard(data);
        this._sourceRewards=this.engine.choixSimples?enregistrerSource(this.engine.choixSimples):[];
        if(this.engine.choixSimples){const h=this.engine.choixSimples.history.at(-1);if(h){const e=document.getElementById('retour-decision');e.textContent=explicationChoix(h.situation,h.choice);e.hidden=false;clearTimeout(this._retourDecisionTimer);this._retourDecisionTimer=setTimeout(()=>{e.hidden=true;},6500);}}
        if(!this.engine.choixSimples)this.narrative.onCardPlayed(data);
        this.scene.resetCamera();
        this.audio.refreshActiveVolumes(false, this.engine.turn);
        this.audio.playSFX('card-fade-sfx', 0.25);
        
        // Sync Duel score
        this.duel.updateMyScore(this.engine.score, this.engine.turn, false);
        
        if (this.engine.reachedHarmony) {
            this.audio.playSignature();
            this.audio.playSFX('harmony-sfx', 0.3);
        } else {
            // Synergy sound feedback
            if (this.engine.activeSynergy) {
                const sfxName = this.engine.activeSynergy.type === 'resonance' ? 'ui-confirm-sfx' : 'card-fade-sfx';
                this.audio.playSFX(sfxName, 0.2);
            }
            this.audio.playSFX(`sfx-${data.category}`, 0.2) || this.audio.playSFX('card-play-sfx', 0.25);
            this.audio.playSFX('pillar-update-sfx', 0.1);
        }

        // Si play() echouait avant de lancer son animation, le callback ne
        // partait jamais : isProcessing restait a true et le jeu se figeait
        // definitivement, sans erreur visible pour le joueur.
        try {
            this.scene.cardController.play(mesh, () => {
                this.terminerDecision();
            });
        } catch (err) {
            console.error('Animation de carte interrompue :', err);
            this.terminerDecision();
        }
        this.selectedCard = null;
        this.lastHovered = null;
        // Sans survol pour le refermer, le panneau restait fige sur la carte
        // deja jouee pendant tout le tour suivant.
        this.ui.showCardInfo(null);
        this.ui.update(this.engine);
        this.scene.updatePillars(this.engine.pillars, this.engine.reachedHarmony ? 0 : 60, this.engine.reachedHarmony, data, this.engine.triggeredAbilities);
        // Le filet vient de jouer : on l'annonce, sinon le joueur ne comprend
        // ni pourquoi il survit, ni ce qu'il a fait de travers.
        if (this.engine.dernierFilet) {
            this.ui.montrerFilet(this.engine.dernierFilet);
            this.audio.playSFX('ui-confirm-sfx', 0.25);
            this.engine.dernierFilet = null;
        }
    }
}

initialiserSource();
new App();

const nomsParcours=['Spiritualité','Amour','Santé','Argent'];
document.getElementById('personal-journey-btn')?.addEventListener('click',()=>{const d=journeyStats();const el=document.getElementById('personal-journey-content');el.replaceChildren();const h=document.createElement('p');h.textContent=d.games+' parties terminées'+(d.master?' · Maître de l’équilibre':'');el.append(h);d.scores.forEach((v,i)=>{const p=document.createElement('p');p.textContent=nomsParcours[i]+' : '+(v===null?'À découvrir':v+' / 100')+' · '+d.counts[i]+' décisions évaluées';el.append(p);});const p=document.createElement('p');p.textContent='Objectif : au moins 30 parties, 40 décisions par pilier et 75/100 dans chacun. Portrait ludique, pas un test psychologique.';el.append(p);document.getElementById('personal-journey').showModal();});
