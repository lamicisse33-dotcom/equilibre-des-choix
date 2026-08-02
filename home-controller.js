export class HomeController {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.elements = {
            homeScreen: document.getElementById('home-screen'),
            newGameBtn: document.getElementById('new-game-btn'),
            duelBtn: document.getElementById('duel-btn'),
            continueBtn: document.getElementById('continue-game-btn'),
            statsBtn: document.getElementById('stats-btn'),
            memoriesBtn: document.getElementById('memories-btn'),
            rulesBtn: document.getElementById('rules-btn'),
            settingsBtn: document.getElementById('home-settings-btn'),
            rulesOverlay: document.getElementById('rules-overlay'),
            closeRulesBtn: document.getElementById('close-rules-btn'),
            statsOverlay: document.getElementById('stats-overlay'),
            closeStatsBtn: document.getElementById('close-stats-btn'),
            memoriesOverlay: document.getElementById('memories-overlay'),
            closeMemoriesBtn: document.getElementById('close-memories-btn'),
            memoriesList: document.getElementById('memories-list'),
            heritageBtn: document.getElementById('heritage-btn'),
            heritageOverlay: document.getElementById('heritage-overlay'),
            closeHeritageBtn: document.getElementById('close-heritage-btn'),
            heritageTreeContent: document.getElementById('heritage-tree-content'),
            harmonyShardsVal: document.getElementById('harmony-shards-val'),
            creditsBtn: document.getElementById('credits-btn'),
            creditsOverlay: document.getElementById('credits-overlay'),
            closeCreditsBtn: document.getElementById('close-credits-btn'),
            dateDisplay: document.getElementById('home-current-date'),
            gameContainer: document.getElementById('game-container'),
            uiOverlay: document.getElementById('ui-overlay')
        };
        
        this.init();
    }

    init() {
        if (this.elements.dateDisplay) {
            const now = new Date();
            this.elements.dateDisplay.textContent = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}`;
        }

        this.elements.newGameBtn?.addEventListener('click', () => this.callbacks.onPlay(false));
        this.elements.duelBtn?.addEventListener('click', () => this.callbacks.onDuel());
        this.elements.continueBtn?.addEventListener('click', () => this.callbacks.onPlay(true));
        
        this.elements.statsBtn?.addEventListener('click', () => {
            this.callbacks.onShowStats();
            this.elements.statsOverlay?.classList.remove('hidden');
        });

        this.elements.closeStatsBtn?.addEventListener('click', () => {
            this.elements.statsOverlay?.classList.add('hidden');
        });

        this.elements.memoriesBtn?.addEventListener('click', () => {
            this.callbacks.onShowMemories();
            this.elements.memoriesOverlay?.classList.remove('hidden');
        });

        this.elements.closeMemoriesBtn?.addEventListener('click', () => {
            this.elements.memoriesOverlay?.classList.add('hidden');
        });

        this.elements.heritageBtn?.addEventListener('click', () => {
            this.callbacks.onShowHeritage();
            this.elements.heritageOverlay?.classList.remove('hidden');
        });

        this.elements.closeHeritageBtn?.addEventListener('click', () => {
            this.elements.heritageOverlay?.classList.add('hidden');
        });

        this.elements.creditsBtn?.addEventListener('click', () => {
            this.elements.creditsOverlay?.classList.remove('hidden');
        });

        this.elements.closeCreditsBtn?.addEventListener('click', () => {
            this.elements.creditsOverlay?.classList.add('hidden');
        });
        
        this.elements.rulesBtn?.addEventListener('click', () => {
            this.elements.rulesOverlay?.classList.remove('hidden');
        });

        this.elements.closeRulesBtn?.addEventListener('click', () => {
            this.elements.rulesOverlay?.classList.add('hidden');
        });
        
        this.elements.settingsBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.callbacks.onOpenSettings();
        });
    }

    updateMemoriesList(history, unlockedTrophies = []) {
        if (!this.elements.memoriesList) return;
        
        let html = '';

        // Import TROPHIES from game-config
        import('./game-config.js').then(module => {
            const TROPHIES = module.TROPHIES;
            
            // 1. Unlocked Trophies Section
            if (unlockedTrophies.length > 0) {
                html += `<div style="font-family: var(--font-serif); color: var(--gold); letter-spacing: 3px; margin-bottom: 15px; border-bottom: 1px solid var(--gold); padding-bottom: 5px;">HAUTS FAITS</div>`;
                html += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px;">`;
                unlockedTrophies.forEach(id => {
                    const t = TROPHIES.find(x => x.id === id);
                    if (t) {
                        html += `
                            <div style="background: rgba(197, 160, 89, 0.1); border: 1px solid rgba(197, 160, 89, 0.3); padding: 10px; display: flex; align-items: center; gap: 10px;">
                                <div style="font-size: 1.2rem;">${t.icon}</div>
                                <div>
                                    <div style="font-family: var(--font-serif); font-size: 0.65rem; color: var(--gold-bright);">${t.title}</div>
                                    <div style="font-size: 0.5rem; opacity: 0.6;">${t.desc}</div>
                                </div>
                            </div>
                        `;
                    }
                });
                html += `</div>`;
            }

            // 2. Recent Runs Section
            html += `<div style="font-family: var(--font-serif); color: var(--gold); letter-spacing: 3px; margin-bottom: 15px; border-bottom: 1px solid var(--gold); padding-bottom: 5px;">CYCLES PRÉCÉDENTS</div>`;
            
            if (!history || history.length === 0) {
                html += '<div style="opacity: 0.5; text-align: center; margin-top: 20px;">Aucun cycle encore gravé...</div>';
            } else {
                history.forEach(run => {
                    const date = new Date(run.date).toLocaleDateString();
                    const harmonyTag = run.harmony ? '<span style="color: var(--gold-bright); font-size: 0.6rem; letter-spacing: 1px;">[HARMONIE]</span>' : '';
                    html += `
                        <div style="border-bottom: 1px solid rgba(197, 160, 89, 0.1); padding: 10px 0; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-family: var(--font-serif); color: var(--gold); font-size: 0.8rem;">${date} ${harmonyTag}</div>
                                <div style="font-size: 0.6rem; opacity: 0.6;">${run.turns} cycles</div>
                            </div>
                            <div style="font-family: var(--font-serif); font-size: 1rem;">${run.score}</div>
                        </div>
                    `;
                });
            }
            
            this.elements.memoriesList.innerHTML = html;
        });
    }

    updateStats(stats) {
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        setVal('stat-games-val', stats.gamesPlayed);
        setVal('stat-turns-val', stats.totalTurns);
        setVal('stat-best-val', stats.highestScore);
        setVal('stat-legacy-val', stats.totalLegacy);
        setVal('stat-harmonies-val', stats.harmoniesReached);
    }

    updateHeritageTree(heritage) {
        if (!this.elements.heritageTreeContent) return;
        
        this.elements.harmonyShardsVal.textContent = heritage.harmonyShards;
        
        import('./game-config.js').then(module => {
            const TREE = module.LEGACY_TREE;
            let html = '';
            
            for (const branchKey in TREE) {
                const branch = TREE[branchKey];
                html += `
                    <div class="heritage-branch">
                        <h4>${branch.name}</h4>
                `;
                
                branch.upgrades.forEach(up => {
                    const currentRank = heritage.upgrades[up.id] || 0;
                    const isMax = currentRank >= up.maxRank;
                    const cost = up.cost * (currentRank + 1);
                    const canAfford = heritage.harmonyShards >= cost && !isMax;
                    
                    html += `
                        <div class="upgrade-item ${canAfford ? 'affordable' : ''}">
                            <div class="upgrade-header">
                                <div class="upgrade-name">${up.name}</div>
                                <div class="upgrade-rank">Rang ${currentRank}/${up.maxRank}</div>
                            </div>
                            <div class="upgrade-cost">
                                <span>${isMax ? 'MAX' : cost}</span>
                                <span style="font-size: 0.5rem; opacity: 0.6;">ÉCLATS</span>
                            </div>
                            <button class="buy-upgrade-btn" 
                                ${canAfford ? '' : 'disabled'} 
                                data-id="${up.id}" 
                                data-cost="${cost}">
                                ${isMax ? 'Acquis' : 'Améliorer'}
                            </button>
                        </div>
                    `;
                });
                
                html += `</div>`;
            }
            
            this.elements.heritageTreeContent.innerHTML = html;
            
            // Add click listeners to buttons
            this.elements.heritageTreeContent.querySelectorAll('.buy-upgrade-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.dataset.id;
                    const cost = parseInt(e.target.dataset.cost);
                    this.callbacks.onBuyUpgrade(id, cost);
                });
            });
        });
    }

    updateContinueButton(hasProgress) {
        if (hasProgress) {
            this.elements.continueBtn?.classList.remove('hidden');
        } else {
            this.elements.continueBtn?.classList.add('hidden');
        }
    }

    startExperience() {
        this.elements.homeScreen?.classList.add('hidden');
        this.elements.gameContainer?.classList.remove('hidden');
        this.elements.uiOverlay?.classList.remove('hidden');
    }

    showHome() {
        this.elements.homeScreen?.classList.remove('hidden');
        this.elements.gameContainer?.classList.add('hidden');
        this.elements.uiOverlay?.classList.add('hidden');
    }

    hide() {
        this.elements.homeScreen?.classList.add('hidden');
        this.elements.gameContainer?.classList.remove('hidden');
        this.elements.uiOverlay?.classList.remove('hidden');
    }
}
