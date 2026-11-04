import { createEngine, restoreEngine, playSageTurn } from './strategy-mode.js?v=70';
/** Adversaire local : de vrais choix sur le même moteur que les cartes 3D. */
export class DuelController {
    constructor(callbacks){this.callbacks=callbacks;this.isDuelActive=false;this.isConnected=false;this.engine=null;this.hand=[];this.redraws=2;this.lastTurn=0;}
    async connect(seed){this.engine=createEngine({mode:'duel',seed});this.hand=this.engine.generateCards();this.redraws=2;this.lastTurn=0;this.isDuelActive=true;this.isConnected=true;this.emit();return true;}
    emit(){if(this.engine)this.callbacks.onOpponentUpdate({score:this.engine.score,turn:this.engine.turn,isGameOver:this.engine.isGameOver,isVictory:this.engine.isVictory,name:'La Sage'});}
    updateMyScore(score,turn){if(!this.isDuelActive||!this.engine||turn<=this.lastTurn)return;this.lastTurn=turn;if(!this.engine.isGameOver){const r=playSageTurn(this.engine,this.hand,this.redraws);this.hand=r.hand;this.redraws=r.redrawsLeft;}this.emit();}
    getState(){return this.engine?{engine:JSON.parse(JSON.stringify(this.engine)),hand:this.hand,redraws:this.redraws,lastTurn:this.lastTurn}:null;}
    restore(state){if(!state?.engine)return;this.engine=restoreEngine(state.engine);this.hand=state.hand;this.redraws=state.redraws??2;this.lastTurn=state.lastTurn||0;this.isDuelActive=true;this.isConnected=true;this.emit();}
    disconnect(){this.isConnected=false;this.isDuelActive=false;}
}
