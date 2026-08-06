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
    HARMONIE_PLUS_BAS,
    HARMONIE_PLAFOND,
    HARMONIE_ECART_MAX,
    HARMONIE_TOURS_VICTOIRE,
    SCORE_VICTOIRE,
    PARCOURS,
    PILLARS,
    RARITY_DEFINITIONS,
    PILLAR_DEFINITIONS,
    MECHANICS
} from './game-config.js';

export class GameEngine {
    // Au-dela de ce tour, les effets cessent d'enfler. Sans ce plafond, une
    // partie longue -- en particulier en mode Meditation, qui ne se termine
    // jamais -- voyait tous les malus devenir des bonus.
    static TOUR_PLAFOND = 60;

    // Montee en puissance : l'amplitude des cartes part a 60 % et atteint son
    // plein au tour 8, laissant le temps d'apprendre.
    static TOURS_DOUX = 8;
    static DOUCEUR_DEPART = 0.6;

    // Filet des premieres parties : le premier pilier qui touche une borne ne
    // tue pas, il est ramene au centre avec un message qui nomme l'erreur.
    static PARTIES_PROTEGEES = 3;

    /** Duree de l'etape en cours, en semaines. Une carte = une semaine. */
    semainesRequises() {
        const e = PARCOURS[Math.min(this.etapeParcours || 0, PARCOURS.length - 1)];
        return e ? e.semaines : 3;
    }

    /** L'etape en cours, telle que l'interface doit la nommer. */
    etapeCourante() {
        return PARCOURS[Math.min(this.etapeParcours || 0, PARCOURS.length - 1)];
    }

    /** Le filet ne joue qu'une fois par partie, sur les toutes premieres. */
    filetDisponible() {
        if (this.filetUtilise || this.isMeditationMode) return false;
        // Meme raison que pour le conseil : tant que le joueur n'a jamais
        // gagne, il apprend encore. Compter les parties punissait celui qui
        // s'acharne.
        const trophees = this.globalStats?.unlockedTrophies || [];
        return !trophees.includes('premiere_victoire');
    }

    constructor(stats = {}, heritage = { upgrades: {} }) {
        this.pillars = {};
        PILLARS.forEach(p => this.pillars[p] = INITIAL_PILLAR_VALUE);
        
        this.score = 0;
        this.turn = 0;
        this.isGameOver = false;
        this.reachedHarmony = false;
        this.consecutiveHarmony = 0;
        this.isVictory = false;
        this.objectifVictoire = SCORE_VICTOIRE;
        this.etapeParcours = this.etapeParcours || 0;
        this.filetUtilise = false;
        this.dernierFilet = null;
        this.currentSeed = 0;
        this.history = []; // History of choices
        this.activeEvents = []; // Active persistent effects
        this.unlockedTrophies = []; // New trophies in this run
        this.triggeredAbilities = []; // Track triggered abilities in the current turn
        
        // Pantheon state
        this.selectedPantheon = null;
        this.isMeditationMode = false;
        
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

    reset(seed = null, pantheon = null, meditationMode = false) {
        this.selectedPantheon = pantheon;
        this.isMeditationMode = meditationMode;
        PILLARS.forEach(p => {
            this.pillars[p] = INITIAL_PILLAR_VALUE;
            
            // Apply Pantheon initial bonus
            if (this.selectedPantheon && this.selectedPantheon.bonus && this.selectedPantheon.bonus[p]) {
                this.pillars[p] += this.selectedPantheon.bonus[p];
            }
            
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
        this.isVictory = false;
        this.objectifVictoire = SCORE_VICTOIRE;
        this.etapeParcours = this.etapeParcours || 0;
        this.filetUtilise = false;
        this.dernierFilet = null;
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
        this.triggeredAbilities = [];
        this.currentSeed = seed !== null ? seed : Math.floor(Math.random() * 1000000);
    }

    loadState(state) {
        if (!state) return;
        this.pillars = { ...state.pillars };
        this.score = state.score || 0;
        this.turn = state.turn || 0;
        this.isMeditationMode = !!state.isMeditationMode;
        // Le pantheon etait bien sauvegarde par main.js ({ ...this.engine })
        // mais jamais relu ici : sur un "Continuer", le joueur perdait son
        // badge, sa capacite (deep_meditation, negotiator, carpe_diem,
        // harmony_mastery) et ses multiplicateurs jusqu'a la fin de la partie.
        this.selectedPantheon = state.selectedPantheon || null;
        this.triggeredAbilities = state.triggeredAbilities || [];
        this.currentSeed = state.seed || state.currentSeed;
        this.history = state.history || [];
        this.activeEvents = state.activeEvents || [];
        this.recentScenarios = state.recentScenarios || [];
        this.recentCategories = state.recentCategories || [];
        this.lastPlayedCategory = state.lastPlayedCategory || null;
        this.activeSynergy = state.activeSynergy || null;
        this.nextTurnModifier = state.nextTurnModifier || { ...this.nextTurnModifier };
        this.activeModifiers = state.activeModifiers || { ...this.activeModifiers };
        this.rescueUsed = !!state.rescueUsed;
        this.consecutiveHarmony = state.consecutiveHarmony || 0;
        this.unlockedTrophies = state.unlockedTrophies || [];
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

        // 1. Inject Pantheon Starting Card on Turn 0
        if (this.turn === 0 && this.selectedPantheon && this.selectedPantheon.startingCard) {
            const startingScenario = SCENARIOS.find(s => s.title === this.selectedPantheon.startingCard);
            if (startingScenario) {
                const startingCard = this.createCardFromScenario(startingScenario, 1);
                cards.push(startingCard);
                handScenarioTitles.add(startingScenario.title);
                handCategories.add(startingScenario.category);
            }
        }

        // 2. Chance to inject a World Event card
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

            // L'echelle n'avait aucun plafond : au tour 224 elle valait 6.6 et
            // les effets etaient multiplies par sept. Bornee a 2.5, atteinte au
            // tour 60 -- au-dela, la difficulte vient des seuils, pas de
            // l'inflation des chiffres.
            // Les premiers tours sont adoucis. A pleine amplitude des le
            // depart, un debutant mourait en trois tours huit fois sur dix --
            // trop court pour comprendre ce qui l'avait tue.
            const scale = this.turn < GameEngine.TOURS_DOUX
                ? GameEngine.DOUCEUR_DEPART
                  + (1 - GameEngine.DOUCEUR_DEPART) * (this.turn / GameEngine.TOURS_DOUX)
                : 1 + Math.min(this.turn - GameEngine.TOURS_DOUX, GameEngine.TOUR_PLAFOND) / 40;
            const card = this.createCardFromScenario(scenario, scale);
            cards.push(card);
        }
        return cards;
    }

    createCardFromScenario(scenario, scale) {
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
            specialEffect: scenario.specialEffect
        };
        
        for (const pillar in scenario.effects) {
            const base = scenario.effects[pillar];
            // Meme plafond pour l'amplitude aleatoire : elle atteignait ±13 au
            // tour 224, de quoi retourner n'importe quel sacrifice.
            const varianceRange = 4 + Math.floor(Math.min(this.turn, GameEngine.TOUR_PLAFOND) / 10);
            const variance = Math.floor(this.seededRandom() * varianceRange) - Math.floor(varianceRange / 2);
            
            let multiplier = this.activeModifiers.multiplier;
            
            // Apply Pantheon multipliers
            if (this.selectedPantheon && this.selectedPantheon.multiplier && this.selectedPantheon.multiplier[pillar]) {
                multiplier *= this.selectedPantheon.multiplier[pillar];
            }
            
            if (card.synergyStatus) {
                multiplier *= (1.0 + card.synergyStatus.bonus);
            }
            
            let valeur = Math.round((base + variance) * scale * multiplier);

            // La variance s'ajoute a la base : des qu'elle depassait la valeur
            // d'un malus, le signe s'inversait et la carte rapportait ce
            // qu'elle devait couter. Un sacrifice reste un sacrifice.
            if (base > 0 && valeur < 1) valeur = 1;
            else if (base < 0 && valeur > -1) valeur = -1;

            card.effects[pillar] = valeur;
        }
        return card;
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
        
        // Les modificateurs actifs pendant CE tour sont ceux annonces par la
        // carte precedente. La carte jouee maintenant arme le tour SUIVANT :
        // un seul cran de rotation. La version precedente en faisait deux,
        // decalant Choix supplementaire / Multiplicateur / Protection /
        // Corruption d'un tour de trop.
        const currentMods = { ...this.activeModifiers };
        this.activeModifiers = { ...nextMods };
        this.nextTurnModifier = nextMods;
        this.triggeredAbilities = [];

        this.history.push({
            turn: this.turn,
            cardId: card.id,
            title: card.title,
            effects: { ...card.effects },
            isWorldEvent: card.isWorldEvent,
            specialEffect: card.specialEffect
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
        this.applyPantheonPassives();
        this.calculateProgression();
    }

    applyPantheonPassives() {
        if (!this.selectedPantheon || !this.selectedPantheon.ability) return;

        const abilityId = this.selectedPantheon.ability.id;

        // Ascetic: Deep Meditation
        if (abilityId === 'deep_meditation' && this.turn % 10 === 0) {
            this.applyPillarChange('spirituality', 10, true);
            this.applyPillarChange('health', 10, true);
            this.triggeredAbilities.push(abilityId);
        }

        // Hedonist: Carpe Diem
        if (abilityId === 'carpe_diem' && this.pillars.love > 80) {
            PILLARS.forEach(p => {
                if (p !== 'love') this.applyPillarChange(p, 1, true);
            });
            this.triggeredAbilities.push(abilityId);
        }

        // Merchant: Negotiator - Triggered during applyPillarChange, handled differently or just flag it
        
        // Harmony Mastery - Triggered during calculateProgression
    }

    applyPillarChange(pillar, value, isProtected = false) {
        // Pas de sortie anticipee sur isGameOver ici : des qu'un pilier
        // franchissait une borne, les effets restants de LA MEME carte etaient
        // silencieusement abandonnes. Le joueur voyait une carte annoncant
        // "+20 amour, +20 sante, +20 argent" sans qu'aucune de ces valeurs ne
        // bouge, et le score final etait calcule sur un etat incomplet. Pire :
        // le resultat dependait de l'ordre des cles dans l'objet effects.
        // applyCard() garde son propre verrou, une carte ne peut pas etre
        // jouee apres la fin de partie.
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
            // Pantheon: Negotiator
            if (pillar === 'money' && this.selectedPantheon?.ability?.id === 'negotiator') {
                finalValue *= 0.75; // 25% reduction on negative costs
                if (!this.triggeredAbilities.includes('negotiator')) {
                    this.triggeredAbilities.push('negotiator');
                }
            }
            if (pillar === 'spirituality' && this.heritage.upgrades['inner_calm']) {
                // Spirituality mitigation reduces its negative impact on OTHERS
                // Actually, the upgrade description says "reduces impact negative of spirituality on others"
                // This logic is slightly complex here. Let's simplify: mitigation of spirituality loss.
                finalValue *= (1 - (this.heritage.upgrades['inner_calm'] * 0.02));
            }
        }

        this.pillars[pillar] += finalValue;
        
        if (!isProtected && !this.isMeditationMode) {
            if (this.pillars[pillar] <= GAME_OVER_THRESHOLD_LOW || this.pillars[pillar] >= GAME_OVER_THRESHOLD_HIGH) {
                // Check for Rescue (Second Souffle)
                if (pillar === 'health' && this.pillars[pillar] <= GAME_OVER_THRESHOLD_LOW && this.heritage.upgrades['second_wind'] && !this.rescueUsed) {
                    this.pillars[pillar] = 10;
                    this.rescueUsed = true;
                    // Log rescue event? We'll see.
                } else if (this.filetDisponible()) {
                    // Filet des premieres parties : la premiere erreur ne tue
                    // pas, elle enseigne. Le pilier revient au centre et le jeu
                    // nomme la faute.
                    const parExces = this.pillars[pillar] >= GAME_OVER_THRESHOLD_HIGH;
                    this.pillars[pillar] = 50;
                    this.filetUtilise = true;
                    this.dernierFilet = { pillar, parExces };
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
        // Harmonie : les piliers doivent etre proches ET dans la zone vivable.
        // L'ancienne mesure ne regardait que l'ecart : 95/95/95/95 etait
        // declare harmonieux a un tour de la mort.
        const plusBas = Math.min(...values), plusHaut = Math.max(...values);
        const isBalanced = plusBas >= HARMONIE_PLUS_BAS
                        && plusHaut <= HARMONIE_PLAFOND
                        && (plusHaut - plusBas) <= HARMONIE_ECART_MAX;
        const harmonyMultiplier = isBalanced ? 2.5 : 1.0;
        const balanceFactor = 100 - Math.sqrt(variance);
        const turnFactor = 1 + (this.turn / 10);
        
        let addedScore = Math.floor(balanceFactor * harmonyMultiplier * turnFactor);
        
        // Pantheon: Harmony Mastery
        if (this.reachedHarmony && this.selectedPantheon?.ability?.id === 'harmony_mastery') {
            addedScore *= 2;
            if (!this.triggeredAbilities.includes('harmony_mastery')) {
                this.triggeredAbilities.push('harmony_mastery');
            }
        }

        this.score += addedScore;
        this.lifetimeScore += addedScore;
        this.reachedHarmony = isBalanced;
        
        if (this.reachedHarmony) {
            this.consecutiveHarmony++;
        } else {
            this.consecutiveHarmony = 0;
        }

        // Victoire : avoir traverse la duree de l'etape sans qu'aucun pilier
        // ne touche une borne. Le joueur ne joue plus jusqu'a mourir, il
        // franchit une ligne d'arrivee.
        if (!this.isMeditationMode && !this.isVictory && !this.isGameOver
            && this.turn >= this.semainesRequises()) {
            this.isVictory = true;
            this.isGameOver = true;
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
