import { ALL_NARRATIVE_EVENTS } from './narrative-events.js';

export class NarrativeController {
    constructor() {
        this.activeChains = new Map(); // Map of eventId -> currentStepIndex
    }

    /**
     * Checks if any new narrative events should trigger based on current game state.
     * @param {Object} engine - The current game engine state.
     */
    checkTriggers(engine) {
        for (const event of ALL_NARRATIVE_EVENTS) {
            if (!this.activeChains.has(event.id) && event.trigger(engine)) {
                // Potential to trigger a new narrative chain
                if (Math.random() < event.chance) { 
                    this.activeChains.set(event.id, 0);
                    console.log(`Narrative triggered: ${event.id}`);
                }
            }
        }
    }

    /**
     * Injects narrative cards into the generated pool if active.
     * @param {Array} currentCards - The cards already generated.
     * @returns {Array} Updated cards list.
     */
    injectNarrativeCards(currentCards) {
        const narrativeCards = [];
        
        for (const [eventId, stepIndex] of this.activeChains) {
            const event = ALL_NARRATIVE_EVENTS.find(e => e.id === eventId);
            if (event && stepIndex < event.steps.length) {
                const nextStep = event.steps[stepIndex];
                narrativeCards.push({
                    ...nextStep,
                    narrativeEventId: eventId,
                    narrativeStep: stepIndex,
                    isNarrative: true
                });
            }
        }

        if (narrativeCards.length > 0) {
            // We only allow one narrative card to appear at once for gameplay balance
            const injected = narrativeCards[Math.floor(Math.random() * narrativeCards.length)];
            const result = [...currentCards];
            // Replace a random card from the generated set
            result[Math.floor(Math.random() * result.length)] = injected;
            return result;
        }

        return currentCards;
    }

    /**
     * Called when a card is played. If it was a narrative card, progress the chain.
     * @param {Object} cardData - The card that was played.
     */
    onCardPlayed(cardData) {
        if (cardData.isNarrative && cardData.narrativeEventId) {
            const eventId = cardData.narrativeEventId;
            const currentStep = this.activeChains.get(eventId);
            const event = ALL_NARRATIVE_EVENTS.find(e => e.id === eventId);
            
            if (event && currentStep + 1 < event.steps.length) {
                this.activeChains.set(eventId, currentStep + 1);
            } else {
                // Chain finished
                this.activeChains.delete(eventId);
                console.log(`Narrative finished: ${eventId}`);
            }
        }
    }

    /**
     * Reset the narrative state (on new game)
     */
    reset() {
        this.activeChains.clear();
    }

    /**
     * Get state for persistence
     */
    getState() {
        return Array.from(this.activeChains.entries());
    }

    /**
     * Load state from persistence
     */
    loadState(state) {
        if (Array.isArray(state)) {
            this.activeChains = new Map(state);
        }
    }
}
