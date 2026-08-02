import * as THREE from 'three';
import TWEEN from 'three/addons/libs/tween.module.js';
import { RARITY_DEFINITIONS, PILLAR_DEFINITIONS, PILLARS } from './game-config.js';

export class CardController {
    // Resting tilt of a dealt card. Cards lie on the play mat, face-up and
    // angled toward the elevated camera exactly like a dealt hand. The mat is
    // tilted (-PI/2 + 0.32); cards match that so their faces point up at the
    // camera and always read clearly. Hover lifts a card slightly more upright.
    static REST_TILT = -Math.PI * 0.5 + 0.55;
    static HOVER_TILT = -Math.PI * 0.5 + 0.72;
    // Selected: card lifts off the mat and stands up to face the player.
    static SELECT_TILT = -Math.PI * 0.5 + 1.05;

    // ------------------------------------------------------------------
    // LISIBILITE
    // La carte mesurait 1.1 de large pour une texture 512x768 : sur un
    // telephone, le texte imprime tombait a 3 px de haut. Elle est portee au
    // maximum permis par l'ecartement des emplacements (aucun chevauchement au
    // repos ni au survol) et allongee, la place verticale etant libre a
    // l'ecran. L'espace de conception suit exactement le meme rapport, pour ne
    // pas deformer le dessin.
    // ------------------------------------------------------------------
    // 1.49 est le maximum : au-dela, deux cartes se toucheraient au survol
    // (ecartement 1.462 sur telephone, carte a l'echelle 0.92 x 1.06).
    static CARD_W = 1.49;                 // etait 1.1
    static CARD_RATIO = 1.875;            // etait 1.4545 (1.6 / 1.1)
    static CARD_H = 1.49 * 1.875;         // 2.794

    static SLOT_X = 2.15;                 // ecartement lateral (TableController)

    // Espace de conception de la face. Le rendu se fait a RES fois cette
    // taille : la resolution de texture monte sans toucher aux coordonnees.
    static DES_W = 512;
    static DES_H = 960;                   // 512 * 1.875
    static RES = 1.5;                     // texture 768 x 1440 (etait 512 x 768)

    // Une carte plus haute, posee au meme angle, s'enfoncerait de 0.255 dans
    // le tapis. On releve la rangee d'autant.
    static LIFT_Y = 0.284;

    constructor(scene, textures) {
        this.scene = scene;
        this.textures = textures;
        this.cards = [];
        this.selectedCard = null;
        this.hoveredCard = null;
        
        // Performance optimization: Shared geometry
        this.cardGeometry = new THREE.BoxGeometry(CardController.CARD_W, CardController.CARD_H, 0.04);
        
        // Performance optimization: Shared materials for sides/top/bottom/back
        this.sideMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.8 });
        this.backMaterial = new THREE.MeshStandardMaterial({ 
            map: this.textures.cardBack, 
            color: 0x222222,
            roughness: 0.2,
            metalness: 0.5 
        });
    }

    createCards(cardData, slots) {
        // Clear existing cards
        this.clear();

        // Responsive layout: on narrow (portrait / mobile) viewports the default
        // horizontal spread pushes the side cards out of frame. Compress the
        // horizontal spacing and scale so all three cards stay fully visible.
        const aspect = window.innerWidth / window.innerHeight;
        const isPortrait = aspect < 0.85;
        const spreadFactor = isPortrait ? 0.68 : 1.0;
        const cardScale = isPortrait ? 0.92 : 1.0;

        cardData.forEach((data, i) => {
            const baseSlot = slots[i] || new THREE.Vector3(0, 0, 0);
            // Apply responsive horizontal compression around the table center.
            const slot = new THREE.Vector3(
                baseSlot.x * spreadFactor,
                baseSlot.y,
                baseSlot.z
            );
            const mesh = this.generateCardMesh(data);
            mesh.scale.setScalar(cardScale);

            // Cards rest face-up on the mat, angled toward the elevated camera
            // exactly like a dealt hand on a real card table. This framing is
            // fully reliable: the faces always read and are never occluded.
            // Entry: slide in from slightly below/behind for a dealing feel.
            mesh.position.set(slot.x, slot.y - 0.6, slot.z + 1.4);
            mesh.rotation.x = CardController.REST_TILT - 0.35;
            mesh.userData = {
                id: data.id,
                data: data,
                slot: slot,
                baseScale: cardScale,   // resting scale for hover/select math
                floatPhase: i * 1.7,    // desync idle float per card
                isHovered: false
            };

            this.scene.add(mesh);
            this.cards.push(mesh);

            new TWEEN.Tween(mesh.position)
                .to({ y: slot.y, z: slot.z }, 750)
                .easing(TWEEN.Easing.Quartic.Out)
                .delay(i * 130)
                .start();

            new TWEEN.Tween(mesh.rotation)
                .to({ x: CardController.REST_TILT }, 850)
                .easing(TWEEN.Easing.Back.Out)
                .delay(i * 130)
                .start();
        });
    }

    generateCardMesh(data) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(CardController.DES_W * CardController.RES);
        canvas.height = Math.round(CardController.DES_H * CardController.RES);
        this.drawCardToCanvas(canvas, data);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        // Le texte est vu sous un angle rasant (carte inclinee de 0.55 rad) :
        // sans anisotropie suffisante il bave. 4 etait le minimum, on monte a 8
        // dans la limite de ce que la carte graphique accepte.
        tex.anisotropy = 8;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;

        // Front material is unique per card due to unique canvas texture.
        // A low baseline emissive using the card texture itself guarantees the
        // face is always legible even if scene lighting doesn't reach the card
        // row; select/hover raise the intensity for emphasis.
        const frontMaterial = new THREE.MeshStandardMaterial({ 
            map: tex, 
            emissive: 0xffffff, 
            emissiveMap: tex,
            emissiveIntensity: 0.85, 
            roughness: 0.35, 
            metalness: 0.05,
            transparent: true
        });

        const materials = [
            this.sideMaterial, // right
            this.sideMaterial, // left
            this.sideMaterial, // top
            this.sideMaterial, // bottom
            frontMaterial,     // front
            this.backMaterial  // back
        ];

        const mesh = new THREE.Mesh(this.cardGeometry, materials);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return mesh;
    }

    /**
     * Master card renderer. Composes the complete card face from shared assets:
     * 1. Wood background   2. Pillar color tint   3. Illustration (framed)
     * 4. Pillar icon       5. Title               6. Description text
     * 7. Effects (+/-)     8. Rarity badge        9. Gold engraved border
     * No new graphics are created; everything is drawn from existing textures.
     */
    drawCardToCanvas(canvas, data) {
        const ctx = canvas.getContext('2d');
        const W = CardController.DES_W, H = CardController.DES_H;
        // Tout le dessin reste exprime dans l'espace 512 x 960. Le contexte est
        // mis a l'echelle une fois : la texture gagne en resolution sans qu'une
        // seule coordonnee ne change.
        ctx.setTransform(CardController.RES, 0, 0, CardController.RES, 0, 0);
        const rarityInfo = RARITY_DEFINITIONS[data.rarity || 'common'] || RARITY_DEFINITIONS.common;
        const cardColor = data.color || rarityInfo.color;
        const isLegendary = data.rarity === 'legendary';
        const isMythic = data.rarity === 'mythic';

        // Fill the whole rectangle (the box mesh has opaque edges, so we avoid
        // transparent rounded corners that would reveal the geometry seams).
        ctx.clearRect(0, 0, W, H);
        ctx.save();

        // --- 1. FOND DE CARTE : noble wood texture ---
        const wood = this.textures.wood;
        try {
            if (wood && wood.image) {
                ctx.drawImage(wood.image, 0, 0, W, H);
                console.log(`[DRAW] wood ok w=${wood.image.width}x${wood.image.height}`);
            } else {
                ctx.fillStyle = '#1a1109';
                ctx.fillRect(0, 0, W, H);
                console.log('[DRAW] wood MISSING, filled fallback');
            }
        } catch (e) {
            console.log(`[DRAW-ERR wood] ${e && e.message}`);
        }
        // Gentle darkening vignette so text/illustration read clearly WITHOUT
        // crushing the wood, illustration and title into black. Kept light so
        // the card face stays legible under the sanctuary's dim lighting.
        const bgShade = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 560);
        bgShade.addColorStop(0, 'rgba(5,5,5,0.12)');
        bgShade.addColorStop(1, 'rgba(0,0,0,0.55)');
        ctx.fillStyle = bgShade;
        ctx.fillRect(0, 0, W, H);

        // --- 2. COULEUR SELON LE PILIER : subtle color wash + top banner ---
        ctx.fillStyle = `rgba(${this.hexToRgb(cardColor)}, 0.14)`;
        ctx.fillRect(0, 0, W, H);
        const bannerGrad = ctx.createLinearGradient(0, 55, 0, 150);
        bannerGrad.addColorStop(0, `rgba(${this.hexToRgb(cardColor)}, 0.45)`);
        bannerGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bannerGrad;
        ctx.fillRect(50, 52, W - 100, 104);

        ctx.restore(); // release clip for shadowed elements

        // --- 4. ICÔNE DU PILIER (header, left) ---
        const pillarIcon = this.textures.pillarIcons?.[data.category];
        const headerY = 108;
        if (pillarIcon && pillarIcon.image) {
            const img = pillarIcon.image;
            const iconSize = 64;
            const ratio = img.width / img.height;
            let iw = iconSize, ih = iconSize;
            if (ratio > 1) ih = iconSize / ratio; else iw = iconSize * ratio;
            ctx.save();
            ctx.shadowBlur = 12;
            ctx.shadowColor = cardColor;
            ctx.drawImage(img, 74, headerY - ih / 2, iw, ih);
            ctx.restore();
        }

        // --- 8. RARETÉ (header, right) ---
        const rarityText = data.isWorldEvent ? 'ÉVÉNEMENT' : (rarityInfo.name || '').toUpperCase();
        ctx.font = '700 40px Montserrat, sans-serif';
        ctx.letterSpacing = '3px';
        ctx.textAlign = 'right';
        ctx.fillStyle = data.isWorldEvent ? '#5dade2' : (isLegendary || isMythic ? '#f3e5ab' : cardColor);
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        // 'EVENEMENT' a 40 px depasserait sur l'embleme du pilier a gauche.
        let tr = 40;
        while (tr > 22 && ctx.measureText(rarityText).width > 300) {
            tr -= 2;
            ctx.font = `700 ${tr}px Montserrat, sans-serif`;
        }
        ctx.fillText(rarityText, 460, headerY - 10);
        ctx.restore();
        const categoryName = (PILLAR_DEFINITIONS[data.category]?.name || 'Destin').toUpperCase();
        ctx.font = '600 24px Montserrat, sans-serif';
        ctx.letterSpacing = '2px';
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.fillText(categoryName, 460, headerY + 26);
        ctx.letterSpacing = '0px';

        // --- 3. ILLUSTRATION (framed window) ---
        const artX = 52, artY = 136, artW = 408, artH = 244;
        ctx.save();
        this.roundRectPath(ctx, artX, artY, artW, artH, 12);
        ctx.fillStyle = '#070707';
        ctx.fill();
        ctx.clip();

        let artTexture = this.textures.illustrations[data.category];
        const specialMapping = {
            "L'Oeil du Cyclone": 'legendary_spirit',
            "Pacte d'Éternité": 'legendary_love',
            "Arbre de Lumière": 'legendary_wealth',
            "Souffle de Gaïa": 'legendary_life',
            'prosperity': 'event_gold_rush',
            'isolation': 'event_eclipse',
            'festival': 'event_festival',
            'spring': 'event_spring',
            'crisis': 'health'
        };
        const textureKey = data.isWorldEvent ? specialMapping[data.eventId] : specialMapping[data.title];
        if (textureKey) {
            artTexture = this.textures.illustrations[textureKey] || artTexture;
        } else if (data.category === 'mixed' || isMythic) {
            artTexture = this.textures.illustrations.harmony;
        }

        if (artTexture && artTexture.image) {
            const img = artTexture.image;
            const ratio = img.width / img.height;
            const frameRatio = artW / artH;
            // Ajustement par remplissage et non par insertion. En insertion,
            // une illustration au format 0.9 dans un cadre au format 1.63
            // laissait plus de la moitie du cadre en bandes noires. Le cadre
            // est desormais toujours rempli, le debord est rogne par le clip.
            let dw, dh;
            if (ratio > frameRatio) { dh = artH; dw = artH * ratio; }
            else { dw = artW; dh = artW / ratio; }
            const dx = artX + (artW - dw) / 2;
            // Cadrage sur le haut de l'image plutot que sur son centre : les
            // sujets de ces illustrations sont hauts (arbre, lotus, silhouette).
            const dy = artY + (artH - dh) * 0.35;
            ctx.globalAlpha = 0.96;
            ctx.drawImage(img, dx, dy, dw, dh);
            ctx.globalAlpha = 1;
        }
        const artFade = ctx.createLinearGradient(0, artY + artH - 70, 0, artY + artH);
        artFade.addColorStop(0, 'rgba(0,0,0,0)');
        artFade.addColorStop(1, 'rgba(5,5,5,0.85)');
        ctx.fillStyle = artFade;
        ctx.fillRect(artX, artY + artH - 70, artW, 70);
        ctx.restore();

        // Illustration gold frame line
        ctx.save();
        this.roundRectPath(ctx, artX, artY, artW, artH, 12);
        ctx.strokeStyle = `rgba(${this.hexToRgb(cardColor)}, 0.85)`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 14;
        ctx.shadowColor = cardColor;
        ctx.stroke();
        ctx.restore();

        // --- 4bis. PLAQUE DE LECTURE ---
        // Les veines les plus claires du bois ne donnent que 5,2:1 de contraste
        // avec du blanc, sous le seuil AAA de 7:1 pour du petit texte. On pose
        // un fond assombri sous tout le bloc titre + description + effets, en
        // degrade pour ne pas trancher net avec l'illustration.
        const plaqueY = 392, plaqueH = 504;
        const plaque = ctx.createLinearGradient(0, plaqueY, 0, plaqueY + plaqueH);
        plaque.addColorStop(0, 'rgba(6,5,8,0)');
        plaque.addColorStop(0.10, 'rgba(6,5,8,0.86)');
        plaque.addColorStop(0.88, 'rgba(6,5,8,0.86)');
        plaque.addColorStop(1, 'rgba(6,5,8,0.55)');
        ctx.fillStyle = plaque;
        ctx.fillRect(46, plaqueY, W - 92, plaqueH);

        // --- 5. TITRE ---
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        const title = (data.title || '').toUpperCase();
        // Titre : 54 px au lieu de 32. Trois paliers pour absorber les titres
        // longs sans jamais deborder de la largeur utile.
        // Les paliers par nombre de caracteres ne suffisent pas : une majuscule
        // Cinzel large fait deborder un titre pourtant court. On mesure et on
        // reduit jusqu'a tenir dans la largeur utile, cadre deduit.
        // Reduire un titre long jusqu'a ce qu'il tienne sur une ligne le
        // ramenait a 30 px, soit 6 px a l'ecran. On le repartit sur deux lignes
        // avant de toucher a sa taille : "HEURES SUPPLEMENTAIRES" garde ainsi
        // 44 px au lieu de 30.
        const LARGEUR_UTILE = 416;
        let tailleTitre = 58;
        const mesure = (t) => { ctx.font = `700 ${tailleTitre}px Cinzel, serif`; return ctx.measureText(t).width; };

        let lignesTitre = [title];
        if (mesure(title) > LARGEUR_UTILE) {
            // coupure au mot le plus proche du milieu
            const mots = title.split(' ');
            if (mots.length > 1) {
                let meilleur = 1, ecart = Infinity;
                for (let i = 1; i < mots.length; i++) {
                    const g = mots.slice(0, i).join(' ').length;
                    const d = mots.slice(i).join(' ').length;
                    if (Math.abs(g - d) < ecart) { ecart = Math.abs(g - d); meilleur = i; }
                }
                lignesTitre = [mots.slice(0, meilleur).join(' '), mots.slice(meilleur).join(' ')];
            }
            while (tailleTitre > 24 && lignesTitre.some(l => mesure(l) > LARGEUR_UTILE)) {
                tailleTitre -= 2;
            }
            // Filet de securite : si un mot seul reste trop large meme au
            // plancher, on le brise plutot que de le laisser deborder.
            if (lignesTitre.some(l => mesure(l) > LARGEUR_UTILE)) {
                lignesTitre = this.decouper(ctx, title, LARGEUR_UTILE);
            }
        }
        ctx.font = `700 ${tailleTitre}px Cinzel, serif`;
        const hautTitre = lignesTitre.length > 1 ? 440 : 476;
        const interTitre = tailleTitre * 1.08;
        lignesTitre.forEach((l, i) => ctx.fillText(l, W / 2, hautTitre + i * interTitre));
        ctx.restore();

        // Divider under title
        const dividerGrad = ctx.createLinearGradient(110, 0, 402, 0);
        dividerGrad.addColorStop(0, 'transparent');
        dividerGrad.addColorStop(0.5, cardColor);
        dividerGrad.addColorStop(1, 'transparent');
        ctx.strokeStyle = dividerGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(110, 530);
        ctx.lineTo(402, 530);
        ctx.stroke();

        // --- 6. TEXTE DE LA CARTE (wrapped description) ---
        // Description : 19 px etait illisible (3 px a l'ecran sur telephone).
        // Trois paliers selon la longueur du texte, pour occuper la zone sans
        // jamais la deborder. Mediane du jeu : 45 caracteres -> 48 px.
        // Les paliers fixes par nombre de caracteres tronquaient les textes
        // longs. On descend maintenant la taille jusqu'a ce que la totalite du
        // texte tienne dans la zone : aucune information n'est jamais coupee.
        const texte = data.desc || '';
        const ZONE_HAUT = 544, ZONE_BAS = 792;
        const hauteurDispo = ZONE_BAS - ZONE_HAUT;
        const LARGEUR_TEXTE = 416;

        let tailleDesc = 54, interligne = 74, lignesDesc = [texte];
        for (const t of [54, 50, 46, 42, 38, 34, 30, 26]) {
            ctx.font = `400 ${t}px Montserrat, sans-serif`;
            const l = this.decouper(ctx, texte, LARGEUR_TEXTE);
            const il = Math.round(t * 1.38);
            tailleDesc = t; interligne = il; lignesDesc = l;
            if (l.length * il <= hauteurDispo) break;
        }

        ctx.font = `400 ${tailleDesc}px Montserrat, sans-serif`;
        // Blanc pur au lieu de 90 % : sur la plaque de lecture le contraste
        // passe de 4,8:1 au pire cas a 14,4:1.
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        // Bloc centre verticalement dans sa zone.
        const hautDesc = ZONE_HAUT + (hauteurDispo - lignesDesc.length * interligne) / 2 + tailleDesc;
        lignesDesc.forEach((l, i) => ctx.fillText(l, W / 2, hautDesc + i * interligne));
        ctx.restore();

        // --- 7. EFFETS (+ / -) ---
        this.drawEffects(ctx, data, W, 800);

        // --- 9. BORDURE DORÉE (engraved gold frame, on top) ---
        // IMPORTANT: the border texture (gold-engraved-border.webp) is a fully
        // OPAQUE image with a dark solid centre and NO alpha. Drawing it whole
        // over the finished card would paint that dark centre over everything
        // (wood, illustration, title, text), leaving only the gold frame — the
        // exact "blank card" bug. So we blit ONLY the outer frame band of the
        // source image onto the four edges of the card, preserving the interior.
        const border = this.textures.border;
        if (border && border.image) {
            const img = border.image;
            const sw = img.width, sh = img.height;
            // Fraction of the source image occupied by the gold frame band.
            // La bande etait proportionnelle a la hauteur : sur une carte
            // allongee elle devorait le haut et le bas. Elle suit desormais la
            // largeur, epaisseur constante sur les quatre cotes.
            // La bande etait proportionnelle a la HAUTEUR : sur une carte
            // allongee elle devorait le haut et le bas, et a 0.15 de largeur
            // elle recouvrait les pastilles d'effets laterales (le cadre est
            // dessine par-dessus le contenu). Ramenee a 0.09 de la largeur,
            // epaisseur identique sur les quatre cotes.
            const frac = 0.09;
            const bandW = W * frac;   // destination band thickness (px)
            const bandH = W * frac;
            const sBandW = sw * frac; // source band thickness (px)
            const sBandH = sh * frac;

            // Top edge
            ctx.drawImage(img, 0, 0, sw, sBandH, 0, 0, W, bandH);
            // Bottom edge
            ctx.drawImage(img, 0, sh - sBandH, sw, sBandH, 0, H - bandH, W, bandH);
            // Left edge
            ctx.drawImage(img, 0, 0, sBandW, sh, 0, 0, bandW, H);
            // Right edge
            ctx.drawImage(img, sw - sBandW, 0, sBandW, sh, W - bandW, 0, bandW, H);
        } else {
            ctx.strokeStyle = cardColor;
            ctx.lineWidth = 8;
            this.roundRectPath(ctx, 14, 14, W - 28, H - 28, 20);
            ctx.stroke();
        }

        // Legendary / Mythic / Event glow accent over border
        if (isLegendary || isMythic || data.isWorldEvent) {
            ctx.save();
            ctx.strokeStyle = isMythic ? '#9fd8ff' : (data.isWorldEvent ? '#5dade2' : '#f3e5ab');
            ctx.lineWidth = isMythic ? 4 : 3;
            ctx.shadowBlur = isMythic ? 40 : 20;
            ctx.shadowColor = isMythic ? '#00ccff' : (data.isWorldEvent ? '#3498db' : '#ffd970');
            this.roundRectPath(ctx, 20, 20, W - 40, H - 40, 18);
            ctx.stroke();
            ctx.restore();
        }
    }

    /**
     * Draws the pillar effect chips (e.g. +20 / -10) at the bottom of the card,
     * colored per pillar with clear + / - signs.
     */
    drawEffects(ctx, data, W, y) {
        const effects = data.effects || {};
        const entries = [];

        if (data.isWorldEvent && data.effectsPerTurn) {
            for (const p of PILLARS) {
                const v = data.effectsPerTurn[p];
                if (v !== undefined && v !== 0) entries.push([p, v, true]);
            }
        } else {
            for (const p of PILLARS) {
                const v = effects[p];
                if (v !== undefined && v !== 0) entries.push([p, v, false]);
            }
        }

        // Gains a gauche, sacrifices a droite : le joueur lit d'un coup ce que
        // la carte apporte et ce qu'elle coute, au lieu d'un melange dans
        // l'ordre des piliers.
        entries.sort((a, b) => (b[1] > 0) - (a[1] > 0));
        const nbBonus = entries.filter(e => e[1] > 0).length;

        if (entries.length === 0) {
            if (data.specialEffect) {
                ctx.font = '600 34px Montserrat, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#f3e5ab';
                ctx.fillText('✦ EFFET SPÉCIAL ✦', W / 2, y + 44);
            }
            return;
        }

        // Pastilles agrandies : 44 px de haut donnaient 3 px a l'ecran sur
        // telephone. La largeur utile de la carte permet 4 pastilles de 112.
        // 4 pastilles + 3 ecarts doivent tenir dans la largeur utile, cadre
        // deduit : 4 x 94 + 3 x 12 = 412 pour 420 disponibles.
        // 4 pastilles + 2 ecarts simples + 1 ecart de groupe : 4x90 + 2x12 + 28 = 412
        const chipW = 90, chipH = 84, gap = 12, gapGroupe = 28;
        const perRow = Math.min(entries.length, 4);
        const rows = Math.ceil(entries.length / perRow);

        for (let r = 0; r < rows; r++) {
            const rowItems = entries.slice(r * perRow, r * perRow + perRow);
            const coupure = (nbBonus > 0 && nbBonus < rowItems.length) ? 1 : 0;
            const totalW = rowItems.length * chipW + (rowItems.length - 1) * gap
                         + coupure * (gapGroupe - gap);
            let x = (W - totalW) / 2;
            let indice = 0;
            const rowY = y + r * (chipH + gap);

            for (const [pillar, value, perTurn] of rowItems) {
                const pColor = PILLAR_DEFINITIONS[pillar]?.color || '#c5a059';
                const positive = value > 0;

                ctx.save();
                this.roundRectPath(ctx, x, rowY, chipW, chipH, 12);
                ctx.fillStyle = 'rgba(0,0,0,0.82)';
                ctx.fill();
                ctx.strokeStyle = pColor;
                ctx.lineWidth = 2.5;
                ctx.stroke();
                ctx.restore();

                // L'embleme passe au-dessus du chiffre : cote a cote, la
                // valeur n'avait plus que 42 px de large et chevauchait l'icone.
                const icon = this.textures.pillarIcons?.[pillar];
                if (icon && icon.image) {
                    const s = 26;
                    const ratio = icon.image.width / icon.image.height;
                    let iw = s, ih = s;
                    if (ratio > 1) ih = s / ratio; else iw = s * ratio;
                    ctx.drawImage(icon.image, x + (chipW - iw) / 2, rowY + 7, iw, ih);
                }

                ctx.font = '700 44px Cinzel, serif';
                ctx.textAlign = 'center';
                // Verts et rouges eclaircis : sur fond noir a 0.82, les
                // teintes precedentes tombaient sous 7:1.
                ctx.fillStyle = positive ? '#8affc1' : '#ff9d9d';
                ctx.shadowBlur = 6;
                ctx.shadowColor = 'rgba(0,0,0,0.9)';
                const label = `${positive ? '+' : ''}${value}${perTurn ? '/t' : ''}`;
                ctx.fillText(label, x + chipW / 2, rowY + chipH - 18);

                indice++;
                // ecart plus large entre le dernier bonus et le premier malus
                x += chipW + ((coupure && indice === nbBonus) ? gapGroupe : gap);
            }
        }
    }

    /**
     * Decoupe un texte en lignes tenant dans maxWidth. Ne supprime jamais rien :
     * un mot plus large que la ligne est coupe caractere par caractere plutot
     * que de deborder. C'est l'appelant qui reduit la taille de police jusqu'a
     * ce que l'ensemble tienne dans la hauteur disponible.
     */
    decouper(ctx, text, maxWidth) {
        const lignes = [];
        let ligne = '';
        for (const mot of (text || '').split(' ')) {
            const essai = ligne ? ligne + ' ' + mot : mot;
            if (ctx.measureText(essai).width > maxWidth && ligne) {
                lignes.push(ligne);
                ligne = mot;
            } else {
                ligne = essai;
            }
            // mot seul plus large que la ligne : on le brise
            while (ctx.measureText(ligne).width > maxWidth && ligne.length > 1) {
                let coupe = ligne.length - 1;
                while (coupe > 1 && ctx.measureText(ligne.slice(0, coupe)).width > maxWidth) coupe--;
                lignes.push(ligne.slice(0, coupe));
                ligne = ligne.slice(coupe);
            }
        }
        if (ligne) lignes.push(ligne);
        return lignes;
    }

    /** Conserve pour compatibilite : trace un texte deja mesure. */
    wrapText(ctx, text, centerX, startY, maxWidth, lineHeight) {
        ctx.textAlign = 'center';
        this.decouper(ctx, text, maxWidth)
            .forEach((l, i) => ctx.fillText(l, centerX, startY + i * lineHeight));
    }

    /** Rounded-rectangle path helper. */
    roundRectPath(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
            '197, 160, 89';
    }

    updateCardTexture(mesh) {
        const data = mesh.userData.data;
        const frontMat = mesh.material[4];
        if (frontMat && frontMat.map) {
            const canvas = frontMat.map.image;
            if (canvas instanceof HTMLCanvasElement) {
                this.drawCardToCanvas(canvas, data);
                frontMat.map.needsUpdate = true;
            }
        }
    }

    /**
     * Flips a card to reveal its opposite face. Rotates 180° around Y.
     * Used when the player wants to inspect the ornate card back or reveal
     * a card that was dealt face-down.
     */
    flip(mesh, callback) {
        if (!mesh) return;
        mesh.userData.isFlipped = !mesh.userData.isFlipped;
        const targetY = mesh.userData.isFlipped ? Math.PI : 0;

        new TWEEN.Tween(mesh.rotation)
            .to({ y: targetY }, 500)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onComplete(() => { if (callback) callback(mesh.userData.isFlipped); })
            .start();
    }

    setHover(mesh, isHovered) {
        if (!mesh || mesh === this.selectedCard) return;

        mesh.userData.isHovered = isHovered;
        this.hoveredCard = isHovered ? mesh : (this.hoveredCard === mesh ? null : this.hoveredCard);

        const slot = mesh.userData.slot;
        const base = mesh.userData.baseScale || 1;

        // Lift the card toward the player and pull it forward slightly.
        const targetY = isHovered ? slot.y + 0.28 : slot.y;
        const targetZ = isHovered ? slot.z + 0.22 : slot.z;
        const targetRotX = isHovered ? CardController.HOVER_TILT : CardController.REST_TILT;
        const targetScale = isHovered ? base * 1.06 : base;

        // Stop any lingering hover tweens so rapid mouse movement stays smooth.
        if (mesh.userData._hoverPosT) mesh.userData._hoverPosT.stop();
        if (mesh.userData._hoverRotT) mesh.userData._hoverRotT.stop();
        if (mesh.userData._hoverScaleT) mesh.userData._hoverScaleT.stop();

        mesh.userData._hoverPosT = new TWEEN.Tween(mesh.position)
            .to({ y: targetY, z: targetZ }, isHovered ? 260 : 360)
            .easing(isHovered ? TWEEN.Easing.Back.Out : TWEEN.Easing.Cubic.Out)
            .start();

        mesh.userData._hoverRotT = new TWEEN.Tween(mesh.rotation)
            .to({ x: targetRotX }, 300)
            .easing(TWEEN.Easing.Cubic.Out)
            .start();

        mesh.userData._hoverScaleT = new TWEEN.Tween(mesh.scale)
            .to({ x: targetScale, y: targetScale, z: targetScale }, 300)
            .easing(TWEEN.Easing.Cubic.Out)
            .start();

        // Warm rim-glow on hover; restore the calm resting glow when leaving.
        const frontMat = mesh.material[4];
        frontMat.emissive.set(isHovered ? 0xfff1cf : 0xffffff);
        new TWEEN.Tween(frontMat)
            .to({ emissiveIntensity: isHovered ? 1.15 : 0.85 }, 300)
            .easing(TWEEN.Easing.Cubic.Out)
            .start();
    }

    select(mesh) {
        if (this.selectedCard) {
            this.deselect(this.selectedCard);
        }

        this.selectedCard = mesh;
        mesh.userData.isHovered = false;
        this.hoveredCard = null;
        const data = mesh.userData.data;
        const slot = mesh.userData.slot;
        const base = mesh.userData.baseScale || 1;
        const isLegendary = data.rarity === 'legendary';
        const isMythic = data.rarity === 'mythic';
        const isSpecial = isLegendary || isMythic;
        const rarityInfo = RARITY_DEFINITIONS[data.rarity || 'common'] || RARITY_DEFINITIONS.common;

        // Custom easing based on animation type
        let easing = TWEEN.Easing.Back.Out;
        if (rarityInfo.animation === 'elastic' || isMythic) easing = TWEEN.Easing.Elastic.Out;
        else if (rarityInfo.animation === 'glow' || isLegendary) easing = TWEEN.Easing.Back.Out;

        // Cancel hover tweens so the selection pop is clean.
        if (mesh.userData._hoverScaleT) mesh.userData._hoverScaleT.stop();

        // Lift the card off the mat and present it upright to the player.
        new TWEEN.Tween(mesh.position)
            .to({ y: slot.y + (isSpecial ? 0.95 : 0.75), z: slot.z + (isSpecial ? 0.75 : 0.55) }, 520)
            .easing(easing)
            .start();

        new TWEEN.Tween(mesh.rotation)
            .to({ x: CardController.SELECT_TILT }, 520)
            .easing(TWEEN.Easing.Back.Out)
            .start();

        // Satisfying scale pop when selected.
        const selScale = base * (isSpecial ? 1.16 : 1.12);
        mesh.userData._selectScale = selScale;
        new TWEEN.Tween(mesh.scale)
            .to({ x: selScale, y: selScale, z: selScale }, 520)
            .easing(TWEEN.Easing.Back.Out)
            .start();

        // Golden glow, then hand off to a gentle breathing pulse in update().
        const frontMat = mesh.material[4];
        frontMat.emissive.set(isSpecial ? 0xffffff : 0xf3e5ab);
        mesh.userData._glowBase = isSpecial ? 1.0 : 0.7;
        mesh.userData._glowAmp = isSpecial ? 0.35 : 0.22;
        new TWEEN.Tween(frontMat)
            .to({ emissiveIntensity: mesh.userData._glowBase }, 500)
            .easing(TWEEN.Easing.Cubic.Out)
            .onComplete(() => { mesh.userData._pulsing = true; })
            .start();
    }

    deselect(mesh) {
        if (!mesh) return;
        const slot = mesh.userData.slot;
        const base = mesh.userData.baseScale || 1;

        // End the breathing-glow pulse before settling back.
        mesh.userData._pulsing = false;

        new TWEEN.Tween(mesh.position)
            .to({ y: slot.y, z: slot.z }, 420)
            .easing(TWEEN.Easing.Quintic.Out)
            .start();

        new TWEEN.Tween(mesh.rotation)
            .to({ x: CardController.REST_TILT }, 420)
            .easing(TWEEN.Easing.Quintic.Out)
            .start();

        new TWEEN.Tween(mesh.scale)
            .to({ x: base, y: base, z: base }, 420)
            .easing(TWEEN.Easing.Quintic.Out)
            .start();

        const frontMat = mesh.material[4];
        frontMat.emissive.set(0xffffff);
        new TWEEN.Tween(frontMat).to({ emissiveIntensity: 0.85 }, 400).start();
        
        if (this.selectedCard === mesh) this.selectedCard = null;
    }

    play(mesh, callback) {
        this.selectedCard = null;
        this.hoveredCard = null;
        // Stop any hover/pulse animation so the play tween owns the card fully.
        mesh.userData._pulsing = false;
        mesh.userData.isHovered = false;
        mesh.rotation.z = 0;
        const data = mesh.userData.data;
        const isLegendary = data.rarity === 'legendary';
        const isMythic = data.rarity === 'mythic';
        const rarityInfo = RARITY_DEFINITIONS[data.rarity || 'common'] || RARITY_DEFINITIONS.common;
        
        // Trigger luminous halo VFX
        if (this.vfx) {
            const cardColor = data.color || rarityInfo.color;
            this.vfx.triggerCardPlayVFX(mesh.position, new THREE.Color(cardColor));
            
            if (isMythic && this.vfx.triggerCelestialFlash) {
                this.vfx.triggerCelestialFlash();
            }

            if (rarityInfo.vfx === 'screen_shake' || isLegendary || isMythic) {
                this.vfx.shakeCamera(isMythic ? 0.2 : 0.12, isMythic ? 800 : 600);
            }
            if ((isLegendary || isMythic) && this.vfx.triggerHarmonyEffect) {
                this.vfx.triggerHarmonyEffect(true);
            }
        }

        // Floating upwards disappearance
        const targetPos = { 
            y: mesh.position.y + (isLegendary || isMythic ? 3.0 : 1.5), 
            z: mesh.position.z - (isLegendary || isMythic ? 2.0 : 1.0), 
            x: mesh.position.x 
        };
        
        new TWEEN.Tween(mesh.position)
            .to(targetPos, isLegendary || isMythic ? 1200 : 800)
            .easing(isLegendary || isMythic ? TWEEN.Easing.Quartic.Out : TWEEN.Easing.Quadratic.Out)
            .onComplete(() => {
                this.disposeCard(mesh);
                const index = this.cards.indexOf(mesh);
                if (index > -1) this.cards.splice(index, 1);
                if (callback) callback();
            })
            .start();

        new TWEEN.Tween(mesh.rotation)
            .to({ x: -Math.PI * 0.2, y: Math.PI * (isLegendary || isMythic ? 0.2 : 0.05) }, isLegendary || isMythic ? 1200 : 800)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();

        const frontMat = mesh.material[4];
        new TWEEN.Tween(frontMat)
            .to({ opacity: 0, emissiveIntensity: isLegendary || isMythic ? 5.0 : 2.5 }, isLegendary || isMythic ? 1100 : 700)
            .easing(TWEEN.Easing.Cubic.In)
            .start();
        
        // Dissolve other cards
        this.cards.forEach(c => {
            if (c !== mesh) {
                new TWEEN.Tween(c.position)
                    .to({ y: c.position.y - 1.5 }, 500)
                    .easing(TWEEN.Easing.Cubic.In)
                    .onComplete(() => {
                        this.disposeCard(c);
                    })
                    .start();
                
                const mat = c.material[4];
                if (mat) new TWEEN.Tween(mat).to({ opacity: 0 }, 400).start();
            }
        });
        this.cards = [];
    }

    disposeCard(mesh) {
        if (!mesh) return;
        this.scene.remove(mesh);
        if (mesh.material) {
            const frontMat = mesh.material[4];
            if (frontMat) {
                if (frontMat.map) frontMat.map.dispose();
                frontMat.dispose();
            }
        }
    }

    clear() {
        this.cards.forEach(c => this.disposeCard(c));
        this.cards = [];
        this.selectedCard = null;
    }

    update(elapsedTime) {
        this.cards.forEach((c) => {
            const ud = c.userData;
            const phase = ud.floatPhase || 0;

            if (c === this.selectedCard) {
                // Breathing glow pulse while a card is selected — draws the eye
                // without any distracting motion, keeping the card readable.
                if (ud._pulsing) {
                    const frontMat = c.material[4];
                    const glowBase = ud._glowBase || 0.7;
                    const glowAmp = ud._glowAmp || 0.22;
                    frontMat.emissiveIntensity = glowBase + Math.sin(elapsedTime * 2.4 + phase) * glowAmp;
                }
                // Gentle upward bob for the presented card.
                c.position.y += Math.sin(elapsedTime * 1.6 + phase) * 0.0009;
            } else if (ud.isHovered) {
                // Livelier float + a whisper of sway while hovered.
                c.position.y += Math.sin(elapsedTime * 3 + phase) * 0.0016;
                c.rotation.z = Math.sin(elapsedTime * 1.5 + phase) * 0.012;
            } else {
                // Calm resting float; ease any hover-sway back to level.
                c.position.y += Math.sin(elapsedTime * 2 + phase) * 0.0005;
                if (c.rotation.z !== 0) c.rotation.z *= 0.9;
            }
        });
    }
}
