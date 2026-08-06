import { init, tx, id } from '@instantdb/core';

/**
 * DuelController
 * Manages real-time connection and synchronization for the Duel mode.
 * Uses InstantDB to sync scores between players.
 */
export class DuelController {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.appId = '5a68d87a-3607-4e94-8711-b0e251a31945'; // Placeholder APP ID
        this.db = null;
        this.roomId = 'global-duel-room';
        this.userId = id();
        this.isConnected = false;
        this.isDuelActive = false;
        this.unsubscribe = null;
    }

    async connect() {
        try {
            if (this.isConnected) return true;

            // Optional: check if valid UUID format for appId
            const isValidAppId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(this.appId);
            if (!isValidAppId || this.appId.includes('placeholder')) {
                console.warn("DuelController: Invalid or placeholder App ID. Duel features will be simulated.");
                this.isDuelActive = true; 
                this.isConnected = true; 
                this.startGhostSimulation();
                return true;
            }

            this.db = init({ appId: this.appId });
            this.isConnected = true;
            this.isDuelActive = true;
            
            if (this.unsubscribe) this.unsubscribe();

            // Subscribe to the duel participants
            if (this.db) {
                this.unsubscribe = this.db.subscribeQuery({ duels: {} }, (result) => {
                    if (result.error) {
                        console.warn("DuelController: Subscription error (likely invalid App ID)", result.error);
                        return;
                    }

                    if (result.data && result.data.duels) {
                        const now = Date.now();
                        const activeOthers = result.data.duels.filter(d => 
                            d.userId !== this.userId && 
                            d.room === this.roomId &&
                            (now - d.lastUpdate) < 30000 
                        );

                        if (activeOthers.length > 0) {
                            activeOthers.sort((a, b) => b.lastUpdate - a.lastUpdate);
                            this.callbacks.onOpponentUpdate(activeOthers[0]);
                        }
                    }
                });
            }

            // Initial presence
            this.updateMyScore(0, 0, false);
            
            return true;
        } catch (e) {
            console.error("DuelController: Connection failed", e);
            this.isConnected = false;
            return false;
        }
    }

    startGhostSimulation() {
        this.ghostState = {
            score: 0,
            turn: 0,
            isGameOver: false,
            userId: 'ghost-123'
        };

        this.ghostInterval = setInterval(() => {
            if (!this.isDuelActive) {
                clearInterval(this.ghostInterval);
                return;
            }

            if (this.ghostState.isGameOver) return;

            // Ghost plays every few seconds with varying speed
            const shouldPlay = Math.random() > 0.3;
            if (shouldPlay) {
                this.ghostState.turn++;
                
                // Varied score gain
                const gain = Math.floor(Math.random() * 80) + 20;
                this.ghostState.score += gain;

                // Chance to enter harmony (simulated)
                const inHarmony = Math.random() > 0.6;
                if (inHarmony) this.ghostState.score += 100;

                if (this.ghostState.turn > 40 && Math.random() < 0.08) {
                    this.ghostState.isGameOver = true;
                }

                this.callbacks.onOpponentUpdate({ ...this.ghostState });
            }
        }, 3000 + Math.random() * 2000);
    }

    updateMyScore(score, turn, isGameOver) {
        if (!this.isConnected || !this.isDuelActive || !this.db) return;

        try {
            this.db.transact(
                tx.duels[this.userId].update({
                    room: this.roomId,
                    userId: this.userId,
                    score: score,
                    turn: turn,
                    isGameOver: isGameOver,
                    lastUpdate: Date.now()
                })
            );
        } catch (e) {
            console.warn("DuelController: Sync failed", e);
        }
    }

    disconnect() {
        if (this.ghostInterval) {
            clearInterval(this.ghostInterval);
            this.ghostInterval = null;
        }

        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        if (this.db && this.userId && this.isConnected) {
            try {
                this.db.transact(tx.duels[this.userId].delete());
            } catch (e) {
                console.warn("DuelController: Disconnect failed", e);
            }
        }
        this.isConnected = false;
        this.isDuelActive = false;
    }
}
