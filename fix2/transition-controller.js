/**
 * ÉQUILIBRE - Transition Controller
 * Handles visual fades and smooth transitions between game states.
 */

export class TransitionController {
    constructor() {
        this.fader = document.getElementById('screen-fader');
    }

    /**
     * Fades the screen to a specific opacity.
     * @param {number} opacity - 0 to 1
     * @param {number} durationMs - duration in ms
     * @returns {Promise} - Resolves when transition ends
     */
    fade(opacity, durationMs = 800) {
        return new Promise((resolve) => {
            if (!this.fader) return resolve();
            
            this.fader.style.transitionDuration = `${durationMs}ms`;
            
            if (opacity > 0) {
                this.fader.classList.add('active');
            } else {
                this.fader.classList.remove('active');
            }
            
            setTimeout(() => {
                resolve();
            }, durationMs);
        });
    }

    /**
     * Executes a callback during a full black transition.
     * @param {Function} callback - what to do when screen is black
     */
    async transition(callback, fadeDuration = 800) {
        await this.fade(1, fadeDuration);
        if (callback) callback();
        await this.fade(0, fadeDuration);
    }
}
