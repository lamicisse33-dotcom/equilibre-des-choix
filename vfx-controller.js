import * as THREE from 'three';
import TWEEN from 'three/addons/libs/tween.module.js';

export class VFXController {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.particles = null;
        this.harmonyAura = null;
        this.screenShakeEnabled = true;
        
        this.init();
    }

    init() {
        this.createEnhancedDust();
        this.createHarmonyAura();
    }

    createEnhancedDust() {
        const count = 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 15;
            positions[i * 3 + 1] = Math.random() * 8;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
            sizes[i] = Math.random() * 0.05 + 0.01;
            velocities.push({
                y: Math.random() * 0.002 + 0.001,
                x: (Math.random() - 0.5) * 0.001,
                z: (Math.random() - 0.5) * 0.001
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            color: 0xc5a059,
            size: 0.04,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.particles.userData.velocities = velocities;
        this.scene.add(this.particles);
    }

    createHarmonyAura() {
        // A global subtle volumetric-like glow
        const geo = new THREE.SphereGeometry(10, 32, 32);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xc5a059,
            transparent: true,
            opacity: 0,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        this.harmonyAura = new THREE.Mesh(geo, mat);
        this.scene.add(this.harmonyAura);
    }

    triggerHarmonyEffect(active) {
        new TWEEN.Tween(this.harmonyAura.material)
            .to({ opacity: active ? 0.08 : 0 }, 2000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();

        if (active) {
            this.burstParticles(0xffd700, new THREE.Vector3(0, 2, 0));
        }
    }

    triggerCelestialFlash() {
        // Full screen flash for Mythic cards
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = '#ffffff';
        overlay.style.zIndex = '9999';
        overlay.style.pointerEvents = 'none';
        overlay.style.opacity = '0';
        document.body.appendChild(overlay);

        new TWEEN.Tween({ opacity: 0 })
            .to({ opacity: 0.8 }, 100)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate((obj) => {
                overlay.style.opacity = obj.opacity;
            })
            .onComplete(() => {
                new TWEEN.Tween({ opacity: 0.8 })
                    .to({ opacity: 0 }, 1000)
                    .easing(TWEEN.Easing.Quadratic.In)
                    .onUpdate((obj) => {
                        overlay.style.opacity = obj.opacity;
                    })
                    .onComplete(() => {
                        document.body.removeChild(overlay);
                    })
                    .start();
            })
            .start();
        
        // Massive burst
        this.burstParticles(0x3498db, new THREE.Vector3(0, 3, 0), 150);
        this.burstParticles(0xffffff, new THREE.Vector3(0, 3, 0), 100);
    }

    triggerCardPlayVFX(position, color = 0xffffff) {
        // Create a temporary glowing halo
        const haloGeo = new THREE.RingGeometry(0.6, 0.7, 32);
        const haloMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.copy(position);
        halo.rotation.x = -Math.PI * 0.5;
        this.scene.add(halo);

        // Animate halo scaling up and fading out
        new TWEEN.Tween(halo.scale)
            .to({ x: 2.5, y: 2.5, z: 2.5 }, 600)
            .easing(TWEEN.Easing.Cubic.Out)
            .start();

        new TWEEN.Tween(halo.material)
            .to({ opacity: 0 }, 600)
            .easing(TWEEN.Easing.Cubic.In)
            .onComplete(() => {
                this.scene.remove(halo);
                haloGeo.dispose();
                haloMat.dispose();
            })
            .start();

        // Also a small particle burst
        this.burstParticles(color, position, 20);
    }

    triggerPillarPulse(category, amount) {
        const colors = {
            spirituality: 0x4f46e5,
            love: 0xe11d48,
            health: 0x10b981,
            money: 0xf59e0b
        };
        
        // Spawn a burst near the category area (index mapping)
        const categories = ['spirituality', 'love', 'health', 'money'];
        const idx = categories.indexOf(category);
        if (idx === -1) return;
        
        const spawnPos = new THREE.Vector3((idx - 1.5) * 0.9, 0.5, -1.2);
        this.burstParticles(colors[category] || 0xffffff, spawnPos, Math.abs(amount) > 10 ? 30 : 15);
    }

    burstParticles(color, position, count = 50) {
        // Temporary burst of particles
        const burstCount = count;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(burstCount * 3);
        
        for (let i = 0; i < burstCount; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.08,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 1
        });
        
        const burst = new THREE.Points(geometry, material);
        this.scene.add(burst);
        
        const vels = [];
        for (let i = 0; i < burstCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const speed = Math.random() * 0.05 + 0.02;
            vels.push({
                x: Math.sin(phi) * Math.cos(angle) * speed,
                y: Math.cos(phi) * speed,
                z: Math.sin(phi) * Math.sin(angle) * speed
            });
        }
        
        const startTime = performance.now();
        const animateBurst = (time) => {
            const elapsed = time - startTime;
            if (elapsed > 1500) {
                this.scene.remove(burst);
                geometry.dispose();
                material.dispose();
                return;
            }
            
            const pos = burst.geometry.attributes.position.array;
            for (let i = 0; i < burstCount; i++) {
                pos[i * 3] += vels[i].x;
                pos[i * 3 + 1] += vels[i].y;
                pos[i * 3 + 2] += vels[i].z;
                vels[i].y += 0.0005; // float up instead of gravity
            }
            burst.geometry.attributes.position.needsUpdate = true;
            material.opacity = 1 - (elapsed / 1500);
            
            requestAnimationFrame(animateBurst);
        };
        
        requestAnimationFrame(animateBurst);
    }

    // Fixed, reliable play framing. The camera sits above and in front of the
    // play mat, angled down so the three cards lying at (y≈1.0, z≈2.9) fill the
    // centre of the screen, fully visible and readable, with the table and
    // balance reading as an elegant backdrop behind them.
    static PLAY_POS = { x: 0, y: 4.6, z: 8.9 };
    static PLAY_LOOK = { x: 0, y: 0.4, z: 2.4 };

    playCameraIntro(callback) {
        // Start from a wide cinematic angle above the sanctuary.
        this.camera.position.set(0, 9, 16);

        // Animate the look target alongside the position so the camera glides
        // down and settles framing the play stage, never drifting off it.
        this.lookTarget = new THREE.Vector3(0, 1.5, 0);
        this.camera.lookAt(this.lookTarget);

        const targetLook = { ...VFXController.PLAY_LOOK };

        new TWEEN.Tween(this.lookTarget)
            .to(targetLook, 2600)
            .easing(TWEEN.Easing.Quintic.InOut)
            .start();

        new TWEEN.Tween(this.camera.position)
            .to({ ...VFXController.PLAY_POS }, 2600)
            .easing(TWEEN.Easing.Quintic.InOut)
            .onUpdate(() => {
                this.camera.lookAt(this.lookTarget);
            })
            .onComplete(() => {
                // Lock the stable play orientation; card row is now centered.
                this.lookTarget.set(targetLook.x, targetLook.y, targetLook.z);
                this.camera.lookAt(this.lookTarget);
                if (callback) callback();
            })
            .start();
    }

    shakeCamera(intensity = 0.1, duration = 500) {
        if (!this.screenShakeEnabled) return;
        const startPos = this.camera.position.clone();
        const shake = { t: 0 };
        
        new TWEEN.Tween(shake)
            .to({ t: 1 }, duration)
            .onUpdate(() => {
                this.camera.position.x = startPos.x + (Math.random() - 0.5) * intensity;
                this.camera.position.y = startPos.y + (Math.random() - 0.5) * intensity;
            })
            .onComplete(() => {
                this.camera.position.copy(startPos);
            })
            .easing(TWEEN.Easing.Elastic.Out)
            .start();
    }

    update(elapsedTime) {
        // Particle motion
        if (this.particles) {
            const positions = this.particles.geometry.attributes.position.array;
            const vels = this.particles.userData.velocities;

            for (let i = 0; i < vels.length; i++) {
                positions[i * 3 + 1] += vels[i].y;
                positions[i * 3] += vels[i].x;
                positions[i * 3 + 2] += vels[i].z;

                // Reset particles that float too high
                if (positions[i * 3 + 1] > 8) {
                    positions[i * 3 + 1] = 0;
                }
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
            this.particles.rotation.y += 0.0005;
        }

        // Subtle camera breathing. Re-apply the locked look target every frame
        // so the tiny positional drift never rotates the camera away from the
        // card row (otherwise the cards slowly slide out of frame).
        this.camera.position.y += Math.sin(elapsedTime * 0.5) * 0.0005;
        this.camera.position.x += Math.cos(elapsedTime * 0.3) * 0.0005;
        if (this.lookTarget) {
            this.camera.lookAt(this.lookTarget);
        }
    }
}
