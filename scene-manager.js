import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import TWEEN from 'three/addons/libs/tween.module.js';
import { TableController } from './table-controller.js';
import { CardController } from './card-controller.js';
import { VFXController } from './vfx-controller.js';

export class SceneManager {
    // --- Cadrage de la rangee de cartes ---
    // Ces constantes RECOPIENT la geometrie definie par CardController et
    // TableController. Elles ne la modifient pas : la taille et l'ecartement
    // des cartes restent exactement ceux du jeu. Seule l'optique s'adapte.
    static CARD_W = CardController.CARD_W;   // suit la carte (1.42)
    static SLOT_X = 2.15;     // cardSlots de TableController
    static BASE_DIST = 7.74;  // distance camera -> point de vise en jeu
    static BASE_OFFSET = { y: 4.2, z: 6.5 };
    static MIN_FOV = 45;      // cadrage d'origine, conserve sur desktop
    static MIN_FOV_COURT = 30; // ecran bas (telephone couche) : on resserre
    static MAX_FOV = 58;      // au-dela la perspective se deforme
    static PART_HAUTEUR = 0.78;        // part maximale de la hauteur d'une carte
    // Sur ecran bas, la rangee occupait 83 % de la hauteur : il ne restait
    // aucune bande pour le bandeau superieur, qui se posait sur les cartes.
    static PART_HAUTEUR_COURT = 0.66;
    // Rapprochement a la selection, en fraction de la distance au point de vise.
    static APPROCHE = 0.96;
    static APPROCHE_NARRATIVE = 0.94;
    // Composition visee : le bas de la rangee se pose sur cette fraction de la
    // hauteur d'ecran, et son haut ne remonte jamais au-dessus de la seconde.
    // Une descente exprimee en fraction fixe de la hauteur visible faisait
    // sortir les cartes par le bas en paysage et sur grand ecran.
    static BAS_CIBLE = 0.87;
    static HAUT_MINI = 0.10;
    static HAUT_MINI_COURT = 0.22;     // laisse place au bandeau en paysage
    static BASE_LOOK_Y = 0.4;
    // Avancee de la rangee vers le joueur (voir TableController.cardSlots).
    static AVANCEE = 1.2;

    /**
     * Ecartement de base entre deux cartes pour une main de n cartes.
     * A 3 cartes on retombe exactement sur SLOT_X : la disposition habituelle
     * n'est pas modifiee d'un iota. Au-dela, l'ecartement est plancherise pour
     * que deux cartes ne se recouvrent jamais, une fois la compression
     * responsive de CardController appliquee.
     */
    static ecartementBase(n, aspect) {
        if (n <= 1) return 0;
        const portrait = aspect < 0.85;
        const spread = portrait ? 0.68 : 1.0;
        const scale = portrait ? 0.92 : 1.0;
        const regulier = (2 * SceneManager.SLOT_X) / (n - 1);
        const minimum = (SceneManager.CARD_W * scale * 1.12) / spread;
        return Math.max(regulier, minimum);
    }

    /** Rangee centree de n emplacements, dans le repere de TableController. */
    static slotsPour(n, table) {
        const aspect = window.innerWidth / window.innerHeight;
        // Relevage : la carte, plus haute et posee au meme angle, s'enfoncerait
        // dans le tapis. On remonte la rangee sans toucher a TableController.
        const lift = CardController.LIFT_Y;
        if (n === 3) {
            return [0, 1, 2].map(i => {
                const v = table.getCardSlot(i).clone();
                v.y += lift;
                return v;
            });
        }
        const ref = table.getCardSlot(1);            // emplacement central
        const pas = SceneManager.ecartementBase(n, aspect);
        const slots = [];
        for (let i = 0; i < n; i++) {
            const x = (i - (n - 1) / 2) * pas;
            slots.push(new THREE.Vector3(x, ref.y + lift, ref.z));
        }
        return slots;
    }

    /** Demi-largeur reellement occupee par la rangee, marge comprise. */
    static halfWidthNeeded(aspect, n = 3) {
        const portrait = aspect < 0.85;          // meme regle que CardController
        const spread = portrait ? 0.68 : 1.0;
        const scale = portrait ? 0.92 : 1.0;
        const demiRangee = n <= 1
            ? 0
            : (SceneManager.ecartementBase(n, aspect) * (n - 1)) / 2;
        // Marge ramenee de 0.20 a 0.12 : elle coutait 5 % de taille de carte a
        // l'ecran pour une securite dont la mesure montre qu'elle etait excessive.
        return demiRangee * spread + (SceneManager.CARD_W * scale) / 2 + 0.12;
    }

    constructor(container, callbacks) {
        this.container = container;
        this.callbacks = callbacks;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.loader = new GLTFLoader();

        // Le LoadingManager ne suit que les textures. Les 2 modeles GLB
        // (table + rochers, ~1,6 Mo) etaient charges hors de son controle :
        // l'ecran de chargement disparaissait avant que la table existe.
        // On instrumente le chargeur pour les compter, sans toucher
        // TableController qui l'utilise tel quel.
        this._modelesEnCours = 0;
        this._modelesTermines = null;
        const chargerBrut = this.loader.load.bind(this.loader);
        this.loader.load = (url, onOk, onProgress, onErr) => {
            this._modelesEnCours++;
            const fini = () => {
                if (--this._modelesEnCours === 0 && this._modelesTermines) {
                    const cb = this._modelesTermines;
                    this._modelesTermines = null;
                    cb();
                }
            };
            chargerBrut(url,
                (gltf) => { try { onOk && onOk(gltf); } finally { fini(); } },
                onProgress,
                (err) => { console.warn('Modele 3D non charge :', url, err); if (onErr) onErr(err); fini(); }
            );
        };
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.clock = new THREE.Clock();
        this.assetsLoaded = false;
        
        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Capped for performance
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap; 
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.setClearColor(0x020205, 1); // Immediate background to avoid black screens
        
        // Performance: Sort objects for better depth testing
        this.renderer.sortObjects = true;
        this.scene.background = new THREE.Color(0x020205);
        
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.set(0, 10, 15);
        this.camera.lookAt(0, 0, 0);

        this.loadAssets();

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

        // Sans ce gestionnaire, un asset manquant echouait en silence : rien
        // n'indiquait quel fichier ne repondait pas.
        this.erreursChargement = [];
        this.loadingManager.onError = (url) => {
            this.erreursChargement.push(url);
            console.error('Asset non charge :', url);
        };

        // Trace de l'avancement : sans elle, un chargement bloque ne disait
        // pas s'il avait echoue d'emblee ou cale en cours de route.
        this.progression = { charges: 0, total: 0, enAttente: new Set() };
        this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
            this.progression.total = itemsTotal;
        };

        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            this.progression.charges = itemsLoaded;
            this.progression.total = itemsTotal;
            const progress = (itemsLoaded / itemsTotal) * 100;
            if (loadingBar) loadingBar.style.width = `${progress}%`;
            if (loadingHint && Math.random() > 0.8) {
                loadingHint.textContent = hints[Math.floor(Math.random() * hints.length)];
            }
        };
        
        // Le gestionnaire DOIT etre installe avant le premier chargement.
        // Il etait pose apres la creation des textures : servies par le cache
        // du service worker, elles se resolvaient parfois avant que onLoad ne
        // soit branche, et l'evenement ne se declenchait jamais. L'ecran de
        // chargement restait alors fige, sans la moindre erreur a signaler.
        this.loadingManager.onLoad = () => {
          try {
            this.assetsLoaded = true;
            this.table = new TableController(this.scene, this.loader, this.textures);
            this.cardController = new CardController(this.scene, this.textures);
            this.vfx = new VFXController(this.scene, this.camera);
            this.cardController.vfx = this.vfx; // Wire VFX to CardController
            // Keep in sync with the intro's final play position so the card row
            // stays centered after camera resets.
            // Calcule fov + distance avant tout affichage de cartes.
            this.applyPlayFraming();
            const pp = VFXController.PLAY_POS;
            this.defaultCameraPos = new THREE.Vector3(pp.x, pp.y, pp.z);

            // Re-apply light mode now that table/lights exist
            if (this.pendingLightMode !== undefined) {
                this.setLightMode(this.pendingLightMode);
            }

            // Les textures sont pretes, mais TableController vient seulement
            // de lancer le chargement des 2 modeles GLB. On attend qu'ils
            // soient poses avant de decouvrir la scene, sinon le joueur voit
            // une table vide. Filet de securite a 10 s si un modele ne
            // repond jamais.
            const masquerChargement = () => {
                if (this._chargementMasque) return;
                this._chargementMasque = true;
                if (this.erreursChargement.length) {
                    console.warn(`${this.erreursChargement.length} asset(s) non charge(s) :`, this.erreursChargement);
                }
                this.sceneReady = true;
                if (loadingScreen) {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => loadingScreen.remove(), 1000);
                }
            };

            if (this._modelesEnCours > 0) {
                this._modelesTermines = masquerChargement;
                setTimeout(masquerChargement, 10000);
            } else {
                masquerChargement();
            }
          } catch (err) {
            // Une exception ici laissait l'ecran de chargement fige pour
            // toujours, sans le moindre indice. On la montre, et on decouvre la
            // scene malgre tout : mieux vaut un jeu incomplet qu'un ecran mort.
            console.error('Erreur pendant la mise en place de la scene :', err);
            const hint = document.getElementById('loading-hint');
            if (hint) {
                hint.style.opacity = '1';
                hint.style.color = '#e74c3c';
                hint.textContent = `Erreur : ${err && err.message ? err.message : err}`;
            }
            this.sceneReady = true;
            if (loadingScreen) {
                setTimeout(() => {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => loadingScreen.remove(), 800);
                }, 4000);
            }
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

        this.textures.wood.colorSpace = THREE.SRGBColorSpace;
        // La bordure doree de la table etait interpretee en lineaire, donc
        // rendue terne. Les textures de carte (cardBack, illustrations) sont
        // volontairement laissees telles quelles.
        if (this.textures.border) this.textures.border.colorSpace = THREE.SRGBColorSpace;
        this.textures.wood.wrapS = this.textures.wood.wrapT = THREE.RepeatWrapping;
        this.textures.wood.repeat.set(2, 2);
        
    }

    onCardSelected(isNarrative) {
        if (!this.vfx || !this.defaultCameraPos) return;

        // Le rapprochement etait code en dur (z: 7.6) et ignorait le cadrage
        // adaptatif. Sur telephone la camera partait de z 9.8 et sautait a 7.6,
        // soit un zoom de 25 % : les deux cartes laterales sortaient du cadre.
        // Il est desormais exprime en fraction de la distance au point de vise,
        // et la reserve prise dans applyPlayFraming garantit que la rangee
        // reste entiere.
        const look = VFXController.PLAY_LOOK;
        const f = isNarrative ? SceneManager.APPROCHE_NARRATIVE : SceneManager.APPROCHE;
        const targetPos = {
            x: this.defaultCameraPos.x,
            y: look.y + (this.defaultCameraPos.y - look.y) * f,
            z: look.z + (this.defaultCameraPos.z - look.z) * f
        };

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
            // Sans borne, un echec de chargement empechait a jamais le callback
            // de partir : la partie ne demarrait pas et rien ne l'indiquait.
            if ((this._essaisIntro = (this._essaisIntro || 0) + 1) > 100) {
                console.error('VFX indisponible : intro ignoree, la partie demarre quand meme.');
                if (callback) callback();
                return;
            }
            setTimeout(() => this.playIntro(callback), 100);
            return;
        }
        this.vfx.playCameraIntro(callback);
    }

    updatePillars(pillars, variance, reachedHarmony = false, cardPlayed = null, triggeredAbilities = []) {
        // main.js appelle cette methode pendant init(), avant que les textures
        // soient pretes : la table n'existe pas encore et l'appel etait perdu.
        // Sur un "Continuer", les piliers 3D restaient donc a leur valeur par
        // defaut jusqu'a la carte suivante. Meme filet que updateHeritage().
        if (!this.table) {
            if ((this._essaisPiliers = (this._essaisPiliers || 0) + 1) > 80) {   // ~10 s
                console.error('Table indisponible : piliers 3D non mis a jour.');
                return;
            }
            setTimeout(() => this.updatePillars(pillars, variance, reachedHarmony, cardPlayed, triggeredAbilities), 120);
            return;
        }
        const tilt = this.table.update(pillars, variance);
        this.callbacks.onBalanceTilt(tilt);
        
        if (this.vfx) {
            this.vfx.triggerHarmonyEffect(reachedHarmony || variance < 40);
            
            // Ability triggers VFX
            triggeredAbilities.forEach(id => {
                this.vfx.triggerAbilityVFX(id);
            });

            // Pillar specific pulse if a card was just played
            if (cardPlayed && cardPlayed.effects) {
                for (const cat in cardPlayed.effects) {
                    if (cardPlayed.effects[cat] !== 0) {
                        this.vfx.triggerPillarPulse(cat, cardPlayed.effects[cat]);
                    }
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
            if ((this._essaisHeritage = (this._essaisHeritage || 0) + 1) > 100) {
                console.error('Table indisponible : heritage non applique.');
                return;
            }
            setTimeout(() => this.updateHeritage(totalLegacy), 100);
        }
    }

    createCardMeshes(cardData, essai = 0) {
        if (!this.cardController || !this.table) {
            // Reessai borne : sans limite, un echec de chargement faisait
            // tourner ce minuteur indefiniment, table vide et sans diagnostic.
            if (essai >= 100) {          // 10 s
                console.error('Scene indisponible : cartes non distribuees.');
                return;
            }
            setTimeout(() => this.createCardMeshes(cardData, essai + 1), 100);
            return;
        }

        // Safety net: if cards are dealt without a preceding camera intro
        // (e.g. "Continue", or restart after game over), make sure the camera
        // is positioned and oriented to frame the card row. Otherwise the
        // camera keeps its initial lookAt(0,0,0) and the cards fall off-screen.
        if (this.vfx && !this.vfx.lookTarget) {
            this.ensurePlayCamera();
        }

        // Seuls 3 emplacements etaient construits. Avec "Choix supplementaire"
        // une 4e carte est distribuee : slots[3] valait undefined, et
        // CardController repliait sur Vector3(0,0,0) -- la carte atterrissait a
        // l'origine du monde, enfouie sous la table, invisible et injouable.
        // On construit donc la rangee pour le nombre reel de cartes.
        const slots = SceneManager.slotsPour(cardData.length, this.table);

        // Le champ de la camera doit couvrir une rangee plus large ce tour-la.
        this.applyPlayFraming(cardData.length);

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
     * Cale l'optique sur la rangee de cartes, SANS toucher aux cartes.
     *
     * Le cadrage etait fige (fov 45, camera a 7,74 du point de vise). Sur un
     * telephone 9:19.5 la demi-largeur visible tombait a 1,48 alors que la
     * rangee en occupe ~2,17 : les cartes laterales sortaient du cadre.
     * On elargit d'abord le champ, et seulement si ca ne suffit pas on recule
     * la camera. Taille et ecartement des cartes restent inchanges.
     */
    applyPlayFraming(nbCartes = this._nbCartes || 3) {
        this._nbCartes = nbCartes;
        const aspect = window.innerWidth / window.innerHeight;
        // La rangee doit tenir y compris pendant le rapprochement declenche par
        // une selection : sans cette reserve, la camera avancait dans un cadre
        // deja juste et rognait les cartes laterales.
        const besoin = SceneManager.halfWidthNeeded(aspect, nbCartes)
                     / SceneManager.APPROCHE_NARRATIVE;
        const look = VFXController.PLAY_LOOK;

        // La rangee n'est plus au point de vise mais AVANCEE unites devant :
        // c'est a cette distance-la que la largeur doit tenir.
        let dist = SceneManager.BASE_DIST;
        let fov = THREE.MathUtils.radToDeg(
            Math.atan(besoin / ((dist - SceneManager.AVANCEE) * aspect)) * 2);
        if (fov > SceneManager.MAX_FOV) {
            fov = SceneManager.MAX_FOV;
            dist = besoin / (Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect)
                 + SceneManager.AVANCEE;
        }

        // Telephone couche : l'ecran est tres large mais tres bas. Le plancher
        // de 45° laissait la rangee n'occuper que 43 % de la largeur visible,
        // et les cartes retombaient a 91 px. Sur ecran bas on autorise un champ
        // plus serre. Meme seuil que la regle CSS paysage (max-height: 500px).
        const ecranBas = window.innerHeight < 500;
        fov = Math.max(ecranBas ? SceneManager.MIN_FOV_COURT : SceneManager.MIN_FOV, fov);

        // Garde verticale : une carte ne doit jamais depasser 78 % de la
        // hauteur visible, sinon elle sort du cadre par le haut ou le bas.
        // La rangee est AVANCEE unites devant le point de vise : c'est a cette
        // distance-la qu'il faut mesurer sa taille apparente. Mesuree depuis le
        // point de vise, la carte paraissait plus petite qu'en realite et la
        // garde ne se declenchait jamais.
        // La carte est inclinee : son bord bas est bien plus proche de l'oeil
        // que son bord haut. Un simple rapport hauteur / hauteur visible
        // sous-estimait donc largement son emprise reelle. On mesure la
        // projection et on elargit le champ jusqu'a ce qu'elle rentre.
        const part = ecranBas ? SceneManager.PART_HAUTEUR_COURT : SceneManager.PART_HAUTEUR;
        for (let i = 0; i < 5; i++) {
            const emprise = this.empriseRangee(fov, dist);
            if (emprise === null || emprise <= part) break;
            const t = Math.tan(THREE.MathUtils.degToRad(fov / 2)) * (emprise / part);
            const nouveau = Math.min(SceneManager.MAX_FOV,
                                     THREE.MathUtils.radToDeg(Math.atan(t) * 2));
            if (nouveau <= fov + 0.01) break;
            fov = nouveau;
        }

        this.camera.fov = fov;
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();

        // Meme axe de vise, a la distance calculee. PLAY_POS est lu par spread
        // au moment des tweens : le muter suffit a recaler intro et resets.
        // La camera et le point de vise descendent ensemble : le regard se
        // translate sans changer l'angle, et toute la scene descend a l'ecran.
        // On cherche la translation qui pose le bas de la rangee sur BAS_CIBLE,
        // sans jamais faire sortir son haut par le dessus.
        look.y = SceneManager.BASE_LOOK_Y + this.calculerDescente(fov, dist);

        const ratio = dist / SceneManager.BASE_DIST;
        const pos = VFXController.PLAY_POS;
        pos.y = look.y + SceneManager.BASE_OFFSET.y * ratio;
        pos.z = look.z + SceneManager.BASE_OFFSET.z * ratio;

        if (this.defaultCameraPos) {
            this.defaultCameraPos.set(pos.x, pos.y, pos.z);
        }
    }

    /**
     * Position verticale d'un point a l'ecran, 0 en haut, 1 en bas.
     * Camera et cible sont sur l'axe x = 0 : la projection se resout dans le
     * plan YZ, sans passer par une matrice.
     */
    static projeterY(py, pz, cy, cz, ly, lz, fov) {
        let fy = ly - cy, fz = lz - cz;
        const n = Math.hypot(fy, fz); fy /= n; fz /= n;
        const uy = -fz, uz = fy;              // normale montante dans le plan YZ
        const dy = py - cy, dz = pz - cz;
        const zc = dy * fy + dz * fz;
        const yc = dy * uy + dz * uz;
        if (zc <= 0.001) return null;
        return (1 - (yc / zc) / Math.tan(THREE.MathUtils.degToRad(fov / 2))) / 2;
    }

    /** Bornes verticales de la rangee a l'ecran, pour un champ et une distance. */
    bornesRangee(fov, dist, descente) {
        const l = CardController.layoutFor(window.innerWidth / window.innerHeight);
        const demi = (CardController.CARD_H * l.scale) / 2;
        const slot = this.table ? this.table.getCardSlot(1) : { y: 1.0, z: 4.1 };
        const yc = slot.y + CardController.LIFT_Y, zc = slot.z;
        const inc = 0.55;
        const ratio = dist / SceneManager.BASE_DIST;
        const ly = SceneManager.BASE_LOOK_Y + descente;
        const cy = ly + SceneManager.BASE_OFFSET.y * ratio;
        const cz = 2.4 + SceneManager.BASE_OFFSET.z * ratio;
        const haut = SceneManager.projeterY(yc + demi * Math.sin(inc), zc - demi * Math.cos(inc), cy, cz, ly, 2.4, fov);
        const bas = SceneManager.projeterY(yc - demi * Math.sin(inc), zc + demi * Math.cos(inc), cy, cz, ly, 2.4, fov);
        return (haut === null || bas === null) ? null : { haut, bas };
    }

    /** Part de la hauteur d'ecran reellement occupee par une carte. */
    empriseRangee(fov, dist) {
        const b = this.bornesRangee(fov, dist, 0);
        return b === null ? null : (b.bas - b.haut);
    }

    /** Translation verticale a appliquer au regard, par recherche dichotomique. */
    calculerDescente(fov, dist) {
        const l = CardController.layoutFor(window.innerWidth / window.innerHeight);
        const demi = (CardController.CARD_H * l.scale) / 2;
        const slot = this.table ? this.table.getCardSlot(1) : { y: 1.0, z: 4.1 };
        const yc = slot.y + CardController.LIFT_Y, zc = slot.z;
        const inc = 0.55;                      // REST_TILT depuis l'horizontale
        const basY = yc - demi * Math.sin(inc), basZ = zc + demi * Math.cos(inc);
        const hautY = yc + demi * Math.sin(inc), hautZ = zc - demi * Math.cos(inc);
        const ratio = dist / SceneManager.BASE_DIST;

        const ecran = (d, py, pz) => {
            const ly = SceneManager.BASE_LOOK_Y + d;
            const cy = ly + SceneManager.BASE_OFFSET.y * ratio;
            const cz = 2.4 + SceneManager.BASE_OFFSET.z * ratio;
            return SceneManager.projeterY(py, pz, cy, cz, ly, 2.4, fov);
        };

        // La translation peut etre negative : en paysage la rangee, avancee
        // vers le joueur, descend deja trop bas et il faut relever le regard.
        let lo = -8, hi = 12;
        for (let i = 0; i < 28; i++) {
            const m = (lo + hi) / 2;
            const v = ecran(m, basY, basZ);
            if (v === null || v < SceneManager.BAS_CIBLE) lo = m; else hi = m;
        }
        let d = lo;

        // Seconde borne : la translation minimale pour que le haut de la rangee
        // reste visible. Augmenter d descend le contenu, donc cette contrainte
        // est un plancher, pas un plafond. Un simple decrement partait en
        // fuite lorsque les deux cibles etaient inconciliables.
        let lo2 = -8, hi2 = 12;
        for (let i = 0; i < 28; i++) {
            const m = (lo2 + hi2) / 2;
            const h = ecran(m, hautY, hautZ);
            const mini = window.innerHeight < 500
                ? SceneManager.HAUT_MINI_COURT : SceneManager.HAUT_MINI;
            if (h === null || h < mini) lo2 = m; else hi2 = m;
        }

        // Si les deux cibles s'excluent -- ecran trop bas pour la hauteur de la
        // rangee -- la visibilite complete l'emporte sur la position basse.
        return Math.max(d, hi2);
    }

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.applyPlayFraming();
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
                // 0.15 et 0.2 sont les valeurs avec lesquelles la scene est
                // construite (TableController). L'ancien retour a 0.8 / 1.5
                // delavait le sanctuaire des qu'on avait touche une fois au
                // mode clair, sans possibilite de revenir a l'ambiance d'origine.
                obj.intensity = enabled ? 1.8 : 0.15;
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
        const elapsed = this.clock.getElapsedTime();
        TWEEN.update();
        if (this.table) this.table.animate(elapsed);
        if (this.cardController) this.cardController.update(elapsed);
        if (this.vfx) this.vfx.update(elapsed);
        this.renderer.render(this.scene, this.camera);
    }
}
