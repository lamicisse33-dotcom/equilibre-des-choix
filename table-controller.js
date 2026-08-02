import * as THREE from 'three';
import TWEEN from 'three/addons/libs/tween.module.js';
import { PILLAR_DEFINITIONS } from './game-config.js';
import { CardController } from './card-controller.js';

export class TableController {
    constructor(scene, loader, textures) {
        this.scene = scene;
        this.loader = loader;
        this.textures = textures;
        
        this.pillarMeshes = {};
        this.pillarLights = {};
        // Card row: the three cards always deal onto a dedicated, brightly lit
        // play stage close to the camera (z=3.0). They rest just above the mat
        // surface (y≈1.0) so the elevated camera reads all three faces clearly.
        // This is the guaranteed "table de jeu" zone — centered and always full.
        this.cardSlots = [
            new THREE.Vector3(-2.15, 1.0, 2.9),
            new THREE.Vector3(0, 1.0, 2.9),
            new THREE.Vector3(2.15, 1.0, 2.9)
        ];
        
        this.init();
    }

    init() {
        this.setupEnvironment();
        this.loadTable();
        this.createPillars();
        this.createBalance();
        this.createDust();
    }

    setupEnvironment() {
        // Fond (Background & Fog)
        this.scene.background = new THREE.Color(0x020205);
        // Fog pushed back so it only softens the deep background (balance, rocks)
        // and never fades the near card stage (cards sit ~5.5 units from camera).
        this.scene.fog = new THREE.Fog(0x03040a, 11, 26);
        
        // General lighting for the table environment
        const ambient = new THREE.AmbientLight(0xffffff, 0.15); 
        this.scene.add(ambient);

        this.harmonyLight = new THREE.AmbientLight(0xffffff, 0); // Neutral light for heritage pulse
        this.scene.add(this.harmonyLight);

        const tableSpot = new THREE.SpotLight(0xffeebb, 15);
        tableSpot.position.set(0, 8, 4);
        tableSpot.castShadow = true;
        // Le frustum d'ombre couvrait 0.5 -> 500 : toute la precision de la
        // shadow map partait dans du vide. Resserre sur la table reelle, on
        // gagne assez de nettete pour descendre a 512 sur petit ecran.
        const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 820;
        tableSpot.shadow.mapSize.set(smallScreen ? 512 : 1024, smallScreen ? 512 : 1024);
        tableSpot.shadow.camera.near = 3.5;
        tableSpot.shadow.camera.far = 18;
        tableSpot.shadow.bias = -0.0015;
        tableSpot.angle = Math.PI / 5;
        tableSpot.penumbra = 0.3;
        tableSpot.decay = 1.5;
        this.scene.add(tableSpot);
        this.tableSpot = tableSpot;
        
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
        rimLight.position.set(0, 5, -5);
        this.scene.add(rimLight);

        // Dedicated card lighting: a bright warm spot aimed straight at the
        // near play stage (z≈3.0) so the three card faces are always clearly
        // readable, independent of the far table spot.
        const cardLight = new THREE.SpotLight(0xfff4e0, 26);
        cardLight.position.set(0, 6.5, 7.5);
        cardLight.target.position.set(0, 1.4, 3.0);
        cardLight.angle = Math.PI / 3.5;
        cardLight.penumbra = 0.45;
        cardLight.decay = 1.1;
        cardLight.distance = 20;
        this.scene.add(cardLight);
        this.scene.add(cardLight.target);
        this.cardLight = cardLight;

        // Remplissage doux des faces de carte. Passe en HemisphereLight :
        // meme lecture aux angles rasants qu'un PointLight, mais sans
        // attenuation a calculer par fragment.
        const cardFill = new THREE.HemisphereLight(0xfff1dd, 0x101018, 0.55);
        this.scene.add(cardFill);
        this.cardFill = cardFill;

        // --- PLAY STAGE ("table de jeu") ---
        // A clearly visible central play zone under the card row so the middle
        // of the screen reads as a real card table: a felt mat framed by a
        // glowing gold ring and three engraved card slots.
        this.buildPlayStage();
    }

    /**
     * Builds the central play surface where the cards always appear: a dark
     * felt mat, a luminous gold frame ring, and three subtle card-slot outlines.
     * Purely decorative — it anchors the play area visually and never moves.
     */
    buildPlayStage() {
        const stage = new THREE.Group();
        stage.position.set(0, 0.62, 2.55);
        // Lay the mat nearly flat but tilted slightly toward the camera so its
        // surface and slots are clearly visible from the play framing.
        stage.rotation.x = -Math.PI * 0.5 + 0.32;

        // Felt play mat
        const matGeo = new THREE.PlaneGeometry(8.4, 4.2);
        // Le grain du bois sert de carte de rugosite : le feutre cesse d'etre
        // un aplat plastique et accroche la lumiere de facon irreguliere.
        const matMat = new THREE.MeshStandardMaterial({
            color: 0x0e0b16,
            roughness: 0.94,
            metalness: 0.04,
            roughnessMap: this.textures.wood || null,
            emissive: 0x0a1830,
            emissiveIntensity: 0.22
        });
        const mat = new THREE.Mesh(matGeo, matMat);
        mat.receiveShadow = true;
        stage.add(mat);

        // Glowing gold frame ring around the mat
        const ringShape = new THREE.Shape();
        const rw = 4.15, rh = 2.05, r = 0.35;
        ringShape.moveTo(-rw + r, -rh);
        ringShape.lineTo(rw - r, -rh);
        ringShape.quadraticCurveTo(rw, -rh, rw, -rh + r);
        ringShape.lineTo(rw, rh - r);
        ringShape.quadraticCurveTo(rw, rh, rw - r, rh);
        ringShape.lineTo(-rw + r, rh);
        ringShape.quadraticCurveTo(-rw, rh, -rw, rh - r);
        ringShape.lineTo(-rw, -rh + r);
        ringShape.quadraticCurveTo(-rw, -rh, -rw + r, -rh);
        // Un THREE.Line fait 1 pixel quel que soit l'ecran : sur un telephone
        // haute densite le cadre disparaissait. On extrude un vrai ruban dore
        // qui porte la gravure de gold-engraved-border.webp.
        const frameGeo = new THREE.ExtrudeGeometry(ringShape, {
            steps: 1,
            depth: 0.035,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.035,
            bevelSegments: 2,
            curveSegments: 8
        });
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0xd8b45a,
            map: this.textures.border || null,
            metalness: 0.9,
            roughness: 0.3,
            emissive: 0x3a2a08,
            emissiveIntensity: 0.5
        });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.z = 0.005;
        stage.add(frame);
        this.stageFrame = frame;

        // Three engraved card-slot outlines aligned with the card row
        // Emplacements graves : plans legerement plus clairs et satines, lisibles
        // a toute densite d'ecran (contrairement aux lignes 1px precedentes).
        // Ils suivent la compression responsive de la rangee de cartes.
        const layout = CardController.layoutFor(window.innerWidth / window.innerHeight);
        const slotGeo = new THREE.PlaneGeometry(1.44, 2.05);
        const slotMat = new THREE.MeshStandardMaterial({
            color: 0x191426,
            roughness: 0.7,
            metalness: 0.25,
            emissive: 0x2a2210,
            emissiveIntensity: 0.28,
            transparent: true,
            opacity: 0.55
        });
        this.slotMeshes = [];
        [-2.1, 0, 2.1].forEach(sx => {
            const slot = new THREE.Mesh(slotGeo, slotMat);
            slot.position.set(sx * layout.spread, 0, 0.012);
            slot.userData.baseX = sx;
            stage.add(slot);
            this.slotMeshes.push(slot);
        });

        // Soft radial glow disc under the mat center to lift the play zone
        const glowGeo = new THREE.CircleGeometry(4.6, 48);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x1c3a66,
            transparent: true,
            opacity: 0.22,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.z = -0.02;
        stage.add(glow);

        this.playStage = stage;
        this.scene.add(stage);
    }

    evolveHeritage(totalLegacy) {
        if (!this.tableMeshes) return;
        
        // Materials change based on legacy
        let color = 0x3a2414; // Bois
        let metalness = 0.0;
        let roughness = 0.62;
        let spotIntensity = 15;
        
        if (totalLegacy > 1000) {
            color = 0x1a1a1a; // Obsidienne
            metalness = 0.35;
            roughness = 0.28;
            spotIntensity = 20;
        }
        
        if (totalLegacy > 5000) {
            color = 0x444444; // Argent
            metalness = 0.88;
            roughness = 0.16;
            spotIntensity = 25;
        }
        
        if (totalLegacy > 15000) {
            color = 0xd4af37; // Or
            metalness = 0.95;
            roughness = 0.24;
            spotIntensity = 30;
        }

        this.tableMeshes.forEach(mesh => {
            new TWEEN.Tween(mesh.material.color).to(new THREE.Color(color), 2000).start();
            new TWEEN.Tween(mesh.material).to({ metalness, roughness }, 2000).start();
        });

        if (this.tableSpot) {
            new TWEEN.Tween(this.tableSpot).to({ intensity: spotIntensity }, 2000).start();
        }
    }

    loadTable() {
        // Plateau (Table)
        this.loader.load('assets/models/prestigious-table.glb', (gltf) => {
            const table = gltf.scene;
            table.scale.set(5.2, 5, 5.2);
            table.position.y = -1.25;
            this.tableMeshes = [];
            table.traverse(c => {
                if (c.isMesh) {
                    // La table recoit les ombres mais n'en projette pas :
                    // elle ne s'ombre qu'elle-meme, pour un cout de shadow map nul.
                    c.receiveShadow = true;
                    c.castShadow = false;
                    c.material = new THREE.MeshStandardMaterial({
                        map: this.textures.wood,
                        color: 0x3a2414,
                        roughness: 0.62,   // etait 0.1 : le bois se comportait comme un miroir
                        metalness: 0.0,    // le bois n'est pas un metal
                        roughnessMap: this.textures.wood,
                        envMapIntensity: 0.6
                    });
                    this.tableMeshes.push(c);
                }
            });
            this.scene.add(table);

            const borderGeo = new THREE.BoxGeometry(10.5, 0.1, 7.5);
            const borderMat = new THREE.MeshStandardMaterial({
                color: 0xc5a059,
                metalness: 0.92,
                roughness: 0.34,   // etait 0.1 : chrome pur, sans lecture de la gravure
                map: this.textures.border || null,
                emissive: 0x2a1c06,
                emissiveIntensity: 0.35
            });
            const border = new THREE.Mesh(borderGeo, borderMat);
            border.position.y = 0.05;
            this.scene.add(border);
        });

        // Zen Rocks (Decor)
        this.loader.load('assets/models/zen-rock-stack.glb', (gltf) => {
            const rocks = gltf.scene;
            rocks.position.set(-4.5, -1, -2.5);
            rocks.scale.set(1.4, 1.4, 1.4);
            rocks.traverse(c => { 
                if(c.isMesh) {
                    c.material = new THREE.MeshStandardMaterial({
                        color: 0x141418,
                        roughness: 0.88,   // etait 0.05 : galets chromes
                        metalness: 0.04
                    });
                    c.castShadow = false;
                    c.receiveShadow = true; 
                }
            });
            this.scene.add(rocks);
        });
    }

    createPillars() {
        this.pillarGroup = new THREE.Group();
        this.pillarGroup.position.set(0, 0, -1.2);
        this.scene.add(this.pillarGroup);

        const pillarIds = Object.keys(PILLAR_DEFINITIONS);
        const count = pillarIds.length;
        const spacing = 0.9;
        const totalWidth = (count - 1) * spacing;

        pillarIds.forEach((id, i) => {
            const pillar = PILLAR_DEFINITIONS[id];
            const pGroup = new THREE.Group();
            pGroup.position.set((i * spacing) - (totalWidth / 2), 0, 0);
            
            const color = new THREE.Color(pillar.color);
            
            // Pillar Core (Visualizing the balance)
            const mesh = new THREE.Mesh(
                new THREE.IcosahedronGeometry(0.12, 1), 
                new THREE.MeshStandardMaterial({ 
                    color: color, 
                    emissive: color, 
                    emissiveIntensity: 0.5, 
                    transparent: true, 
                    opacity: 0.8,
                    metalness: 0.9,
                    roughness: 0.1
                })
            );
            mesh.position.y = 0.2;
            pGroup.add(mesh);

            const light = new THREE.PointLight(color, 0.8, 3);
            light.position.y = 0.5;
            pGroup.add(light);

            this.pillarMeshes[id] = mesh;
            this.pillarLights[id] = light;
            this.pillarGroup.add(pGroup);
        });
    }

    createBalance() {
        // Balance (Scale mechanism). Pushed further back and lifted so it stands
        // as a backdrop behind the card play stage, never occluding the cards.
        this.balanceBase = new THREE.Group();
        this.balanceBase.position.set(0, 0.2, -5.5);
        this.balanceBase.scale.setScalar(0.85);
        this.scene.add(this.balanceBase);

        // Vertical pillar for the scale
        const stand = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.1, 3.5),
            new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 1, roughness: 0.2 })
        );
        stand.position.y = 1.75;
        this.balanceBase.add(stand);

        this.balanceBeam = new THREE.Group();
        this.balanceBeam.position.set(0, 3.2, 0);
        this.balanceBase.add(this.balanceBeam);

        // Horizontal beam
        const beam = new THREE.Mesh(
            new THREE.BoxGeometry(5, 0.08, 0.08), 
            new THREE.MeshStandardMaterial({ color: 0xc5a059, metalness: 1, roughness: 0.1 })
        );
        this.balanceBeam.add(beam);
        
        // Pans (Plates)
        const panGeo = new THREE.CylinderGeometry(0.8, 0.7, 0.05, 32);
        const panMat = new THREE.MeshStandardMaterial({ color: 0xc5a059, metalness: 0.8, roughness: 0.2 });
        
        this.leftPan = new THREE.Group();
        this.leftPan.position.x = -2.5;
        this.balanceBeam.add(this.leftPan);
        const leftPlate = new THREE.Mesh(panGeo, panMat);
        leftPlate.position.y = -2;
        this.leftPan.add(leftPlate);

        this.rightPan = new THREE.Group();
        this.rightPan.position.x = 2.5;
        this.balanceBeam.add(this.rightPan);
        const rightPlate = new THREE.Mesh(panGeo, panMat);
        rightPlate.position.y = -2;
        this.rightPan.add(rightPlate);

        // Hanging wires
        const wireMat = new THREE.LineBasicMaterial({ color: 0x888888 });
        const createWires = (parent) => {
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2;
                const points = [
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(Math.cos(angle) * 0.7, -2, Math.sin(angle) * 0.7)
                ];
                const geo = new THREE.BufferGeometry().setFromPoints(points);
                parent.add(new THREE.Line(geo, wireMat));
            }
        };
        createWires(this.leftPan);
        createWires(this.rightPan);
    }

    createDust() {
        const count = 300;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i*3] = (Math.random()-0.5)*12;
            positions[i*3+1] = Math.random()*6;
            positions[i*3+2] = (Math.random()-0.5)*12;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.dust = new THREE.Points(geo, new THREE.PointsMaterial({ 
            color: 0xc5a059, 
            size: 0.03, 
            transparent: true, 
            opacity: 0.2, 
            blending: THREE.AdditiveBlending 
        }));
        this.scene.add(this.dust);
    }

    update(pillars, variance) {
        // Harmony visual feedback
        if (this.harmonyLight) {
            new TWEEN.Tween(this.harmonyLight).to({ intensity: variance < 40 ? 0.4 : 0 }, 1000).start();
        }

        // Update individual pillars
        for (const type in pillars) {
            const val = pillars[type];
            const mesh = this.pillarMeshes[type];
            const light = this.pillarLights[type];
            
            if (mesh) {
                const s = 0.5 + (val / 100) * 1.8;
                new TWEEN.Tween(mesh.scale).to({ x: s, y: s, z: s }, 1000).easing(TWEEN.Easing.Elastic.Out).start();
                new TWEEN.Tween(mesh.position).to({ y: 0.2 + (val / 100) * 0.6 }, 800).start();
                
                // Emissive pulse on change
                new TWEEN.Tween(mesh.material).to({ emissiveIntensity: val < 20 || val > 80 ? 1.5 : 0.5 }, 500).start();
            }
            
            if (light) {
                new TWEEN.Tween(light).to({ intensity: 0.5 + (val / 100) * 1.5 }, 800).start();
            }
        }

        // Calculate balance tilt: split pillars in two halves
        const pillarIds = Object.keys(PILLAR_DEFINITIONS);
        const mid = Math.ceil(pillarIds.length / 2);
        const leftPillars = pillarIds.slice(0, mid);
        const rightPillars = pillarIds.slice(mid);

        const leftWeight = leftPillars.reduce((sum, id) => sum + (pillars[id] || 0), 0);
        const rightWeight = rightPillars.reduce((sum, id) => sum + (pillars[id] || 0), 0);
        
        const weightDiff = (leftWeight / leftPillars.length) - (rightWeight / rightPillars.length);
        const tilt = (weightDiff / 100) * (Math.PI / 8);
        
        new TWEEN.Tween(this.balanceBeam.rotation).to({ z: tilt }, 1500).easing(TWEEN.Easing.Cubic.InOut).start();
        
        // Counter-rotate pans to stay horizontal
        new TWEEN.Tween(this.leftPan.rotation).to({ z: -tilt }, 1500).easing(TWEEN.Easing.Cubic.InOut).start();
        new TWEEN.Tween(this.rightPan.rotation).to({ z: -tilt }, 1500).easing(TWEEN.Easing.Cubic.InOut).start();
        
        return tilt;
    }

    animate(elapsedTime) {
        if (this.dust) {
            this.dust.rotation.y += 0.0003;
            this.dust.position.y += Math.sin(elapsedTime * 0.5) * 0.001;
        }
        
        // Subtle floating animation for pillars
        Object.values(this.pillarMeshes).forEach((m, i) => {
            m.rotation.y += 0.01;
            m.rotation.x += 0.005;
            m.position.y += Math.sin(elapsedTime * 1.5 + i) * 0.0008;
        });
    }

    getCardSlot(index) {
        return this.cardSlots[index] || new THREE.Vector3(0, 1.0, 2.9);
    }

    /** Recale les emplacements graves quand l'ecran tourne. */
    relayoutSlots() {
        if (!this.slotMeshes) return;
        const layout = CardController.layoutFor(window.innerWidth / window.innerHeight);
        this.slotMeshes.forEach(m => { m.position.x = m.userData.baseX * layout.spread; });
    }
}
