/**
 * PersistenceController
 * Manages all game data persistence using localStorage.
 * Handles game progression, user settings, and global statistics.
 */
export class PersistenceController {
    constructor() {
        this.STORAGE_KEYS = {
            PROGRESSION: 'equilibre_progression',
            SETTINGS: 'equilibre_audio_settings',
            STATISTICS: 'equilibre_statistics',
            CONFIG: 'equilibre_app_config',
            LEADERBOARD: 'equilibre_duel_leaderboard'
        };
        
        this.data = {
            progression: this.load(this.STORAGE_KEYS.PROGRESSION, null),
            heritage: this.load('equilibre_heritage', {
                harmonyShards: 0,
                upgrades: {} // Format: { upgradeId: rank }
            }),
            settings: this.load(this.STORAGE_KEYS.SETTINGS, {
                master: 0.8,
                music: 0.5,
                sfx: 0.6,
                voice: 0.5
            }),
            config: this.load(this.STORAGE_KEYS.CONFIG, {
                language: 'fr',
                theme: 'classic',
                lightMode: false
            }),
            statistics: this.load(this.STORAGE_KEYS.STATISTICS, {
                gamesPlayed: 0,
                totalTurns: 0,
                highestScore: 0,
                totalLegacy: 0,
                totalHarmonyShards: 0,
                harmoniesReached: 0,
                lastPlayedDate: null,
                history: [],
                unlockedTrophies: []
            }),
            leaderboard: this.load(this.STORAGE_KEYS.LEADERBOARD, [])
        };
    }

    /**
     * Internal load from localStorage
     */
    load(key, defaultValue) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn(`PersistenceController: Failed to load ${key}`, e);
            return defaultValue;
        }
    }

    /**
     * Internal save to localStorage
     */
    save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`PersistenceController: Failed to save ${key}`, e);
        }
    }

    // --- Progression ---

    saveGameProgress(gameState) {
        if (!gameState || gameState.isGameOver) return;
        const progress = {
            pillars: gameState.pillars,
            score: gameState.score,
            turn: gameState.turn,
            seed: gameState.currentSeed,
            history: gameState.history,
            narrativeState: gameState.narrativeState,
            activeEvents: gameState.activeEvents,
            recentScenarios: gameState.recentScenarios,
            recentCategories: gameState.recentCategories,
            lastPlayedCategory: gameState.lastPlayedCategory,
            activeSynergy: gameState.activeSynergy,
            nextTurnModifier: gameState.nextTurnModifier,
            activeModifiers: gameState.activeModifiers,
            rescueUsed: gameState.rescueUsed,
            consecutiveHarmony: gameState.consecutiveHarmony,
            unlockedTrophies: gameState.unlockedTrophies,
            timestamp: Date.now()
        };
        this.data.progression = progress;
        this.save(this.STORAGE_KEYS.PROGRESSION, progress);
    }

    clearGameProgress() {
        this.data.progression = null;
        localStorage.removeItem(this.STORAGE_KEYS.PROGRESSION);
    }

    // --- Settings ---

    saveSettings(settings) {
        this.data.settings = { ...this.data.settings, ...settings };
        this.save(this.STORAGE_KEYS.SETTINGS, this.data.settings);
    }

    getSettings() {
        return this.data.settings;
    }

    // --- App Config ---

    saveConfig(config) {
        this.data.config = { ...this.data.config, ...config };
        this.save(this.STORAGE_KEYS.CONFIG, this.data.config);
    }

    getConfig() {
        return this.data.config;
    }

    // --- Statistics ---

    recordGameEnd(finalScore, turns, reachedHarmony, unlockedTrophies = []) {
        this.data.statistics.gamesPlayed++;
        this.data.statistics.totalTurns += turns;
        this.data.statistics.totalLegacy += finalScore;

        // Calculate Harmony Shards
        const earnedShards = Math.floor(finalScore / 100) + Math.floor(turns / 10) + (reachedHarmony ? 25 : 0);
        this.data.heritage.harmonyShards += earnedShards;
        this.data.statistics.totalHarmonyShards += earnedShards;
        
        if (finalScore > this.data.statistics.highestScore) {
            this.data.statistics.highestScore = finalScore;
        }
        
        if (reachedHarmony) {
            this.data.statistics.harmoniesReached++;
        }

        // Trophies
        if (!this.data.statistics.unlockedTrophies) this.data.statistics.unlockedTrophies = [];
        unlockedTrophies.forEach(id => {
            if (!this.data.statistics.unlockedTrophies.includes(id)) {
                this.data.statistics.unlockedTrophies.push(id);
            }
        });
        
        // Add to history (limit to last 20 runs)
        if (!this.data.statistics.history) this.data.statistics.history = [];
        this.data.statistics.history.unshift({
            date: new Date().toISOString(),
            score: finalScore,
            turns: turns,
            harmony: reachedHarmony,
            shards: earnedShards
        });
        this.data.statistics.history = this.data.statistics.history.slice(0, 20);
        
        this.data.statistics.lastPlayedDate = new Date().toISOString();
        this.save(this.STORAGE_KEYS.STATISTICS, this.data.statistics);
        this.save('equilibre_heritage', this.data.heritage);
        
        return earnedShards;
    }

    // --- Heritage ---

    getHeritage() {
        return this.data.heritage;
    }

    buyUpgrade(upgradeId, cost) {
        if (this.data.heritage.harmonyShards >= cost) {
            this.data.heritage.harmonyShards -= cost;
            const currentRank = this.data.heritage.upgrades[upgradeId] || 0;
            this.data.heritage.upgrades[upgradeId] = currentRank + 1;
            this.save('equilibre_heritage', this.data.heritage);
            return true;
        }
        return false;
    }

    getUpgradeRank(upgradeId) {
        return this.data.heritage.upgrades[upgradeId] || 0;
    }

    getStats() {
        return this.data.statistics;
    }

    // --- Leaderboard ---

    getLeaderboard() {
        return this.data.leaderboard || [];
    }

    saveDuelScore(name, score) {
        if (!this.data.leaderboard) this.data.leaderboard = [];
        
        this.data.leaderboard.push({
            name: name || "Anonyme",
            score: score,
            date: new Date().toISOString()
        });

        // Sort by score descending and keep top 10
        this.data.leaderboard.sort((a, b) => b.score - a.score);
        this.data.leaderboard = this.data.leaderboard.slice(0, 10);

        this.save(this.STORAGE_KEYS.LEADERBOARD, this.data.leaderboard);
        return this.data.leaderboard;
    }
}
