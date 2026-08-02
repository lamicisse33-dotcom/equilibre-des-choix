# TOME 6 — Architecture technique : ÉQUILIBRE DES CHOIX

- **Moteur de Rendu** : Three.js (WebGL) avec modules ESM.
- **Gestion du Temps** : TWEEN.js pour toutes les animations d'interface et de transition.
- **Synchronisation Multijoueur** : InstantDB pour le mode Duel en temps réel.
- **Structure Data-Driven** :
    - `game-config.js` : Source unique de vérité pour les définitions de piliers, raretés et mécaniques.
    - `GameEngine` : Logique pure, découplée du rendu, gérant les probabilités pondérées et les modificateurs de tour.
- **Optimisation Rendu** : Rendu dynamique des cartes sur Canvas 2D converti en `CanvasTexture` pour Three.js, permettant une personnalisation infinie sans surcharge mémoire.
- **Gestion Haptique & VFX** : Système de secousses caméra et flashs plein écran coordonnés par le `VFXController`.
