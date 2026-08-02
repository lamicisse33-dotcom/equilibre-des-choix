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

            this.db = init({ appId: this.appId });
            this.isConnected = true;
            this.isDuelActive = true;
            
            if (this.unsubscribe) this.unsubscribe();

            // Subscribe to the duel participants
            this.unsubscribe = this.db.subscribeQuery({ duels: {} }, (result) => {
                if (result.error) {
                    console.error("DuelController: Subscription error", result.error);
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

            // Initial presence
            this.updateMyScore(0, 0, false);
            
            return true;
        } catch (e) {
            console.error("DuelController: Connection failed", e);
            this.isConnected = false;
            return false;
        }
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
