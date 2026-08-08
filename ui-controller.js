import { PILLAR_DEFINITIONS, RARITY_DEFINITIONS, MECHANICS } from './game-config.js';

export class UIController {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.elements = {
            score: document.getElementById('score-value'),
            turn: document.getElementById('turn-value'),
            gameOver: document.getElementById('game-over'),
            finalScore: document.getElementById('final-score'),
            cardInfo: document.getElementById('card-info'),
            refreshBtn: document.getElementById('refresh-hand-btn'),
            synergyStatus: document.getElementById('synergy-status'),
            cardTitle: document.getElementById('card-title'),
            cardRarity: document.getElementById('card-rarity'),
            cardDesc: document.getElementById('card-desc'),
            cardEffects: document.getElementById('card-effects'),
            tutorialLayer: document.getElementById('tutorial-layer'),
            tutorialStep: document.getElementById('tutorial-step'),
            tutorialText: document.getElementById('tutorial-text'),
            tutorialNext: document.getElementById('tutorial-next'),
            tutorialSkip: document.getElementById('tutorial-skip'),
            perilAlert: document.getElementById('peril-alert'),
            carouselDots: document.getElementById('carousel-dots'),
            carouselHint: document.getElementById('carousel-hint'),
            gameOverCause: document.getElementById('game-over-cause'),
            victoryTitle: document.getElementById('victory-rank'),
            gameOverBanner: document.getElementById('game-over-banner'),
            fireworks: document.getElementById('fireworks'),
            harmonyStreak: document.getElementById('harmony-streak'),
            adviceBox: document.getElementById('advice-box'),
            goalFill: document.getElementById('goal-fill'),
            goalBox: document.getElementById('goal-box'),
            semaineRestante: document.getElementById('semaine-restante'),
            netMessage: document.getElementById('net-message'),
            harmonyBadge: document.getElementById('harmony-badge'),
            settingsBtn: document.getElementById('settings-btn'),
            settingsMenu: document.getElementById('settings-menu'),
            volMaster: document.getElementById('vol-master'),
            volMusic: document.getElementById('vol-music'),
            volSfx: document.getElementById('vol-sfx'),
            volVoice: document.getElementById('vol-voice'),
            lifetime: document.getElementById('lifetime-value'),
            legacyTotal: document.getElementById('legacy-total'),
            gameOverTitle: document.querySelector('#game-over h2'),
            gameOverDesc: document.querySelector('#game-over p'),
            duelBox: document.getElementById('duel-status-box'),
            opponentScore: document.getElementById('opponent-score-value'),
            opponentStatus: document.getElementById('opponent-status-text'),
            configLang: document.getElementById('config-lang'),
            configTheme: document.getElementById('config-theme'),
            configLightMode: document.getElementById('config-light-mode'),
            configCardReading: document.getElementById('config-card-reading'),
            configConseil: document.getElementById('config-conseil'),
            historyBtn: document.getElementById('history-btn'),
            historyOverlay: document.getElementById('history-overlay'),
            historyList: document.getElementById('history-list'),
            closeHistoryBtn: document.getElementById('close-history-btn'),
            activeEventsList: document.getElementById('active-events-container'),
            shareBtn: document.getElementById('share-btn'),
            settingsOverlay: document.getElementById('settings-overlay'),
            closeSettingsBtn: document.getElementById('close-settings-btn'),
            autosave: document.getElementById('autosave-indicator'),
            volMasterRef: document.getElementById('vol-master-ref'),
            volMusicRef: document.getElementById('vol-music-ref'),
            volSfxRef: document.getElementById('vol-sfx-ref'),
            volMasterLabel: document.getElementById('master-vol-label'),
            volMusicLabel: document.getElementById('music-vol-label'),
            volSfxLabel: document.getElementById('sfx-vol-label'),
            configLangRef: document.getElementById('config-lang-ref'),
            configThemeRef: document.getElementById('config-theme-ref'),
            configLightModeRef: document.getElementById('config-light-mode-ref'),
            configConfirmClickRef: document.getElementById('config-confirm-click-ref'),
            configScreenShakeRef: document.getElementById('config-screen-shake-ref'),
            resetDataBtn: document.getElementById('reset-data-btn'),
            pauseOverlay: document.getElementById('pause-overlay'),
            resumeBtn: document.getElementById('resume-btn'),
            pauseSettingsBtn: document.getElementById('pause-settings-btn'),
            quitBtn: document.getElementById('quit-btn'),
            opponentFinalBox: document.getElementById('opponent-final-box'),
            opponentFinalScore: document.getElementById('opponent-final-score'),
            duelResultBanner: document.getElementById('duel-result-banner'),
            pillarsContainer: document.getElementById('pillars-container'),
            pillars: {},
            previews: {},
            dangerVignette: document.getElementById('danger-vignette'),
            pantheonBadge: document.getElementById('pantheon-badge'),
            meditationBadge: document.getElementById('meditation-badge'),
            leaderboardOverlay: document.getElementById('leaderboard-overlay'),
            leaderboardList: document.getElementById('leaderboard-list'),
            closeLeaderboardBtn: document.getElementById('close-leaderboard-btn'),
            configPlayerName: document.getElementById('config-player-name')
        };
        
        this.initDynamicPillars();
        this.initListeners();
    }

    initDynamicPillars() {
        if (!this.elements.pillarsContainer) return;
        
        this.elements.pillarsContainer.innerHTML = '';
        
        for (const pillarId in PILLAR_DEFINITIONS) {
            const pillar = PILLAR_DEFINITIONS[pillarId];
            const item = document.createElement('div');
            item.className = 'pillar-item';
            
            const localizedName = this.callbacks.getTranslation(`pillar_${pillarId}`) || pillar.name;
            
            item.innerHTML = `
                <img src="${pillar.icon}" class="pillar-icon" title="${localizedName}">
                <div class="pillar-bar">
                    <div id="pillar-${pillarId}" class="pillar-fill" style="background: linear-gradient(to top, ${pillar.color}, #ffffff);"></div>
                    <div id="preview-${pillarId}" class="pillar-preview"></div>
                </div>
            `;
            
            this.elements.pillarsContainer.appendChild(item);
            
            // Register refs
            this.elements.pillars[pillarId] = document.getElementById(`pillar-${pillarId}`);
            this.elements.previews[pillarId] = document.getElementById(`preview-${pillarId}`);
        }
    }

    initListeners() {
        this.elements.settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showSettings(true);
        });

        this.elements.closeSettingsBtn?.addEventListener('click', () => {
            this.showSettings(false);
        });

        this.elements.historyBtn?.addEventListener('click', () => {
            this.elements.historyOverlay?.classList.remove('hidden');
        });

        this.elements.closeHistoryBtn?.addEventListener('click', () => {
            this.elements.historyOverlay?.classList.add('hidden');
        });

        this.elements.closeLeaderboardBtn?.addEventListener('click', () => {
            this.elements.leaderboardOverlay?.classList.add('hidden');
        });

        this.elements.shareBtn?.addEventListener('click', () => {
            const text = `J'ai maintenu l'équilibre pendant ${this.elements.turn.textContent} tours dans ÉQUILIBRE DES CHOIX ! Score : ${this.elements.finalScore.textContent}.`;
            if (navigator.share) {
                navigator.share({
                    title: 'ÉQUILIBRE DES CHOIX',
                    text: text,
                    url: window.location.href
                }).catch(() => {});
            } else {
                navigator.clipboard.writeText(text);
                alert("Score copié dans le presse-papier !");
            }
        });

        // Dual volume controls synchronization
        const handleMaster = (val) => {
            if (this.elements.volMaster) this.elements.volMaster.value = val;
            if (this.elements.volMasterRef) this.elements.volMasterRef.value = val;
            if (this.elements.volMasterLabel) this.elements.volMasterLabel.textContent = `${Math.round(val * 100)}%`;
            this.callbacks.onVolumeChange('master', val);
        };
        const handleMusic = (val) => {
            if (this.elements.volMusic) this.elements.volMusic.value = val;
            if (this.elements.volMusicRef) this.elements.volMusicRef.value = val;
            if (this.elements.volMusicLabel) this.elements.volMusicLabel.textContent = `${Math.round(val * 100)}%`;
            this.callbacks.onVolumeChange('music', val);
        };
        const handleSfx = (val) => {
            if (this.elements.volSfx) this.elements.volSfx.value = val;
            if (this.elements.volSfxRef) this.elements.volSfxRef.value = val;
            if (this.elements.volSfxLabel) this.elements.volSfxLabel.textContent = `${Math.round(val * 100)}%`;
            this.callbacks.onVolumeChange('sfx', val);
        };

        this.elements.volMaster?.addEventListener('input', (e) => handleMaster(parseFloat(e.target.value)));
        this.elements.volMasterRef?.addEventListener('input', (e) => handleMaster(parseFloat(e.target.value)));
        this.elements.volMusic?.addEventListener('input', (e) => handleMusic(parseFloat(e.target.value)));
        this.elements.volMusicRef?.addEventListener('input', (e) => handleMusic(parseFloat(e.target.value)));
        this.elements.volSfx?.addEventListener('input', (e) => handleSfx(parseFloat(e.target.value)));
        this.elements.volSfxRef?.addEventListener('input', (e) => handleSfx(parseFloat(e.target.value)));
        
        this.elements.volVoice?.addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            this.volumeVoix = v;
            // Couper le curseur coupe la lecture en cours.
            if (v <= 0) this.arreterLecture();
            this.callbacks.onVolumeChange('voice', v);
        });

        this.elements.tutorialNext?.addEventListener('click', () => {
            this.etapeTuto++;
            if (this.etapeTuto >= 4) this.fermerInitiation();
            else this.afficherEtapeTuto();
        });
        this.elements.tutorialSkip?.addEventListener('click', () => this.fermerInitiation());


        this.elements.configLang.addEventListener('change', (e) => this.callbacks.onConfigChange('language', e.target.value));
        this.elements.configLangRef.addEventListener('change', (e) => this.callbacks.onConfigChange('language', e.target.value));
        
        this.elements.configPlayerName?.addEventListener('change', (e) => this.callbacks.onConfigChange('playerName', e.target.value));

        this.elements.configTheme.addEventListener('change', (e) => this.callbacks.onConfigChange('theme', e.target.value));
        this.elements.configThemeRef.addEventListener('change', (e) => this.callbacks.onConfigChange('theme', e.target.value));
        
        const handleLightMode = () => {
            this.callbacks.onConfigChange('lightMode', !this.lastSyncConfig?.lightMode);
        };
        this.elements.configLightMode.addEventListener('click', handleLightMode);
        this.elements.configLightModeRef.addEventListener('click', handleLightMode);

        // Lecture des cartes : commande explicite. La couper arrete aussi
        // l'enonce en cours, sans attendre la carte suivante.
        // Conseil : automatique, toujours, ou jamais.
        this.elements.configConseil?.addEventListener('click', () => {
            const suite = { null: true, true: false, false: null };
            const actuel = this.lastSyncConfig?.conseil ?? null;
            this.callbacks.onConfigChange('conseil', suite[String(actuel)]);
        });

        this.elements.configCardReading?.addEventListener('click', () => {
            const actif = !(this.lastSyncConfig?.cardReading ?? true);
            this.callbacks.onConfigChange('cardReading', actif);
            if (!actif) this.arreterLecture();
        });

        this.elements.configConfirmClickRef?.addEventListener('click', () => {
            this.callbacks.onConfigChange('confirmClick', !this.lastSyncConfig?.confirmClick);
        });

        this.elements.configScreenShakeRef?.addEventListener('click', () => {
            this.callbacks.onConfigChange('screenShake', !this.lastSyncConfig?.screenShake);
        });

        this.elements.resetDataBtn?.addEventListener('click', () => {
            if (confirm("Voulez-vous vraiment réinitialiser tout votre héritage ? Cette action est irréversible.")) {
                this.callbacks.onResetData();
            }
        });

        this.elements.resumeBtn?.addEventListener('click', () => this.showPause(false));
        this.elements.pauseSettingsBtn?.addEventListener('click', () => this.showSettings(true));
        this.elements.quitBtn?.addEventListener('click', () => this.callbacks.onBackToMenu());

        document.getElementById('restart-btn').addEventListener('click', () => this.callbacks.onRestart());
        document.getElementById('restart-btn').addEventListener('mouseenter', () => this.callbacks.onRestartHover());
        document.getElementById('back-to-menu-btn').addEventListener('click', () => this.callbacks.onBackToMenu());
    }

    showSettings(active) {
        this.elements.settingsOverlay?.classList.toggle('hidden', !active);
        if (active) {
            this.elements.settingsMenu?.classList.add('hidden'); // Close small menu if open
        }
    }

    showPause(active) {
        this.elements.pauseOverlay?.classList.toggle('hidden', !active);
        this.callbacks.onPauseStateChange(active);
    }

    updateHistory(history) {
        if (!this.elements.historyList) return;
        
        if (!history || history.length === 0) {
            this.elements.historyList.innerHTML = '<div style="opacity: 0.5; text-align: center;">Aucun événement...</div>';
            return;
        }

        let html = '';
        history.forEach((h, i) => {
            html += `
                <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 8px 0; display: flex; justify-content: space-between;">
                    <span style="opacity: 0.5;">#${h.turn + 1}</span>
                    <span style="flex: 1; margin-left: 15px;">${h.title}</span>
                </div>
            `;
        });
        this.elements.historyList.innerHTML = html;
    }

    updateLeaderboard(scores) {
        if (!this.elements.leaderboardList) return;
        
        if (!scores || scores.length === 0) {
            const noScoresLabel = this.callbacks.getTranslation('no_scores');
            this.elements.leaderboardList.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; opacity: 0.5;">${noScoresLabel}</td></tr>`;
            return;
        }

        let html = '';
        scores.forEach((s, i) => {
            const date = new Date(s.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: '2-digit' });
            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 10px; color: var(--gold); font-family: var(--font-serif);">#${i + 1}</td>
                    <td style="padding: 10px;">${s.name}</td>
                    <td style="padding: 10px; font-weight: 600;">${s.score}</td>
                    <td style="padding: 10px; opacity: 0.6; font-size: 0.7rem;">${date}</td>
                </tr>
            `;
        });
        this.elements.leaderboardList.innerHTML = html;
    }

    syncConfig(config) {
        this.lastSyncConfig = config;
        if (this.elements.configLang) this.elements.configLang.value = config.language;
        if (this.elements.configLangRef) this.elements.configLangRef.value = config.language;
        
        if (this.elements.configPlayerName) this.elements.configPlayerName.value = config.playerName || '';

        if (this.elements.configTheme) this.elements.configTheme.value = config.theme;
        if (this.elements.configThemeRef) this.elements.configThemeRef.value = config.theme;
        
        if (this.elements.configLightMode) {
            this.elements.configLightMode.textContent = config.lightMode ? 'ON' : 'OFF';
        }
        if (this.elements.configConseil) {
            const c = config.conseil;
            this.elements.configConseil.textContent =
                c === true ? 'ON' : (c === false ? 'OFF' : 'AUTO');
        }
        if (this.elements.configCardReading) {
            const actif = config.cardReading !== false;
            this.elements.configCardReading.textContent = actif ? 'ON' : 'OFF';
            this.elements.configCardReading.style.borderColor =
                actif ? 'var(--gold)' : 'rgba(197,160,89,0.3)';
            this.lectureActivee = actif;
        }
        if (this.elements.configLightModeRef) {
            this.elements.configLightModeRef.textContent = config.lightMode ? 'ON' : 'OFF';
            this.elements.configLightModeRef.style.borderColor = config.lightMode ? 'var(--gold)' : 'rgba(197,160,89,0.3)';
        }

        if (this.elements.configConfirmClickRef) {
            this.elements.configConfirmClickRef.textContent = config.confirmClick ? 'ON' : 'OFF';
            this.elements.configConfirmClickRef.style.borderColor = config.confirmClick ? 'var(--gold)' : 'rgba(197,160,89,0.3)';
        }

        if (this.elements.configScreenShakeRef) {
            this.elements.configScreenShakeRef.textContent = config.screenShake ? 'ON' : 'OFF';
            this.elements.configScreenShakeRef.style.borderColor = config.screenShake ? 'var(--gold)' : 'rgba(197,160,89,0.3)';
        }
    }

    update(gameState) {
        if (!gameState) return;
        
        const updateText = (id, val) => {
            if (this.elements[id]) {
                const currentVal = parseInt(this.elements[id].textContent) || 0;
                if (currentVal !== val) {
                    this.elements[id].textContent = val;
                    // Subtle scale animation on change
                    this.elements[id].parentElement.style.transform = 'scale(1.05)';
                    setTimeout(() => {
                        if (this.elements[id]) this.elements[id].parentElement.style.transform = 'scale(1)';
                    }, 200);
                }
            }
        };

        updateText('score', gameState.score);
        updateText('turn', gameState.turn);
        // La boite affiche desormais la progression vers l'objectif, pas le
        // cumul de toutes les parties -- un nombre que le joueur ne pouvait
        // relier a rien.
        // La boite du haut annonce la duree a tenir et la semaine en cours :
        // "Semaine 4 / 21". Le joueur sait toujours ou il en est.
        // La boite du haut porte la cible : combien de piliers sont dans la
        // zone. C'est le seul chiffre que le joueur cherche a faire monter.
        const requis = gameState.semainesRequises ? gameState.semainesRequises() : 3;
        const enZone = gameState.pilliersEnZone ? gameState.pilliersEnZone() : 0;
        updateText('lifetime', `${enZone} / 4`);
        // updateText resout les identifiants via this.elements : la ligne des
        // semaines n'y figurait pas, elle restait donc figee a "Semaine 0 / 3".
        if (this.elements.semaineRestante) {
            this.elements.semaineRestante.textContent =
                `${this.callbacks.getTranslation('semaine')} ${gameState.turn} / ${requis}`;
        }
        if (this.elements.goalBox) {
            this.elements.goalBox.classList.toggle('complet', enZone === 4);
        }
        // La zone visee, marquee sur chaque jauge.
        if (gameState.zoneEquilibre) this.majZoneJauges(gameState.zoneEquilibre());
        if (this.elements.goalFill) {
            const part = Math.max(0, Math.min(1, enZone / 4));
            this.elements.goalFill.style.width = (part * 100).toFixed(1) + '%';
            this.elements.goalFill.classList.toggle('proche', part >= 0.75);
        }

        let isAnyPillarInDanger = false;

        if (this.elements.harmonyBadge) {
            gameState.reachedHarmony ? this.elements.harmonyBadge.classList.remove('hidden') : this.elements.harmonyBadge.classList.add('hidden');
        }

        if (this.elements.meditationBadge) {
            if (gameState.isMeditationMode) {
                this.elements.meditationBadge.classList.remove('hidden');
                this.elements.meditationBadge.textContent = this.callbacks.getTranslation('meditation').toUpperCase();
            } else {
                this.elements.meditationBadge.classList.add('hidden');
            }
        }

        if (this.elements.pantheonBadge && gameState.selectedPantheon) {
            this.elements.pantheonBadge.classList.remove('hidden');
            this.elements.pantheonBadge.textContent = gameState.selectedPantheon.name.toUpperCase();
            this.elements.pantheonBadge.style.color = gameState.selectedPantheon.color || 'var(--gold-bright)';
            this.elements.pantheonBadge.style.borderColor = gameState.selectedPantheon.color || 'var(--gold)';
        } else if (this.elements.pantheonBadge) {
            this.elements.pantheonBadge.classList.add('hidden');
        }

        // Update Active Events List
        if (this.elements.activeEventsList) {
            if (!gameState.activeEvents || gameState.activeEvents.length === 0) {
                this.elements.activeEventsList.innerHTML = '';
            } else {
                let html = '';
                gameState.activeEvents.forEach(event => {
                    html += `
                        <div style="background: rgba(10, 10, 10, 0.7); backdrop-filter: blur(10px); border-left: 3px solid var(--gold-bright); padding: 8px 15px; border-radius: 2px; animation: fade-in 0.5s ease; pointer-events: auto; display: flex; align-items: center; gap: 10px; min-width: 150px;">
                            <div style="width: 8px; height: 8px; background: var(--gold-bright); border-radius: 50%; box-shadow: 0 0 10px var(--gold-bright);"></div>
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-family: var(--font-serif); font-size: 0.65rem; color: var(--gold-bright); letter-spacing: 1px;">${event.title.toUpperCase()}</span>
                                <span style="font-size: 0.55rem; opacity: 0.7;">${event.remainingTurns} TOURS RESTANTS</span>
                            </div>
                        </div>
                    `;
                });
                this.elements.activeEventsList.innerHTML = html;
            }
        }

        for (const pillar in gameState.pillars) {
            const val = gameState.pillars[pillar];
            const el = this.elements.pillars[pillar];
            if (el) {
                // Smooth transition is already in CSS
                el.style.height = `${val}%`;
                el.style.width = `${val}%`; // For horizontal layouts on mobile
                
                // Color grading based on value
                if (val < 20 || val > 80) {
                    el.classList.add('danger');
                    el.style.filter = 'brightness(1.5) saturate(1.5)';
                    isAnyPillarInDanger = true;
                } else {
                    el.classList.remove('danger');
                    el.style.filter = 'none';
                }
            }
        }

        this.dernierPillars = gameState.pillars;
        this.majPeril(gameState.pillars);
        // Serie d'harmonie : sans ce rappel, le joueur gagnerait sans avoir vu
        // qu'il etait en train de gagner.
        // L'harmonie n'est plus la condition de victoire mais elle double le
        // score : on l'annonce comme un bonus, pas comme un objectif.
        this.majBonusHarmonie(!!gameState.reachedHarmony);

        if (this.elements.dangerVignette) {
            if (isAnyPillarInDanger) {
                this.elements.dangerVignette.classList.add('active');
            } else {
                this.elements.dangerVignette.classList.remove('active');
            }
        }
    }

    /**
     * Lecture vocale de la carte presentee. Le canal audio "voice" existait
     * dans AudioController sans que rien ne joue dessus : il pilote desormais
     * le volume de la synthese, et son curseur apparait dans les reglages.
     */
    /**
     * Deverrouillage de la synthese vocale. Safari, sur iPhone comme sur Mac,
     * refuse de parler tant qu'un premier appel n'a pas eu lieu directement
     * dans un geste de l'utilisateur. On emet un enonce vide au premier
     * contact ; sans lui, tous les appels suivants restaient muets.
     */
    deverrouillerVoix() {
        if (this.voixDeverrouillee || !('speechSynthesis' in window)) return;
        this.voixDeverrouillee = true;
        try {
            // Un enonce a volume 0 ou reduit a une espace est ignore par
            // certains moteurs, et ne deverrouille alors rien du tout.
            const amorce = new SpeechSynthesisUtterance('a');
            amorce.volume = 0.01;
            amorce.lang = 'fr-FR';
            window.speechSynthesis.resume();
            window.speechSynthesis.speak(amorce);
        } catch (e) {
            console.warn('Synthese vocale indisponible', e);
        }
    }

    lireCarte(data) {
        // Etat propre : le bouton ne reapparait qu'une fois la voix partie,
        // ou si le navigateur refuse la lecture automatique.
        this.montrerBouton('aucun');
        // Reglage explicite du menu : il prime sur tout le reste.
        if (this.lectureActivee === false) return;
        if (!('speechSynthesis' in window) || !data) return;
        this.deverrouillerVoix();
        if (this.lectureCoupee) return;

        const volume = this.volumeVoix ?? 0.5;
        if (volume <= 0) return;

        // Titre, description, puis les points pilier par pilier. Sans les
        // chiffres, l'ecoute ne suffit pas a decider : ce sont eux qui portent
        // le choix.
        const texte = `${data.title}. ${data.desc || ''} ${this.effetsEnMots(data)}`;
        const u = new SpeechSynthesisUtterance(texte);
        u.lang = 'fr-FR';
        u.volume = volume;
        u.rate = 1.0;
        u.pitch = 1.0;

        // Voix francaise si le systeme en propose une.
        // On n'impose pas d'objet voice : sur iOS la liste retournee par
        // getVoices() est souvent perimee, et affecter une voix invalide rend
        // l'enonce silencieux. La langue declaree suffit au systeme pour
        // choisir. On ne force une voix que si le systeme en confirme une, et
        // jamais sur iOS.
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent || '');
        if (!iOS) {
            const voix = (window.speechSynthesis.getVoices() || [])
                .filter(v => v.lang && v.lang.toLowerCase().startsWith('fr'));
            if (voix.length) u.voice = voix[0];
        }

        const synth = window.speechSynthesis;

        // Le bouton n'apparait qu'une fois la voix reellement partie. Il etait
        // affiche d'avance : quand la synthese etait bloquee, il restait la
        // sans qu'aucun son ne sorte.
        u.onstart = () => {
            if (this.utteranceEnCours !== u) return;
            this.montrerBouton('arret');
            // Sur iOS, la synthese se tait purement et simplement quand une
            // autre source audio joue. On efface la musique pendant l'enonce.
            this.callbacks.onLectureDebut?.();
        };
        u.onend = () => { if (this.utteranceEnCours === u) this.arreterLecture(); };
        u.onerror = () => { if (this.utteranceEnCours === u) this.arreterLecture(); };

        this.utteranceEnCours = u;

        // Sur iOS la musique doit s'effacer AVANT l'appel, pas a l'evenement
        // onstart : si le canal est occupe, l'enonce ne demarre jamais et
        // onstart ne se declenche donc pas.
        this.callbacks.onLectureDebut?.();

        // Safari se met parfois en pause de lui-meme et n'en sort pas seul.
        if (synth.paused) synth.resume();
        // On parle dans le meme geste que le clic : differer l'appel, meme de
        // quelques millisecondes, fait perdre a Safari l'autorisation de
        // l'utilisateur et la lecture reste muette.
        if (synth.speaking || synth.pending) synth.cancel();
        synth.speak(u);

        // Filet : si rien n'a demarre au bout de 400 ms, on retente une fois.
        clearTimeout(this._relanceVoix);
        this._relanceVoix = setTimeout(() => {
            if (this.utteranceEnCours !== u || this.lectureCoupee) return;
            if (!synth.speaking && !synth.pending) {
                try { synth.speak(u); } catch (e) { /* synthese indisponible */ }
                setTimeout(() => {
                    if (this.utteranceEnCours === u && !synth.speaking && !synth.pending) {
                        // Le navigateur refuse la lecture automatique : on
                        // propose au joueur de la declencher lui-meme.
                        this.montrerBouton('lire');
                    }
                }, 800);
            }
        }, 400);
    }

    /**
     * La liste des voix est peuplee de facon asynchrone. On l'amorce des le
     * demarrage pour qu'une voix francaise soit disponible au premier enonce.
     */
    prechargerVoix() {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }

    /**
     * Traduit les effets d'une carte en une phrase dictable :
     * "Spiritualite plus 16, Amour moins 4, Sante plus 8, Argent plus 1."
     * Les signes sont enonces en toutes lettres, un "+" ne se prononce pas.
     */
    effetsEnMots(data) {
        const effets = data.effectsPerTurn || data.effects;
        if (!effets) return '';
        const t = (k) => this.callbacks.getTranslation(k);
        const plus = t('voice_plus') || 'plus';
        const moins = t('voice_moins') || 'moins';
        const parTour = data.effectsPerTurn ? (t('voice_par_tour') || '') : '';
        const morceaux = [];
        for (const p in effets) {
            const v = effets[p];
            if (!v) continue;
            const nom = t(`pillar_${p}`) || p;
            // "ta Spiritualite", "ton Amour" : le possessif accompagne chaque
            // pilier pour que l'enonce forme une vraie phrase.
            const poss = t(`voice_poss_${p}`);
            const tete = (poss && poss !== `voice_poss_${p}`) ? `${poss} ${nom}` : nom;
            morceaux.push(`${tete} ${t('voice_de') || 'de'} ${v > 0 ? plus : moins} ${Math.abs(v)}${parTour}`);
        }
        if (!morceaux.length) return '';
        // "Ton choix impactera ta Spiritualite de plus 6, ton Amour de plus 8..."
        const intro = t('voice_intro');
        const phrase = morceaux.join(', ') + '.';
        return (intro && intro !== 'voice_intro') ? `${intro} ${phrase}` : phrase;
    }

    arreterLecture() {
        if (!('speechSynthesis' in window)) return;
        clearTimeout(this._relanceVoix);
        window.speechSynthesis.cancel();
        this.utteranceEnCours = null;
        this.montrerArret(false);
        this.callbacks.onLectureFin?.();
    }

    /**
     * Ferme le panneau de detail. Point de passage unique : toute voie qui
     * masque la fenetre coupe aussi la lecture, sans exception.
     */
    /** Les reperes du carrousel reviennent quand le panneau se referme. */
    rendreReperes() {
        const d = this._dernierCarrousel;
        const zone = this.elements.carouselDots;
        if (!zone || !d || !d.total || d.total < 2) return;
        // On reconstruit directement : passer par majReperesCarrousel
        // relisait l'etat du panneau, qui n'est pas encore referme.
        let html = `<span class="mot">${this.callbacks.getTranslation('conseil') ? '' : ''}</span>`;
        html = '';
        for (let i = 0; i < d.total; i++) {
            html += `<span class="point${i === d.index ? ' actif' : ''}"></span>`;
        }
        zone.innerHTML = html;
        zone.classList.remove('hidden');
        this.elements.carouselHint?.classList.remove('hidden');
    }

    masquerDetail() {
        setTimeout(() => this.rendreReperes(), 60);
        this.arreterLecture();
        this.derniereCarteLue = null;
        this.elements.cardInfo?.classList.add('hidden');
        if (this.elements.cardInfo) this.elements.cardInfo.style.opacity = '0';
        if (this.dernierPillars) this.majPeril(this.dernierPillars);
    }

    /**
     * Le bouton a deux visages :
     *   'arret' pendant la lecture,
     *   'lire'  quand la lecture automatique a ete refusee par le navigateur.
     * Safari n'autorise la synthese que dans un geste de l'utilisateur ; si
     * l'appel automatique echoue, ce bouton offre ce geste. Il ne peut pas
     * etre refuse.
     */
    /**
     * Points du carrousel. Ils n'apparaissent qu'en portrait, ou les cartes
     * defilent une a une ; le CSS s'en charge, on ne remplit que le contenu.
     */
    majReperesCarrousel(index, total) {
        const zone = this.elements.carouselDots;
        if (!zone) return;
        // Les points et le rappel du geste se glissaient au milieu du panneau
        // de detail quand celui-ci etait ouvert : on les efface le temps de la
        // lecture d'une carte.
        this._dernierCarrousel = { index, total };
        if (this.elements.cardInfo && !this.elements.cardInfo.classList.contains('hidden')) {
            zone.classList.add('hidden');
            this.elements.carouselHint?.classList.add('hidden');
            return;
        }
        if (index === null || index === undefined || !total || total < 2) {
            zone.innerHTML = '';
            if (this.elements.carouselHint) this.elements.carouselHint.style.opacity = '0';
            return;
        }
        if (this.elements.carouselHint) this.elements.carouselHint.style.opacity = '0.5';
        let html = '';
        for (let i = 0; i < total; i++) {
            html += `<div class="point${i === index ? ' actif' : ''}"></div>`;
        }
        zone.innerHTML = html;
    }

    /** Message du filet : la premiere erreur enseigne au lieu de tuer. */
    montrerFilet(info) {
        const z = this.elements.netMessage;
        if (!z || !info) return;
        const nom = this.callbacks.getTranslation(`pillar_${info.pillar}`) || info.pillar;
        const cause = this.callbacks.getTranslation(info.parExces ? 'filet_exces' : 'filet_manque');
        z.innerHTML = `<span class="titre">${this.callbacks.getTranslation('filet_titre')}</span>`
                    + `<span class="texte">${nom} ${cause}</span>`;
        z.classList.remove('hidden');
        clearTimeout(this._filetTimer);
        this._filetTimer = setTimeout(() => z.classList.add('hidden'), 5200);
    }

    /**
     * Affiche la carte conseillee. Ce n'est pas une aide au sens faible : sans
     * elle, un debutant ne vise jamais l'harmonie et ne gagne donc jamais,
     * quel que soit l'assouplissement de la cible.
     */
    montrerConseil(carte, actif) {
        const z = this.elements.adviceBox;
        if (!z) return;
        if (!actif || !carte) { z.classList.add('hidden'); return; }
        z.innerHTML = `<span class="mot">${this.callbacks.getTranslation('conseil')}</span>`
                    + `<span class="titre">${carte.title}</span>`;
        z.classList.remove('hidden');
    }

    /**
     * Le bouton de lecture a ete retire du panneau de carte : la commande vit
     * desormais dans les parametres. La methode reste en place, sans effet,
     * pour que les appels existants n'aient pas a etre traques un a un.
     */
    /**
     * Trace la zone visee sur les quatre jauges. Le joueur voit ou ses piliers
     * doivent se tenir, au lieu de deviner une regle abstraite.
     */
    majZoneJauges(zone) {
        if (this._zoneTracee && this._zoneTracee.bas === zone.bas) return;
        this._zoneTracee = zone;
        document.documentElement.style.setProperty('--zone-bas', zone.bas + '%');
        document.documentElement.style.setProperty('--zone-haut', zone.haut + '%');
        document.documentElement.style.setProperty('--zone-large', (zone.haut - zone.bas) + '%');
    }

    montrerBouton(mode) {
        this.modeBouton = mode;
        const b = this.elements.speechStopBtn;
        if (!b) return;
        this.modeBouton = mode;
        b.classList.toggle('hidden', mode === 'aucun');
        const libelle = b.querySelector('span');
        const icone = b.querySelector('svg');
        if (mode === 'arret') {
            if (libelle) libelle.textContent = this.callbacks.getTranslation('stop_speech');
            if (icone) icone.innerHTML = '<rect x="6" y="6" width="12" height="12" rx="1"/>';
        } else if (mode === 'lire') {
            if (libelle) libelle.textContent = this.callbacks.getTranslation('read_aloud');
            if (icone) icone.innerHTML = '<path d="M8 5v14l11-7z"/>';
        }
    }

    montrerArret(visible) {
        this.montrerBouton(visible ? 'arret' : 'aucun');
    }

    /**
     * Initiation du premier tour. Trois messages, une seule fois dans la vie
     * du joueur. La charte demande que le jeu soit compris en moins d'une
     * minute : quatre phrases cachees derriere le neuvieme bouton du menu ne
     * suffisaient pas.
     */
    lancerInitiation(surFin) {
        if (!this.elements.tutorialLayer) { if (surFin) surFin(); return; }
        this.etapeTuto = 0;
        this.finInitiation = surFin;
        this.afficherEtapeTuto();
        this.elements.tutorialLayer.classList.remove('hidden');
    }

    afficherEtapeTuto() {
        const n = this.etapeTuto + 1;
        if (this.elements.tutorialStep) this.elements.tutorialStep.textContent = `ÉTAPE ${n} / 4`;
        if (this.elements.tutorialText) {
            this.elements.tutorialText.textContent = this.callbacks.getTranslation(`tuto_${n}`);
        }
    }

    fermerInitiation() {
        this.elements.tutorialLayer?.classList.add('hidden');
        const cb = this.finInitiation;
        this.finInitiation = null;
        if (cb) cb();
    }

    /** Nomme le pilier en danger : la vignette rouge n'indiquait rien. */
    majPeril(pillars) {
        if (!this.elements.perilAlert) return;
        let pire = null, ecart = 0, haut = false;
        for (const p in pillars) {
            const v = pillars[p];
            const d = v < 20 ? (20 - v) : (v > 80 ? (v - 80) : 0);
            if (d > ecart) { ecart = d; pire = p; haut = v > 80; }
        }
        // Masquee tant que le detail d'une carte est ouvert : les deux se
        // superposaient au centre de l'ecran.
        const detailOuvert = this.elements.cardInfo
            && !this.elements.cardInfo.classList.contains('hidden');
        if (!pire || detailOuvert) {
            this.elements.perilAlert.classList.add('hidden');
            return;
        }
        const nom = this.callbacks.getTranslation(`pillar_${pire}`);
        const etat = this.callbacks.getTranslation(haut ? 'peril_high' : 'peril_low');
        this.elements.perilAlert.textContent = `${nom} ${etat}`;
        this.elements.perilAlert.style.borderColor = haut ? '#f39c12' : '#e74c3c';
        this.elements.perilAlert.style.color = haut ? '#ffd18a' : '#ff9d9d';
        this.elements.perilAlert.classList.remove('hidden');
    }

    showCardInfo(data, currentPillars) {
        if (!this.elements.cardInfo) return;

        if (!data) {
            this.masquerDetail();
            this.elements.cardInfo.style.borderColor = 'var(--gold)';
            this.elements.cardInfo.style.animation = 'none';
            if (this.elements.synergyStatus) this.elements.synergyStatus.classList.add('hidden');
            Object.values(this.elements.previews).forEach(el => { if(el) el.style.opacity = '0'; });
            return;
        }

        if (this.elements.synergyStatus) {
            if (data.synergyStatus) {
                this.elements.synergyStatus.textContent = data.synergyStatus.message.toUpperCase();
                this.elements.synergyStatus.classList.remove('hidden');
                const isResonance = data.synergyStatus.type === 'resonance';
                this.elements.synergyStatus.style.color = isResonance ? '#2ecc71' : '#e74c3c';
                this.elements.synergyStatus.style.borderColor = isResonance ? '#2ecc71' : '#e74c3c';
                this.elements.synergyStatus.style.backgroundColor = isResonance ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)';
            } else {
                this.elements.synergyStatus.classList.add('hidden');
            }
        }

        if (this.elements.cardTitle) this.elements.cardTitle.textContent = data.title;
        if (this.elements.cardRarity) {
            // La rarete s'affichait en anglais brut -- COMMON, RARE -- au
            // milieu d'une interface entierement francaise.
            const r = data.rarity || 'common';
            const libelle = this.callbacks.getTranslation(`rarity_${r}`);
            this.elements.cardRarity.textContent =
                (libelle && libelle !== `rarity_${r}` ? libelle : r).toUpperCase();
            this.elements.cardRarity.style.color = data.color || 'var(--gold)';
            
            // Special legendary feedback
            if (data.rarity === 'legendary') {
                this.elements.cardRarity.style.textShadow = `0 0 10px ${data.color}`;
            } else {
                this.elements.cardRarity.style.textShadow = 'none';
            }
        }
        if (this.elements.cardDesc) this.elements.cardDesc.textContent = data.desc;
        
        let effectsHtml = '';

        // Show Mechanic Badge if exists
        if (data.specialEffect) {
            const mechanicName = data.specialEffect.replace('_', ' ').toUpperCase();
            effectsHtml += `<div class="mechanic-badge" style="background: rgba(243, 229, 171, 0.2); color: #f3e5ab; border: 1px solid #f3e5ab; font-size: 0.6rem; padding: 2px 8px; margin-bottom: 10px; display: inline-block; border-radius: 10px; letter-spacing: 1px;">MODIFICATEUR: ${mechanicName}</div>`;
        }
        
        // Narrative or Event styling transition
        if (data.isNarrative || data.isWorldEvent) {
            this.elements.cardInfo.style.borderColor = data.isWorldEvent ? '#3498db' : '#f3e5ab';
            this.elements.cardInfo.style.boxShadow = `0 0 30px ${data.isWorldEvent ? 'rgba(52, 152, 219, 0.3)' : 'rgba(243, 229, 171, 0.2)'}`;
            
            if (data.isWorldEvent) {
                this.elements.cardInfo.style.animation = 'pulse-event 2s infinite ease-in-out';
            } else {
                this.elements.cardInfo.style.animation = 'none';
            }
        } else {
            this.elements.cardInfo.style.borderColor = 'var(--gold)';
            this.elements.cardInfo.style.boxShadow = '0 20px 50px rgba(0,0,0,0.8)';
            this.elements.cardInfo.style.animation = 'none';
        }

        // Show instant effects
        for (const pillar in data.effects) {
            const val = data.effects[pillar];
            if (val === 0) continue;
            const color = val >= 0 ? '#2ecc71' : '#e74c3c';
            const sign = val > 0 ? '+' : '';
            const localizedPillar = this.callbacks.getTranslation(`pillar_${pillar}`);
            effectsHtml += `<div class="effect-item" style="color: ${color}"><span>${localizedPillar}</span> <span>${sign}${val}</span></div>`;
            
            // Preview
            const previewEl = this.elements.previews[pillar];
            if (previewEl && currentPillars) {
                const nextVal = Math.max(0, Math.min(100, currentPillars[pillar] + val));
                previewEl.style.height = `${nextVal}%`;
                previewEl.style.width = `${nextVal}%`; // For horizontal layouts
                previewEl.style.opacity = '0.5';
            }
        }

        // Show persistent effects if world event
        if (data.isWorldEvent && data.effectsPerTurn) {
            effectsHtml += `<div style="margin-top: 10px; font-size: 0.6rem; opacity: 0.7; color: var(--gold-bright); border-top: 1px solid rgba(197, 160, 89, 0.2); padding-top: 5px; text-transform: uppercase;">Par tour (${data.duration} tours):</div>`;
            for (const pillar in data.effectsPerTurn) {
                const val = data.effectsPerTurn[pillar];
                const color = val >= 0 ? '#2ecc71' : '#e74c3c';
                const sign = val > 0 ? '+' : '';
                const localizedPillar = this.callbacks.getTranslation(`pillar_${pillar}`);
                effectsHtml += `<div class="effect-item" style="color: ${color}; opacity: 0.8; font-size: 0.65rem;"><span>${localizedPillar}</span> <span>${sign}${val}</span></div>`;
            }
        }

        if (this.elements.cardEffects) this.elements.cardEffects.innerHTML = effectsHtml;
        
        this.elements.cardInfo.classList.remove('hidden');
        this.elements.cardInfo.style.opacity = '1'; // Ensure visibility

        // Lecture automatique. Relancee a chaque nouvelle carte presentee ;
        // une carte deja lue n'est pas repetee tant qu'on reste dessus.
        this.carteAffichee = data;
        if (this.derniereCarteLue !== data.id) {
            this.derniereCarteLue = data.id;
            this.lectureCoupee = false;   // une nouvelle carte relance la voix
            this.lireCarte(data);
        }
    }

    showGameOver(gameState, isNewRecord, duelOpponent = null) {
        // Nommer la cause : sans elle, un nouveau joueur ne comprend pas
        // pourquoi la partie s'arrete. 99 % des defaites viennent d'un
        // depassement a 100, ce que personne ne devine.
        if (this.elements.gameOverCause) {
            let cause = null;
            for (const p in gameState.pillars) {
                const v = gameState.pillars[p];
                if (v <= 0) { cause = [p, 'cause_zero']; break; }
                if (v >= 100) { cause = [p, 'cause_cent']; break; }
            }
            if (cause) {
                const nom = this.callbacks.getTranslation(`pillar_${cause[0]}`);
                this.elements.gameOverCause.textContent =
                    `${nom} ${this.callbacks.getTranslation(cause[1])}`;
                this.elements.gameOverCause.classList.remove('hidden');
            } else {
                this.elements.gameOverCause.classList.add('hidden');
            }
        }
        this.masquerDetail();
        this.elements.perilAlert?.classList.add('hidden');

        if (this.elements.finalScore) this.elements.finalScore.textContent = gameState.score;
        if (this.elements.legacyTotal) this.elements.legacyTotal.textContent = gameState.lifetimeScore;
        
        // Handle Duel Results
        if (duelOpponent) {
            if (this.elements.opponentFinalBox) {
                this.elements.opponentFinalBox.style.display = 'block';
                this.elements.opponentFinalScore.textContent = duelOpponent.score;
            }
            if (this.elements.duelResultBanner) {
                this.elements.duelResultBanner.classList.remove('hidden');
                
                let resultKey = 'draw';
                if (gameState.score > duelOpponent.score) resultKey = 'victory';
                else if (gameState.score < duelOpponent.score) resultKey = 'defeat';
                
                this.elements.duelResultBanner.textContent = this.callbacks.getTranslation(resultKey);
                this.elements.duelResultBanner.style.color = resultKey === 'victory' ? '#2ecc71' : (resultKey === 'defeat' ? '#e74c3c' : '#f3e5ab');
            }
        } else {
            if (this.elements.opponentFinalBox) this.elements.opponentFinalBox.style.display = 'none';
            if (this.elements.duelResultBanner) this.elements.duelResultBanner.classList.add('hidden');
        }

        const summaryEl = document.getElementById('game-over-summary');
        if (summaryEl && gameState.history) {
            // Le parcours ne montrait que les cinq derniers tours et semblait
            // commencer au tour 2. Une etape entiere y tient desormais, du
            // premier choix au dernier.
            let html = `<div style="margin-bottom: 10px; color: var(--gold); letter-spacing: 2px;">${this.callbacks.getTranslation('votre_parcours')}</div>`;
            gameState.history.forEach(h => {
                html += `<div style="margin-bottom: 5px; display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 2px;">
                    <span>${this.callbacks.getTranslation('semaine')} ${h.turn + 1} : ${h.title}</span>
                </div>`;
            });
            summaryEl.innerHTML = html;
        }

        // --- VICTOIRE ---
        // Le jeu n'avait qu'une seule fin. Tenir l'harmonie assez longtemps en
        // ouvre une seconde, et elle doit se distinguer au premier regard.
        const victoire = !!gameState.isVictory;
        const t = (k) => this.callbacks.getTranslation(k);

        // --- LE PARCOURS ---
        // L'ecran ne dit plus "vous avez perdu" ou "vous avez gagne" : il dit
        // combien de temps le joueur a tenu son equilibre, et lance le defi
        // suivant. C'est cette voix qui donne envie de recommencer.
        const rp = gameState.resultatParcours || {};
        const dureeTenue = t(rp.franchie && this.parcoursCle ? this.parcoursCle : 'duree_generique');

        if (this.elements.gameOverTitle) {
            this.elements.gameOverTitle.textContent = victoire ? t('victoire_titre')
                : (isNewRecord ? "Un Nouvel Héritage" : "Le Cycle s'achève");
            this.elements.gameOverTitle.style.color =
                (victoire || isNewRecord) ? 'var(--gold-bright)' : 'var(--gold)';
        }
        if (this.elements.gameOverDesc) {
            let phrase;
            if (rp.sommet) {
                phrase = t('parcours_sommet');
            } else if (rp.franchie && rp.suivante) {
                // "Bravo, tu as tenu trois semaines. Voyons voir si tu peux
                //  tenir six semaines."
                phrase = t('parcours_bravo').replace('{tenu}', t(rp.tenue || 'duree_generique'))
                       + ' ' + t('parcours_defi').replace('{suite}', t(rp.suivante.cle));
            } else if (!victoire) {
                phrase = t('parcours_echec').replace('{semaine}', gameState.turn)
                       + ' ' + t('parcours_reprise');
            } else {
                phrase = t('victoire_desc');
            }
            this.elements.gameOverDesc.textContent = phrase;
        }
        // La cause de la mort n'a pas lieu d'etre quand on a gagne.
        if (victoire) this.elements.gameOverCause?.classList.add('hidden');

        // Le bandeau annoncait la fin de l'experience meme apres une reussite.
        if (this.elements.gameOverBanner) {
            this.elements.gameOverBanner.textContent =
                t(victoire ? 'banniere_victoire' : 'banniere_defaite');
            this.elements.gameOverBanner.style.color =
                victoire ? 'var(--gold)' : '';
        }

        const ecran = this.elements.gameOver;
        if (ecran) {
            ecran.classList.toggle('victoire', victoire);
            ecran.classList.remove('hidden');
        }
        // Le titre gagne, annonce sous les scores.
        if (this.elements.victoryTitle) {
            this.elements.victoryTitle.classList.toggle('hidden', !victoire);
            // Le rang etait ecrit en dur : il annoncait toujours "Éveillé",
            // meme apres avoir franchi la deuxieme ou la troisieme etape.
            if (victoire) {
                const titre = (rp.titreEtape) || t('victoire_rang_defaut');
                this.elements.victoryTitle.textContent =
                    t('victoire_rang').replace('{titre}', titre);
            }
        }
        if (victoire) this.lancerFeuxArtifice();
    }

    /**
     * Feux d'artifice de victoire. Canvas 2D independant de la scene 3D :
     * il continue meme si le rendu est en pause, et ne coute rien le reste
     * du temps puisqu'il n'existe pas.
     */
    lancerFeuxArtifice(duree = 9000) {
        const c = this.elements.fireworks;
        if (!c) return;
        c.classList.remove('hidden');
        c.width = window.innerWidth; c.height = window.innerHeight;
        const ctx = c.getContext('2d');
        const teintes = ['#f3e5ab', '#c5a059', '#ffd166', '#fff2cc', '#e8b64c'];
        let particules = [], fin = Date.now() + duree, prochaine = 0;

        const gerbe = () => {
            const x = c.width * (0.15 + Math.random() * 0.7);
            const y = c.height * (0.15 + Math.random() * 0.35);
            const teinte = teintes[Math.floor(Math.random() * teintes.length)];
            const n = 46 + Math.floor(Math.random() * 26);
            for (let i = 0; i < n; i++) {
                const a = (Math.PI * 2 * i) / n + Math.random() * 0.2;
                const v = 2.2 + Math.random() * 3.6;
                particules.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
                                  vie: 1, teinte, taille: 1.4 + Math.random() * 1.8 });
            }
        };

        const boucle = () => {
            const maintenant = Date.now();
            ctx.clearRect(0, 0, c.width, c.height);
            if (maintenant < fin && maintenant > prochaine) {
                gerbe(); prochaine = maintenant + 380 + Math.random() * 420;
            }
            for (const p of particules) {
                p.x += p.vx; p.y += p.vy;
                p.vy += 0.045;            // gravite
                p.vx *= 0.985; p.vy *= 0.985;
                p.vie -= 0.011;
                if (p.vie <= 0) continue;
                ctx.globalAlpha = Math.max(0, p.vie);
                ctx.fillStyle = p.teinte;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.taille * p.vie, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            particules = particules.filter(p => p.vie > 0);
            if (maintenant < fin || particules.length) {
                this._feux = requestAnimationFrame(boucle);
            } else {
                c.classList.add('hidden');
                ctx.clearRect(0, 0, c.width, c.height);
            }
        };
        cancelAnimationFrame(this._feux);
        boucle();
    }

    /** Points d'harmonie : le joueur doit voir qu'il est en train de gagner. */
    /** Signale le bonus d'harmonie : le score monte 2,5 fois plus vite. */
    majBonusHarmonie(actif) {
        const z = this.elements.harmonyStreak;
        if (!z) return;
        z.classList.toggle('hidden', !actif);
        if (actif) {
            z.innerHTML = `<span class="mot">${this.callbacks.getTranslation('harmonie_serie')}</span>`
                        + `<span class="compte">${this.callbacks.getTranslation('harmonie_bonus')}</span>`;
            z.classList.add('active');
        }
    }

    majSerieHarmonie(serie, requis) {
        const z = this.elements.harmonyStreak;
        if (!z) return;
        // Le compteur reste visible en permanence, meme a zero. Cache tant que
        // la serie n'avait pas commence, il ne montrait jamais au joueur ce
        // qu'il devait viser -- on ne peut pas gagner a un jeu dont on ignore
        // le but.
        if (!requis) { z.classList.add('hidden'); z.innerHTML = ''; return; }
        z.classList.remove('hidden');
        const mot = serie > 0 ? 'harmonie_serie' : 'objectif_gagner';
        let html = `<span class="mot">${this.callbacks.getTranslation(mot)}</span>`;
        for (let i = 0; i < requis; i++) {
            html += `<span class="perle${i < serie ? ' pleine' : ''}"></span>`;
        }
        html += `<span class="compte">${serie} / ${requis}</span>`;
        z.innerHTML = html;
        z.classList.toggle('active', serie > 0);
    }

    hideGameOver() {
        this.elements.gameOver.classList.add('hidden');
    }

    showDuelUI(active) {
        if (this.elements.duelBox) {
            this.elements.duelBox.style.display = active ? 'block' : 'none';
        }
        this.isDuelModeActive = active;
    }

    updateOpponent(data) {
        if (!this.elements.opponentScore || !data || !this.isDuelModeActive) return;
        
        const currentScore = parseInt(this.elements.opponentScore.textContent) || 0;
        const newScore = data.score || 0;
        
        if (currentScore !== newScore) {
            this.elements.opponentScore.textContent = newScore;
            // Visual feedback for opponent update
            this.elements.opponentScore.parentElement.style.transform = 'scale(1.1)';
            this.elements.opponentScore.parentElement.style.borderColor = '#3498db';
            setTimeout(() => {
                if (this.elements.opponentScore) {
                    this.elements.opponentScore.parentElement.style.transform = 'scale(1)';
                    this.elements.opponentScore.parentElement.style.borderColor = 'rgba(197, 160, 89, 0.3)';
                }
            }, 300);
        }

        if (this.elements.opponentStatus) {
            const turnLabel = this.callbacks.getTranslation('turn');
            const brokenLabel = this.callbacks.getTranslation('game_over_subtitle');
            
            this.elements.opponentStatus.textContent = data.isGameOver ? brokenLabel : `${turnLabel} ${data.turn || 0}`;
            this.elements.opponentStatus.style.color = data.isGameOver ? "#e74c3c" : "#3498db";
        }
    }

    syncVolume(settings) {
        if (this.elements.volMaster) this.elements.volMaster.value = settings.master;
        if (this.elements.volMasterRef) this.elements.volMasterRef.value = settings.master;
        if (this.elements.volMasterLabel) this.elements.volMasterLabel.textContent = `${Math.round(settings.master * 100)}%`;

        if (this.elements.volMusic) this.elements.volMusic.value = settings.music;
        if (this.elements.volMusicRef) this.elements.volMusicRef.value = settings.music;
        if (this.elements.volMusicLabel) this.elements.volMusicLabel.textContent = `${Math.round(settings.music * 100)}%`;
        
        if (this.elements.volSfx) this.elements.volSfx.value = settings.sfx;
        if (this.elements.volSfxRef) this.elements.volSfxRef.value = settings.sfx;
        if (this.elements.volSfxLabel) this.elements.volSfxLabel.textContent = `${Math.round(settings.sfx * 100)}%`;
        
        if (this.elements.volVoice) this.elements.volVoice.value = settings.voice;
        this.volumeVoix = settings.voice ?? 0.5;
    }

    showAutosave() {
        if (!this.elements.autosave) return;
        this.elements.autosave.style.opacity = '1';
        setTimeout(() => {
            if (this.elements.autosave) this.elements.autosave.style.opacity = '0';
        }, 1500);
    }

    showRefreshButton(active, onClick) {
        if (!this.elements.refreshBtn) return;
        this.elements.refreshBtn.classList.toggle('hidden', !active);
        if (active && onClick) {
            this.elements.refreshBtn.onclick = (e) => {
                e.stopPropagation();
                onClick();
            };
        }
    }
}
