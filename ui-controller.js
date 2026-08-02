import { PILLAR_DEFINITIONS, RARITY_DEFINITIONS, MECHANICS } from './game-config.js';

export class UIController {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.elements = {
            score: document.getElementById('score-value'),
            highScore: document.getElementById('high-score-value'),
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
            dangerVignette: document.getElementById('danger-vignette')
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
        
        this.elements.volVoice?.addEventListener('input', (e) => this.callbacks.onVolumeChange('voice', parseFloat(e.target.value)));

        this.elements.configLang.addEventListener('change', (e) => this.callbacks.onConfigChange('language', e.target.value));
        this.elements.configLangRef.addEventListener('change', (e) => this.callbacks.onConfigChange('language', e.target.value));
        
        this.elements.configTheme.addEventListener('change', (e) => this.callbacks.onConfigChange('theme', e.target.value));
        this.elements.configThemeRef.addEventListener('change', (e) => this.callbacks.onConfigChange('theme', e.target.value));
        
        const handleLightMode = () => {
            this.callbacks.onConfigChange('lightMode', !this.lastSyncConfig?.lightMode);
        };
        this.elements.configLightMode.addEventListener('click', handleLightMode);
        this.elements.configLightModeRef.addEventListener('click', handleLightMode);

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

    syncConfig(config) {
        this.lastSyncConfig = config;
        if (this.elements.configLang) this.elements.configLang.value = config.language;
        if (this.elements.configLangRef) this.elements.configLangRef.value = config.language;
        
        if (this.elements.configTheme) this.elements.configTheme.value = config.theme;
        if (this.elements.configThemeRef) this.elements.configThemeRef.value = config.theme;
        
        if (this.elements.configLightMode) {
            this.elements.configLightMode.textContent = config.lightMode ? 'ON' : 'OFF';
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
        updateText('highScore', gameState.highScore);
        updateText('turn', gameState.turn);
        updateText('lifetime', gameState.lifetimeScore);

        let isAnyPillarInDanger = false;

        if (this.elements.harmonyBadge) {
            gameState.reachedHarmony ? this.elements.harmonyBadge.classList.remove('hidden') : this.elements.harmonyBadge.classList.add('hidden');
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

        if (this.elements.dangerVignette) {
            if (isAnyPillarInDanger) {
                this.elements.dangerVignette.classList.add('active');
            } else {
                this.elements.dangerVignette.classList.remove('active');
            }
        }
    }

    showCardInfo(data, currentPillars) {
        if (!this.elements.cardInfo) return;

        if (!data) {
            this.elements.cardInfo.classList.add('hidden');
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
            this.elements.cardRarity.textContent = (data.rarity || 'common').toUpperCase();
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
    }

    showGameOver(gameState, isNewRecord, duelOpponent = null) {
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
            let html = '<div style="margin-bottom: 10px; color: var(--gold); letter-spacing: 2px;">VOTRE PARCOURS</div>';
            gameState.history.slice(-5).forEach(h => {
                html += `<div style="margin-bottom: 5px; display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 2px;">
                    <span>Tour ${h.turn + 1}: ${h.title}</span>
                </div>`;
            });
            summaryEl.innerHTML = html;
        }

        if (this.elements.gameOverTitle) {
            if (isNewRecord) {
                this.elements.gameOverTitle.textContent = "Un Nouvel Héritage";
                this.elements.gameOverTitle.style.color = "var(--gold-bright)";
            } else {
                this.elements.gameOverTitle.textContent = "Le Cycle s'achève";
                this.elements.gameOverTitle.style.color = "var(--gold)";
            }
        }

        if (this.elements.gameOverDesc) {
            this.elements.gameOverDesc.textContent = isNewRecord ? 
                "Votre sagesse a transcendé le temps." : 
                "Un moment de calme avant le renouveau.";
        }

        if (this.elements.gameOver) this.elements.gameOver.classList.remove('hidden');
    }

    hideGameOver() {
        this.elements.gameOver.classList.add('hidden');
    }

    showDuelUI(active) {
        if (this.elements.duelBox) {
            this.elements.duelBox.style.display = active ? 'block' : 'none';
        }
    }

    updateOpponent(data) {
        if (!this.elements.opponentScore || !data) return;
        
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
