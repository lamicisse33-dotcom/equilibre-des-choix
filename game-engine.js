/**
 * ÉQUILIBRE - Game Engine Logic
 * Pure logic module for managing game state, score and cards.
 */

import { 
    SCENARIOS, 
    CRISIS_SCENARIOS, 
    WORLD_EVENTS,
    TROPHIES,
    INITIAL_PILLAR_VALUE, 
    GAME_OVER_THRESHOLD_LOW, 
    GAME_OVER_THRESHOLD_HIGH,
    HARMONY_VARIANCE_THRESHOLD,
    PILLARS,
    RARITY_DEFINITIONS,
    PILLAR_DEFINITIONS,
    MECHANICS
} from './game-config.js';

export class GameEngine {
    constructor(stats = {}, heritage = { upgrades: {} }) {
        this.pillars = {};
        PILLARS.forEach(p => this.pillars[p] = INITIAL_PILLAR_VALUE);
        
        this.score = 0;
        this.turn = 0;
        this.isGameOver = false;
        this.reachedHarmony = false;
        this.consecutiveHarmony = 0;
        this.currentSeed = 0;
        this.history = []; // History of choices
        this.activeEvents = []; // Active persistent effects
        this.unlockedTrophies = []; // New trophies in this run
        
        // Anti-repetition state
        this.recentScenarios = []; // IDs of recently seen scenarios
        this.recentCategories = []; // Categories of recently played cards
        
        // Synergies state
        this.lastPlayedCategory = null;
        this.activeSynergy = null; // { type: 'resonance'|'tension', message: string, bonus: number }
        
        // Special Effects state
        this.nextTurnModifier = {
            extraCards: 0,
            multiplier: 1,
            protected: false,
            refreshAvailable: false,
            corruption: 0 // Track corruption mechanic
        };
        this.activeModifiers = { ...this.nextTurnModifier };
        
        this.highScore = stats.highestScore || 0;
        this.lifetimeScore = stats.totalLegacy || 0;
        this.globalStats = stats;
        
        // Heritage & Upgrades
        this.heritage = heritage;
        this.rescueUsed = false;
    }

    reset(seed = null) {
        PILLARS.forEach(p => {
            this.pillars[p] = INITIAL_PILLAR_VALUE;
            // Apply start bonus upgrades
            const upgradeId = `unbreakable_bond`; // Special case for Love start bonus
            if (p === 'love' && this.heritage.upgrades[upgradeId]) {
                this.pillars[p] += 5; // As defined in Tome 11
            }
        });
        
        this.score = 0;
        this.turn = 0;
        this.isGameOver = false;
        this.reachedHarmony = false;
        this.consecutiveHarmony = 0;
        this.history = [];
        this.activeEvents = [];
        this.unlockedTrophies = [];
        this.recentScenarios = [];
        this.recentCategories = [];
        this.lastPlayedCategory = null;
        this.activeSynergy = null;
        this.rescueUsed = false;
        this.nextTurnModifier = {
            extraCards: 0,
            multiplier: 1,
            protected: false,
            refreshAvailable: false,
            corruption: 0
        };
        this.activeModifiers = { ...this.nextTurnModifier };
        this.currentSeed = seed !== null ? seed : Math.floor(Math.random() * 1000000);
    }

    seededRandom() {
        this.currentSeed = (this.currentSeed * 1664525 + 1013904223) % 4294967296;
        return this.currentSeed / 4294967296;
    }

    /**
     * Generate weights for rarity based on definitions
     */
    getRarityWeights() {
        const weights = {};
        for (const key in RARITY_DEFINITIONS) {
            weights[key] = RARITY_DEFINITIONS[key].weight;
        }
        
        // Apply Vision Prophétique (Luck)
        if (this.heritage.upgrades['prophetic_vision']) {
            weights['rare'] *= 1.25; // 25% boost to Rare appearance
            weights['epic'] *= 1.1;
        }

        return weights;
    }

    /**
     * Lecture & Choix Logic: Reading scenarios and preparing card objects
     */
    generateCards(count = 3) {
        // Use count or modified count
        const targetCount = count + this.activeModifiers.extraCards;
        const cards = [];
        const pool = [...SCENARIOS];
        
        if (this.turn > 8) pool.push(...CRISIS_SCENARIOS);
        if (this.turn > 20) pool.push(...CRISIS_SCENARIOS); 

        // Dynamic weights from config
        const rarityWeights = this.getRarityWeights();

        // Hand diversity trackers
        const handCategories = new Set();
        const handScenarioTitles = new Set();

        // 1. Chance to inject a World Event card
        if (this.turn > 5 && this.seededRandom() < 0.12) {
            const event = WORLD_EVENTS[Math.floor(this.seededRandom() * WORLD_EVENTS.length)];
            const eventCard = {
                id: 'event-' + Math.random().toString(36).substr(2, 5),
                title: event.title,
                category: "mixed",
                rarity: "epic",
                color: event.color || "#f3e5ab",
                icon: event.icon || PILLAR_DEFINITIONS.spirituality.icon,
                art: event.art,
                desc: event.desc + " (Effet persistant)",
                isWorldEvent: true,
                eventId: event.id,
                duration: event.duration,
                effects: {},
                effectsPerTurn: event.effectsPerTurn
            };
            cards.push(eventCard);
            handScenarioTitles.add(event.title);
            handCategories.add("mixed");
        }

        const cardsNeeded = targetCount - cards.length;

        for (let i = 0; i < cardsNeeded; i++) {
            const availablePool = pool.filter(s => {
                if (handScenarioTitles.has(s.title)) return false;
                if (this.recentScenarios.includes(s.title)) return false;
                return true;
            });

            const finalPool = availablePool.length > 0 ? availablePool : pool.filter(s => !handScenarioTitles.has(s.title));

            let totalWeight = 0;
            finalPool.forEach(s => {
                let weight = rarityWeights[s.rarity || 'common'] || 0;
                
                const categoryCount = this.recentCategories.filter(c => c === s.category).length;
                if (categoryCount > 0) weight = Math.max(1, weight / (categoryCount + 1));
                
                if (handCategories.has(s.category)) weight = Math.max(1, weight / 4);

                s._tempWeight = weight;
                totalWeight += weight;
            });

            let random = this.seededRandom() * totalWeight;
            let scenario = finalPool[0];
            
            for (const s of finalPool) {
                if (random < s._tempWeight) {
                    scenario = s;
                    break;
                }
                random -= s._tempWeight;
            }

            handScenarioTitles.add(scenario.title);
            handCategories.add(scenario.category);
            
            this.recentScenarios.push(scenario.title);
            if (this.recentScenarios.length > 9) this.recentScenarios.shift();

            const scale = 1 + (this.turn / 40); 
            const rarityInfo = RARITY_DEFINITIONS[scenario.rarity || 'common'];
            
            const card = {
                id: Math.random().toString(36).substr(2, 9),
                title: scenario.title,
                category: scenario.category,
                rarity: scenario.rarity || 'common',
                color: scenario.color || rarityInfo.color,
                icon: scenario.icon || (PILLAR_DEFINITIONS[scenario.category]?.icon),
                art: scenario.art,
                desc: scenario.desc,
                animation: rarityInfo.animation,
                vfx: rarityInfo.vfx,
                effects: {},
                synergyStatus: this.getSynergyEffect(scenario.category),
                specialEffect: scenario.specialEffect,
                convergence: scenario.convergence || null
            };
            
            for (const pillar in scenario.effects) {
                const base = scenario.effects[pillar];
                const varianceRange = 4 + Math.floor(this.turn / 10);
                const variance = Math.floor(this.seededRandom() * varianceRange) - Math.floor(varianceRange / 2);
                
                let multiplier = this.activeModifiers.multiplier;
                if (card.synergyStatus) {
                    multiplier *= (1.0 + card.synergyStatus.bonus);
                }
                
                card.effects[pillar] = Math.round((base + variance) * scale * multiplier);
            }
            cards.push(card);
        }
        return cards;
    }

    getSynergyEffect(currentCategory) {
        if (!this.lastPlayedCategory) return null;

        // Use hardcoded synergies or move them to config?
        // Moving to config later if needed, but for now just keeping logic clean.
        const synergies = {
            'health': { 'spirituality': { type: 'resonance', message: 'Résonance Vitale', bonus: 0.3 } },
            'money': { 'love': { type: 'tension', message: 'Tension Matérielle', bonus: -0.3 } },
            'love': { 'money': { type: 'resonance', message: 'Harmonie Sociale', bonus: 0.2 } },
            'spirituality': { 'health': { type: 'resonance', message: 'Paix Intérieure', bonus: 0.2 } }
        };

        return synergies[this.lastPlayedCategory]?.[currentCategory] || null;
    }

    /**
     * Effets & Validation Logic
     */
    applyCard(card) {
        if (this.isGameOver) return;

        this.activeSynergy = this.getSynergyEffect(card.category);
        this.lastPlayedCategory = card.category;

        this.recentCategories.push(card.category);
        if (this.recentCategories.length > 4) this.recentCategories.shift();

        const nextMods = {
            extraCards: 0,
            multiplier: 1,
            protected: false,
            refreshAvailable: false,
            corruption: 0
        };

        if (card.specialEffect) {
            switch (card.specialEffect) {
                case MECHANICS.EXTRA_CHOICE: nextMods.extraCards = 1; break;
                case MECHANICS.PROTECTION: nextMods.protected = true; break;
                case MECHANICS.MULTIPLIER: nextMods.multiplier = 2; break;
                case MECHANICS.REFRESH: nextMods.refreshAvailable = true; break;
                case MECHANICS.CORRUPTION: nextMods.corruption = 10; break;
            }
        }
        
        // Les modificateurs actifs pendant CE tour (protection, corruption)
        // sont ceux annonces par la carte du tour precedent.
        const currentMods = { ...this.activeModifiers };
        // La carte jouee maintenant arme le tour SUIVANT : un seul cran de
        // rotation, sinon l'effet arrive avec deux tours de retard.
        this.activeModifiers = nextMods;
        this.nextTurnModifier = nextMods;

        this.history.push({
            turn: this.turn,
            cardId: card.id,
            title: card.title,
            effects: { ...card.effects },
            isWorldEvent: card.isWorldEvent,
            specialEffect: card.specialEffect,
            convergence: card.convergence || null
        });

        if (card.isWorldEvent) {
            const existing = this.activeEvents.find(e => e.eventId === card.eventId);
            if (existing) {
                existing.remainingTurns = card.duration;
            } else {
                this.activeEvents.push({
                    eventId: card.eventId,
                    title: card.title,
                    effectsPerTurn: card.effectsPerTurn,
                    remainingTurns: card.duration
                });
            }
        }

        // --- CONVERGENCE ---
        // Rapproche les quatre piliers de leur moyenne commune, puis applique
        // une elevation optionnelle. Le gain de la convergence est nul par
        // construction : elle rabote la force autant qu'elle releve la
        // faiblesse. C'est l'elevation qui peut tuer, si la moyenne est deja
        // haute — la carte n'est donc jamais parfaite, sa valeur depend de
        // l'etat du joueur au moment ou elle sort.
        if (card.convergence) {
            const ratio = Math.max(0, Math.min(1, card.convergence.ratio || 0));
            const vals = PILLARS.map(p => this.pillars[p]);
            const moyenne = vals.reduce((a, b) => a + b, 0) / vals.length;

            PILLARS.forEach(p => {
                this.pillars[p] += (moyenne - this.pillars[p]) * ratio;
                this.pillars[p] = Math.max(0, Math.min(100, this.pillars[p]));
            });

            const bonus = card.convergence.bonus || 0;
            if (bonus !== 0) {
                PILLARS.forEach(p => this.applyPillarChange(p, bonus, currentMods.protected));
            }
        }

        // Apply instant effects
        for (const pillar in card.effects) {
            let effectValue = card.effects[pillar];
            
            // Unexpected Windfall (Money Luck)
            if (pillar === 'money' && effectValue < 0 && this.heritage.upgrades['unexpected_windfall']) {
                if (this.seededRandom() < 0.05) {
                    effectValue = 0; // Cost nullified
                }
            }
            
            this.applyPillarChange(pillar, effectValue, currentMods.protected);
        }

        // Apply corruption if active
        if (currentMods.corruption > 0) {
            PILLARS.forEach(p => {
                this.applyPillarChange(p, -currentMods.corruption, false);
            });
        }

        // Apply world events
        this.activeEvents.forEach((event) => {
            for (const pillar in event.effectsPerTurn) {
                this.applyPillarChange(pillar, event.effectsPerTurn[pillar], currentMods.protected);
            }
            event.remainingTurns--;
        });

        this.activeEvents = this.activeEvents.filter(e => e.remainingTurns > 0);

        this.turn++;
        this.calculateProgression();
    }

    applyPillarChange(pillar, value, isProtected = false) {
        if (this.isGameOver) return;
        if (!this.pillars.hasOwnProperty(pillar)) return; // Security for dynamic pillars
        
        let finalValue = value;

        // Apply Heritage Upgrades
        if (value > 0) {
            // Boost
            if (pillar === 'love' && this.heritage.upgrades['open_heart']) {
                finalValue *= (1 + (this.heritage.upgrades['open_heart'] * 0.03));
            }
        } else if (value < 0) {
            // Mitigation
            if (pillar === 'health' && this.heritage.upgrades['stone_body']) {
                finalValue *= (1 - (this.heritage.upgrades['stone_body'] * 0.03));
            }
            if (pillar === 'money' && this.heritage.upgrades['wise_management']) {
                finalValue *= (1 - (this.heritage.upgrades['wise_management'] * 0.03));
            }
            if (pillar === 'spirituality' && this.heritage.upgrades['inner_calm']) {
                // Spirituality mitigation reduces its negative impact on OTHERS
                // Actually, the upgrade description says "reduces impact negative of spirituality on others"
                // This logic is slightly complex here. Let's simplify: mitigation of spirituality loss.
                finalValue *= (1 - (this.heritage.upgrades['inner_calm'] * 0.02));
            }
        }

        this.pillars[pillar] += finalValue;
        
        if (!isProtected) {
            if (this.pillars[pillar] <= GAME_OVER_THRESHOLD_LOW || this.pillars[pillar] >= GAME_OVER_THRESHOLD_HIGH) {
                // Check for Rescue (Second Souffle)
                if (pillar === 'health' && this.pillars[pillar] <= GAME_OVER_THRESHOLD_LOW && this.heritage.upgrades['second_wind'] && !this.rescueUsed) {
                    this.pillars[pillar] = 10;
                    this.rescueUsed = true;
                    // Log rescue event? We'll see.
                } else {
                    this.isGameOver = true;
                }
            }
        }
        
        this.pillars[pillar] = Math.max(0, Math.min(100, this.pillars[pillar]));
    }

    calculateProgression() {
        const values = Object.values(this.pillars);
        const mean = values.reduce((a, b) => a + b) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const isBalanced = variance < HARMONY_VARIANCE_THRESHOLD;
        const harmonyMultiplier = isBalanced ? 2.5 : 1.0;
        const balanceFactor = 100 - Math.sqrt(variance);
        const turnFactor = 1 + (this.turn / 10);
        const addedScore = Math.floor(balanceFactor * harmonyMultiplier * turnFactor);
        
        this.score += addedScore;
        this.lifetimeScore += addedScore;
        this.reachedHarmony = isBalanced;
        
        if (this.reachedHarmony) {
            this.consecutiveHarmony++;
        } else {
            this.consecutiveHarmony = 0;
        }

        const currentTrophyIds = (this.globalStats.unlockedTrophies || []).concat(this.unlockedTrophies);
        TROPHIES.forEach(t => {
            if (!currentTrophyIds.includes(t.id)) {
                if (t.requirement(this, this.globalStats)) {
                    this.unlockedTrophies.push(t.id);
                }
            }
        });

        if (this.reachedHarmony && !this.isGameOver) {
            for (const pillar in this.pillars) {
                const driftDirection = 50 - this.pillars[pillar];
                if (Math.abs(driftDirection) > 0) {
                    this.pillars[pillar] += Math.sign(driftDirection) * 2;
                }
            }
        }

        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
    }
}
