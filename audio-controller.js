import * as THREE from 'three';
import TWEEN from 'three/addons/libs/tween.module.js';

export class AudioController {
    constructor(initialSettings = {}) {
        this.settings = {
            master: initialSettings.master ?? 0.8,
            music: initialSettings.music ?? 0.5,
            sfx: initialSettings.sfx ?? 0.6,
            voice: initialSettings.voice ?? 0.5
        };
        
        this.nodes = {
            bgm: document.getElementById('bgm'),
            bgmMenu: document.getElementById('bgm-menu'),
            bgmReflection: document.getElementById('bgm-reflection'),
            defeatAmbient: document.getElementById('defeat-ambient'),
            signature: document.getElementById('sonic-signature')
        };
    }

    setVolume(type, value) {
        const clampedValue = Math.max(0, Math.min(1, value));
        this.settings[type] = clampedValue;
        this.refreshActiveVolumes();
    }

    refreshActiveVolumes(isCardSelected = false, turn = 0) {
        const master = this.settings.master;
        const musicVol = this.settings.music * master;
        const fadeMultiplier = isCardSelected ? 0.3 : 1.0;

        if (this.nodes.bgm && !this.nodes.bgm.paused) {
            this.nodes.bgm.volume = Math.max(0, Math.min(1, 0.15 * musicVol * fadeMultiplier));
        }
        if (this.nodes.bgmMenu && !this.nodes.bgmMenu.paused) {
            this.nodes.bgmMenu.volume = Math.max(0, Math.min(1, 0.2 * musicVol));
        }
        if (this.nodes.bgmReflection && !this.nodes.bgmReflection.paused) {
            const currentMax = Math.min(0.08, (turn / 15) * 0.08);
            this.nodes.bgmReflection.volume = Math.max(0, Math.min(1, currentMax * musicVol * fadeMultiplier));
        }
        if (this.nodes.defeatAmbient && !this.nodes.defeatAmbient.paused) {
            this.nodes.defeatAmbient.volume = Math.max(0, Math.min(1, 0.15 * musicVol));
        }
    }

    playSignature() {
        if (this.nodes.signature) {
            this.nodes.signature.volume = Math.max(0, Math.min(1, 0.4 * this.settings.sfx * this.settings.master));
            this.nodes.signature.currentTime = 0;
            this.nodes.signature.play().catch(() => {});
        }
    }

    startMenuMusic() {
        if (this.nodes.bgmMenu && this.nodes.bgmMenu.paused) {
            this.nodes.bgmMenu.volume = 0;
            this.nodes.bgmMenu.play().catch(() => {});
            new TWEEN.Tween(this.nodes.bgmMenu)
                .to({ volume: 0.2 * this.settings.music * this.settings.master }, 2000)
                .start();
        }
    }

    stopMenuMusic(duration = 2000) {
        if (this.nodes.bgmMenu && !this.nodes.bgmMenu.paused) {
            new TWEEN.Tween(this.nodes.bgmMenu)
                .to({ volume: 0 }, duration)
                .onComplete(() => this.nodes.bgmMenu.pause())
                .start();
        }
    }

    startBGM(isMeditation = false) {
        this.stopMenuMusic(1500);

        if (isMeditation) {
            // In meditation mode, we keep the zen menu music but maybe fade it to a different volume
            // and add layers.
            if (this.nodes.bgmMenu && this.nodes.bgmMenu.paused) {
                this.nodes.bgmMenu.volume = 0;
                this.nodes.bgmMenu.play().catch(() => {});
            }
            new TWEEN.Tween(this.nodes.bgmMenu)
                .to({ volume: 0.3 * this.settings.music * this.settings.master }, 3000)
                .start();
        } else {
            if (this.nodes.bgm && this.nodes.bgm.paused) {
                this.nodes.bgm.volume = 0;
                this.nodes.bgm.play().catch(() => {});
                new TWEEN.Tween(this.nodes.bgm)
                    .to({ volume: 0.15 * this.settings.music * this.settings.master }, 3000)
                    .start();
            }
        }

        if (this.nodes.bgmReflection && this.nodes.bgmReflection.paused) {
            this.nodes.bgmReflection.volume = 0;
            this.nodes.bgmReflection.play().catch(() => {});
        }
    }

    playSFX(id, volume = 0.5) {
        const node = document.getElementById(id);
        if (node) {
            const targetVol = Math.max(0, Math.min(1, volume * this.settings.sfx * this.settings.master));
            // Clone for overlapping sounds
            const clone = node.cloneNode();
            clone.volume = targetVol;
            clone.play().catch(() => {});
            return true;
        }
        return false;
    }

    transitionToDefeat() {
        this.fadeBGM(0, 2000);
        if (this.nodes.defeatAmbient) {
            this.nodes.defeatAmbient.volume = 0;
            this.nodes.defeatAmbient.play().catch(() => {});
            new TWEEN.Tween(this.nodes.defeatAmbient)
                .to({ volume: 0.15 * this.settings.music * this.settings.master }, 4000)
                .start();
        }
    }

    stopDefeatAmbient() {
        if (this.nodes.defeatAmbient) {
            new TWEEN.Tween(this.nodes.defeatAmbient)
                .to({ volume: 0 }, 1000)
                .onComplete(() => this.nodes.defeatAmbient.pause())
                .start();
        }
    }

    /**
     * Silence immediat de toutes les musiques pendant un enonce vocal.
     * fadeBGM ne traitait que deux pistes sur cinq, et son fondu de 220 ms
     * laissait le son couvrir le debut de la phrase. Sur iOS, un canal occupe
     * empeche purement et simplement la synthese de demarrer.
     */
    couperPourVoix() {
        if (this._voixCoupe) return;
        this._voixCoupe = {};
        for (const nom of ['bgm', 'bgmReflection', 'bgmMenu', 'defeatAmbient', 'signature']) {
            const n = this.nodes[nom];
            if (!n || n.paused) continue;
            this._voixCoupe[nom] = n.volume;
            n.volume = 0;              // sans fondu : la voix part aussitot
        }
    }

    /** Retour de la musique, en fondu doux, une fois l'enonce termine. */
    retablirApresVoix(turn = 0) {
        const memoire = this._voixCoupe;
        if (!memoire) return;
        this._voixCoupe = null;
        clearInterval(this._retourVoix);

        // Fondu autonome, sans TWEEN : celui-ci depend de la boucle de rendu,
        // qui s'arrete quand l'onglet passe en arriere-plan. La musique
        // serait alors restee muette pour toujours.
        const debut = Date.now(), duree = 700;
        this._retourVoix = setInterval(() => {
            const t = Math.min(1, (Date.now() - debut) / duree);
            for (const nom in memoire) {
                const n = this.nodes[nom];
                if (n) n.volume = memoire[nom] * t;
            }
            if (t >= 1) clearInterval(this._retourVoix);
        }, 40);
    }

    fadeBGM(targetFactor, duration = 1000, turn = 0) {
        if (this.nodes.bgm) {
            const target = 0.15 * this.settings.music * targetFactor;
            new TWEEN.Tween(this.nodes.bgm)
                .to({ volume: Math.max(0, Math.min(1, target)) }, duration)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();
        }
        if (this.nodes.bgmReflection) {
            const currentMax = Math.min(0.08, (turn / 15) * 0.08);
            const target = currentMax * this.settings.music * targetFactor;
            new TWEEN.Tween(this.nodes.bgmReflection)
                .to({ volume: Math.max(0, Math.min(1, target)) }, duration)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .start();
        }
    }
}
