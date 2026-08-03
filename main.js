/**
 * ÉQUILIBRE - Main Application Controller (Mediator)
 * Orchestrates all modules and handles the game loop.
 */

import { GameEngine } from './game-engine.js';
import { SceneManager } from './scene-manager.js';
import { UIController } from './ui-controller.js';
import { AudioController } from './audio-controller.js';
import { HomeController } from './home-controller.js';
import { PersistenceController } from './persistence-controller.js';
import { ConfigController } from './config-controller.js';
import { NarrativeController } from './narrative-controller.js';
import { TransitionController } from './transition-controller.js';
import { DuelController } from './duel-controller.js';

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
        this.audio = new AudioController(this.persistence.getSettings());
        
        this.duel = new DuelController({
            onOpponentUpdate: (data) => {
                this.opponentData = data;
                this.ui.updateOpponent(data);
            }
        });
        
        this.home = new HomeController({
            onPlay: async (isContinue, pantheon = null, meditationMode = false) => {
                this.duel.isDuelActive = false;
                this.opponentData = null;
                this.ui.showDuelUI(false);
                await this.transition.fade(1, 600);
                
                this.audio.playSignature();
                this.audio.playSFX('ui-confirm-sfx', 0.2);
                this.audio.startBGM(meditationMode);
                
                if (!isContinue) {
                    this.engine.reset(null, pantheon, meditationMode);
                    this.narrative.reset();
                    this.persistence.clearGameProgress();
                }
                
                this.home.startExperience();
                
                await this.transition.fade(0, 800);
                
                this.scene.playIntro(() => {
                    // Initiation : trois messages avant la premiere main, une
                    // seule fois dans la vie du joueur.
                    if (!this.persistence.getStats().gamesPlayed && !this.initiationFaite) {
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
                
                this.engine.reset();
                this.narrative.reset();
                this.persistence.clearGameProgress();
                
                await this.duel.connect();
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
            },
            onPauseStateChange: (isPaused) => {
                this.isPaused = isPaused;
                this.audio.playSFX('ui-click-sfx', 0.1);
                if (isPaused) {
                    this.audio.fadeBGM(0.3, 500);
                } else {
                    this.audio.fadeBGM(1.0, 500, this.engine.turn);
                }
            },
            getTranslation: (key) => this.config.getTranslation(key),
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

    /** Ecrit l'etat courant. Appelable a tout moment, sans effet de bord. */
    sauvegarder() {
        try {
            this.persistence.saveGameProgress({
                ...this.engine,
                narrativeState: this.narrative.getState()
            });
        } catch (e) {
            console.warn('Sauvegarde impossible', e);
        }
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
        this.engine.reset(null, this.engine.selectedPantheon, this.engine.isMeditationMode);
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
        this.sauvegarder();
        this.ui.showAutosave();
        
        this.ui.updateHistory(this.engine.history);
        this.audio.playSFX('card-appear-sfx', 0.15);
        
        // Narrative injection logic
        this.narrative.checkTriggers(this.engine);
        let cards = this.engine.generateCards(3);
        cards = this.narrative.injectNarrativeCards(cards);
        
        this.scene.createCardMeshes(cards);

        // Update UI with refresh availability if needed
        if (this.engine.activeModifiers.refreshAvailable) {
            this.ui.showRefreshButton(true, () => {
                this.audio.playSFX('card-fade-sfx', 0.2);
                this.engine.activeModifiers.refreshAvailable = false;
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

    async handleGameOver() {
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
        
        this.persistence.recordGameEnd(this.engine.score, this.engine.turn, this.engine.reachedHarmony, this.engine.unlockedTrophies);
        
        // Save to leaderboard if Duel mode
        if (this.duel.isDuelActive) {
            const playerName = this.persistence.getConfig().playerName || (this.config.currentConfig.language === 'fr' ? 'Gardien' : 'Guardian');
            this.persistence.saveDuelScore(playerName, this.engine.score);
        }

        this.persistence.clearGameProgress();
        this.home.updateContinueButton(false);
        
        this.ui.showGameOver(this.engine, isNewRecord, this.duel.isDuelActive ? this.opponentData : null);
        
        await this.transition.fade(0, 1500);
    }

    setupPointerEvents() {
        window.addEventListener('pointermove', (e) => this.handlePointer(e, 'move'));
        window.addEventListener('pointerdown', (e) => this.handlePointer(e, 'click'));

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
                if (this.engine.isGameOver && (e.code === 'Space' || e.code === 'Enter')) this.restartGame();
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
                        this.ui.showCardInfo(mesh.userData.data, this.engine.pillars);
                    }
                }
            }

            if (e.code === 'Escape' && this.selectedCard) {
                this.scene.cardController.deselect(this.selectedCard);
                this.scene.resetCamera();
                this.selectedCard = null;
                this.ui.showCardInfo(null);
            }
        });
    }

    handlePointer(event, type) {
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
                    this.ui.showCardInfo(data, this.engine.pillars);
                }
            } else {
                if (this.lastHovered !== mesh) {
                    if (this.lastHovered) this.scene.cardController.setHover(this.lastHovered, false);
                    this.lastHovered = mesh;
                    this.scene.cardController.setHover(mesh, true);
                    this.audio.playSFX('card-hover-sfx', 0.15);
                    this.ui.showCardInfo(data, this.engine.pillars);
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

    confirmCard(data, mesh) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        this.engine.applyCard(data);
        this.narrative.onCardPlayed(data);
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
                this.isProcessing = false;
                this.startNewTurn();
            });
        } catch (err) {
            console.error('Animation de carte interrompue :', err);
            this.isProcessing = false;
            this.startNewTurn();
        }
        this.selectedCard = null;
        this.lastHovered = null;
        // Sans survol pour le refermer, le panneau restait fige sur la carte
        // deja jouee pendant tout le tour suivant.
        this.ui.showCardInfo(null);
        this.ui.update(this.engine);
        this.scene.updatePillars(this.engine.pillars, this.engine.reachedHarmony ? 0 : 60, this.engine.reachedHarmony, data, this.engine.triggeredAbilities);
    }
}

new App();
