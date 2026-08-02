import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import TWEEN from 'three/addons/libs/tween.module.js';
import { TableController } from './table-controller.js';
import { CardController } from './card-controller.js';
import { VFXController } from './vfx-controller.js';

export class SceneManager {
    // Reference de cadrage : distance camera -> point de vise en position de jeu.
    static BASE_DIST = 7.74;
    static BASE_OFFSET = { y: 4.2, z: 6.5 };
    static MIN_FOV = 45;   // cadrage d'origine, conserve sur desktop
    static MAX_FOV = 58;   // au-dela la perspective se deforme

    constructor(container, callbacks) {
        this.container = container;
        this.callbacks = callbacks;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        // Sur mobile l'antialiasing MSAA coute cher pour un gain quasi nul a
        // pixelRatio 1.5 : on l'active uniquement sur les grands ecrans.
        this.isSmallScreen = Math.min(window.innerWidth, window.innerHeight) < 820
            || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
        this.renderer = new THREE.WebGLRenderer({
            antialias: !this.isSmallScreen,
            alpha: true,
            powerPreference: 'high-performance',
            stencil: false
        });
        this.loader = new GLTFLoader();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.clock = new THREE.Clock();
        this.assetsLoaded = false;
        
        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isSmallScreen ? 1.25 : 1.5));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        // ACES rend l'or et les emissifs bien plus riches que Reinhard, a cout identique.
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        
        // Performance: Sort objects for better depth testing
        this.renderer.sortObjects = true;
        
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.set(0, 10, 15);
        this.camera.lookAt(0, 0, 0);

        this.loadAssets();

        // Le rendu et l'horloge sont suspendus quand l'onglet passe en arriere-plan :
        // evite de bruler la batterie et empeche TWEEN d'accumuler un delta enorme.
        this.isPaused = false;
        document.addEventListener('visibilitychange', () => {
            this.isPaused = document.hidden;
            if (!this.isPaused) this.clock.getDelta();
        });

        window.addEventListener('resize', () => this.onResize(), { passive: true });
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.onResize(), 100);
        });
    }

    loadAssets() {
        this.loadingManager = new THREE.LoadingManager();
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        
        const loadingBar = document.getElementById('loading-bar');
        const loadingHint = document.getElementById('loading-hint');
        const loadingScreen = document.getElementById('loading-screen');

        const hints = [
            "Harmonisation des Piliers...",
            "Sculpture du Destin...",
            "Éveil de la Conscience...",
            "Gravure des Souvenirs...",
            "Préparation du Sanctuaire..."
        ];

        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            if (loadingBar) loadingBar.style.width = `${progress}%`;
            if (loadingHint && Math.random() > 0.8) {
                loadingHint.textContent = hints[Math.floor(Math.random() * hints.length)];
            }
        };
        
        this.textures = {
            wood: this.textureLoader.load('assets/noble-wood-texture.webp'),
            border: this.textureLoader.load('assets/gold-engraved-border.webp'),
            cardBack: this.textureLoader.load('assets/card-back-texture-v2.webp'),
            illustrations: {
                spirituality: this.textureLoader.load('assets/spirituality_art.webp'),
                love: this.textureLoader.load('assets/love_art.webp'),
                health: this.textureLoader.load('assets/health_art.webp'),
                money: this.textureLoader.load('assets/money_art.webp'),
                harmony: this.textureLoader.load('assets/harmony_art.webp'),
                event_eclipse: this.textureLoader.load('assets/event_eclipse_art.webp'),
                event_festival: this.textureLoader.load('assets/event_festival_art.webp'),
                event_gold_rush: this.textureLoader.load('assets/event_gold_rush_art.webp'),
                event_spring: this.textureLoader.load('assets/event_spring_art.webp'),
                legendary_spirit: this.textureLoader.load('assets/legendary_spirit_art.webp'),
                legendary_love: this.textureLoader.load('assets/legendary_love_art.webp'),
                legendary_wealth: this.textureLoader.load('assets/legendary_wealth_art.webp'),
                legendary_life: this.textureLoader.load('assets/legendary_life_art.webp')
            },
            // Minimalist gold pillar icons (line-art, transparent) for the card header
            pillarIcons: {
                spirituality: this.textureLoader.load('assets/icon-pillar-spirituality-minimal.webp'),
                love: this.textureLoader.load('assets/icon-pillar-love-minimal.webp'),
                health: this.textureLoader.load('assets/icon-pillar-health-minimal.webp'),
                money: this.textureLoader.load('assets/icon-pillar-money-minimal.webp')
            }
        };

        // Seul le bois etait marque sRGB : la bordure doree, le dos de carte et
        // toutes les illustrations etaient interpretees en lineaire, donc rendues
        // ternes et desaturees. On normalise l'ensemble.
        const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
        const aniso = Math.min(this.isSmallScreen ? 4 : 8, maxAniso);
        const tuneColor = (tex) => {
            if (!tex) return;
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = aniso;
            tex.generateMipmaps = true;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
        };
        tuneColor(this.textures.wood);
        tuneColor(this.textures.border);
        tuneColor(this.textures.cardBack);
        Object.values(this.textures.illustrations || {}).forEach(tuneColor);
        Object.values(this.textures.icons || {}).forEach(tuneColor);

        this.textures.wood.wrapS = this.textures.wood.wrapT = THREE.RepeatWrapping;
        this.textures.wood.repeat.set(2, 2);
        if (this.textures.border) {
            this.textures.border.wrapS = this.textures.border.wrapT = THREE.RepeatWrapping;
        }
        
        this.loadingManager.onLoad = () => {
            this.assetsLoaded = true;
            this.table = new TableController(this.scene, this.loader, this.textures);
            this.cardController = new CardController(this.scene, this.textures);
            this.vfx = new VFXController(this.scene, this.camera);
            this.cardController.vfx = this.vfx; // Wire VFX to CardController
            // Keep in sync with the intro's final play position so the card row
            // stays centered after camera resets.
            // Calcule fov + distance avant tout affichage de cartes.
            this.applyPlayFraming();

            // Re-apply light mode now that table/lights exist
            if (this.pendingLightMode !== undefined) {
                this.setLightMode(this.pendingLightMode);
            }

            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => loadingScreen.remove(), 1000);
            }
        };
    }

    onCardSelected(isNarrative) {
        if (!this.vfx || !this.defaultCameraPos) return;

        // Gentle push-in from the play position toward the selected card.
        const targetPos = isNarrative ? 
            { x: 0, y: 3.9, z: 7.2 } : 
            { x: 0, y: 4.0, z: 7.6 };

        new TWEEN.Tween(this.camera.position)
            .to(targetPos, 450)
            .easing(TWEEN.Easing.Cubic.Out)
            .start();
    }

    resetCamera() {
        if (!this.defaultCameraPos) return;
        new TWEEN.Tween(this.camera.position)
            .to({ x: this.defaultCameraPos.x, y: this.defaultCameraPos.y, z: this.defaultCameraPos.z }, 450)
            .easing(TWEEN.Easing.Cubic.Out)
            .start();
    }

    playIntro(callback) {
        if (!this.vfx) {
            setTimeout(() => this.playIntro(callback), 100);
            return;
        }
        this.vfx.playCameraIntro(callback);
    }

    updatePillars(pillars, variance, reachedHarmony = false, cardPlayed = null) {
        if (!this.table) return;
        const tilt = this.table.update(pillars, variance);
        this.callbacks.onBalanceTilt(tilt);
        
        if (this.vfx) {
            this.vfx.triggerHarmonyEffect(reachedHarmony || variance < 40);
            
            // Pillar specific pulse if a card was just played
            if (cardPlayed && cardPlayed.effects) {
                for (const cat in cardPlayed.effects) {
                    if (cardPlayed.effects[cat] !== 0) {
                        this.vfx.triggerPillarPulse(cat, cardPlayed.effects[cat]);
                    }
                }
            }

            // Une carte a convergence n'a aucun effet chiffre : sans ca, elle
            // se jouerait sans le moindre retour visuel sur les piliers.
            if (cardPlayed && cardPlayed.convergence) {
                for (const cat in pillars) {
                    this.vfx.triggerPillarPulse(cat, cardPlayed.convergence.bonus || 1);
                }
            }

            // Critical hit effect
            const values = Object.values(pillars);
            if (values.some(v => v < 15 || v > 85)) {
                this.vfx.shakeCamera(0.05, 400);
            }
        }
    }

    updateHeritage(totalLegacy) {
        if (this.table) {
            this.table.evolveHeritage(totalLegacy);
        } else {
            // Retry once table is loaded
            setTimeout(() => this.updateHeritage(totalLegacy), 100);
        }
    }

    createCardMeshes(cardData) {
        if (!this.cardController || !this.table) {
            setTimeout(() => this.createCardMeshes(cardData), 100);
            return;
        }

        // Safety net: if cards are dealt without a preceding camera intro
        // (e.g. "Continue", or restart after game over), make sure the camera
        // is positioned and oriented to frame the card row. Otherwise the
        // camera keeps its initial lookAt(0,0,0) and the cards fall off-screen.
        if (this.vfx && !this.vfx.lookTarget) {
            this.ensurePlayCamera();
        }

        const slots = [
            this.table.getCardSlot(0),
            this.table.getCardSlot(1),
            this.table.getCardSlot(2)
        ];
        
        this.cardController.createCards(cardData, slots);
    }

    /**
     * Places the camera at the standard play position and locks a stable look
     * target on the card row. Used as a fallback whenever cards are shown
     * without the cinematic intro having run.
     */
    ensurePlayCamera() {
        if (!this.defaultCameraPos) return;
        this.camera.position.copy(this.defaultCameraPos);
        const look = VFXController.PLAY_LOOK;
        if (this.vfx) {
            this.vfx.lookTarget = new THREE.Vector3(look.x, look.y, look.z);
        }
        this.camera.lookAt(look.x, look.y, look.z);
    }

    updateCardsLocalization(translationCallback) {
        if (!this.cardController) return;
        this.cardController.cards.forEach(mesh => {
            const data = mesh.userData.data;
            if (data) {
                data.title = translationCallback(data.title);
                data.desc = translationCallback(data.desc);
                this.cardController.updateCardTexture(mesh);
            }
        });
    }

    get cards() {
        return this.cardController ? this.cardController.cards : [];
    }

    /**
     * Cale l'optique sur la rangee de cartes.
     *
     * L'ancien cadrage etait fige (fov 45, camera a 7,74 du point de vise).
     * Sur un telephone 9:19,5 la demi-largeur visible tombait a 1,48 alors que
     * la rangee en demande ~2,0 : les cartes laterales sortaient du cadre.
     * On elargit d'abord le champ, et seulement si ca ne suffit pas on recule
     * la camera — pour ne pas ecraser la table en perspective.
     */
    applyPlayFraming(animate = false) {
        const aspect = window.innerWidth / window.innerHeight;
        const besoin = CardController.halfWidthFor(aspect);

        const look = VFXController.PLAY_LOOK;
        let dist = SceneManager.BASE_DIST;
        let fov = THREE.MathUtils.radToDeg(Math.atan(besoin / (dist * aspect)) * 2);

        if (fov > SceneManager.MAX_FOV) {
            fov = SceneManager.MAX_FOV;
            dist = besoin / (Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect);
        }
        fov = Math.max(SceneManager.MIN_FOV, fov);

        this.camera.fov = fov;
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();

        // Position sur le meme axe de vise, a la distance calculee.
        const ratio = dist / SceneManager.BASE_DIST;
        const pos = VFXController.PLAY_POS;
        pos.y = look.y + SceneManager.BASE_OFFSET.y * ratio;
        pos.z = look.z + SceneManager.BASE_OFFSET.z * ratio;

        if (!this.defaultCameraPos) {
            this.defaultCameraPos = new THREE.Vector3(pos.x, pos.y, pos.z);
        } else {
            this.defaultCameraPos.set(pos.x, pos.y, pos.z);
        }

        if (animate && this.vfx && this.vfx.lookTarget) {
            this.camera.position.copy(this.defaultCameraPos);
            this.camera.lookAt(look.x, look.y, look.z);
        }
    }

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.applyPlayFraming(true);
        // La rangee de cartes se recompacte avec le nouveau ratio.
        if (this.cardController && this.cardController.cards.length) {
            this.cardController.relayout();
        }
        if (this.table) this.table.relayoutSlots();
    }

    setLightMode(enabled) {
        this.pendingLightMode = enabled;
        if (!this.renderer) return;
        this.renderer.setClearColor(enabled ? 0xffffff : 0x000000, enabled ? 0.3 : 0);
        
        // Adjust scene lighting for high-key environment
        this.scene.traverse(obj => {
            if (obj instanceof THREE.AmbientLight) {
                // If it's the heritage/harmony light, keep it separate
                if (obj === (this.table ? this.table.harmonyLight : null)) return;
                // 0.15 = valeur d'origine de la scene. L'ancien 0.8 delavait
                // le sanctuaire des qu'on avait touche une fois au mode clair.
                obj.intensity = enabled ? 1.8 : 0.15;
            }
            if (obj instanceof THREE.HemisphereLight) {
                obj.intensity = enabled ? 1.2 : 0.55;
            }
            if (obj instanceof THREE.DirectionalLight) {
                obj.intensity = enabled ? 2.8 : 0.2;
            }
            if (obj instanceof THREE.SpotLight) {
                obj.intensity = enabled ? 12 : 15; // Lower slightly to avoid burnout on white
            }
        });

        if (this.scene.fog) {
            this.scene.fog.color.set(enabled ? 0xffffff : 0x020205);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.isPaused) return;
        const elapsed = this.clock.getElapsedTime();
        TWEEN.update();
        if (this.table) this.table.animate(elapsed);
        if (this.cardController) this.cardController.update(elapsed);
        if (this.vfx) this.vfx.update(elapsed);
        this.renderer.render(this.scene, this.camera);
    }
}
