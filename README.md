# ÉQUILIBRE DES CHOIX

**Chaque décision a des conséquences.*jeu 
*

Jeu de cartes stratégique en 3D. Le joueur construit la meilleure vie possible en maintenant l'équilibre entre quatre piliers de l'existence : **Spiritualité**, **Amour**, **Santé** et **Argent**.

À chaque tour, trois cartes sont proposées. Chacune apporte un avantage et un sacrifice — il n'existe aucune carte parfaite. Les quatre piliers évoluent sur une échelle de 0 à 100 ; dès que l'un d'eux touche une borne, la partie s'arrête. Le score final récompense la faible dispersion entre les quatre valeurs : l'équilibre, pas l'excès.

Un projet **KHALAM**.

---

## Jouer

Application web installable (PWA). Fonctionne hors connexion après la première visite, sur Android, iPhone, tablette et ordinateur.

## Architecture

Application modulaire en JavaScript natif (modules ES), rendu **Three.js**. Aucune étape de build : les fichiers sont servis tels quels.

| Module | Rôle |
|---|---|
| `main.js` | Orchestration générale, boucle de partie |
| `game-engine.js` | Logique pure : piliers, score, tirage, mécaniques |
| `game-config.js` | Données : cartes, raretés, événements, trophées, héritage |
| `scene-manager.js` | Scène Three.js, caméra, cadrage adaptatif |
| `table-controller.js` | Table de jeu, piliers 3D, balance, éclairage |
| `card-controller.js` | Génération et animation des cartes |
| `vfx-controller.js` | Effets visuels et cinématiques |
| `ui-controller.js` | Interface HTML, panneaux, réglages |
| `audio-controller.js` | Musique et effets sonores |
| `home-controller.js` | Écran d'accueil |
| `persistence-controller.js` | Sauvegarde locale, statistiques, héritage |
| `config-controller.js` | Options et localisation |
| `narrative-controller.js` | Événements narratifs |
| `transition-controller.js` | Transitions entre écrans |
| `duel-controller.js` | Mode Duel (synchronisation temps réel) |

Le moteur (`game-engine.js`) ne dépend d'aucun module de rendu : il est testable et simulable isolément.

## Structure du dépôt

```
index.html          point d'entrée
manifest.json       manifeste PWA
sw.js               service worker (cache hors ligne)
*.js                modules de jeu
assets/             images, sons, modèles 3D, icônes
AGENTS.md           bible du projet (vision, gameplay, direction artistique)
tome_*.md           documentation détaillée par domaine
```

## Documentation

La conception est consignée dans les **Archives du Sanctuaire** — voir [`AGENTS.md`](./AGENTS.md) pour le sommaire complet : vision, gameplay, interface, direction artistique et sonore, architecture, bible des cartes, univers, progression.

## Déploiement

Le dépôt est servi directement par GitHub Pages depuis la branche principale. Le fichier `.nojekyll` désactive le traitement Jekyll, qui ignorerait sinon les chemins commençant par un tiret bas.

À chaque livraison, incrémenter `VERSION` dans `sw.js` — sans quoi les navigateurs continueront de servir la version en cache.

## Lois du projet

- Ne jamais modifier le principe des quatre piliers.
- Aucun choix n'est neutre ; aucune carte n'est parfaite.
- L'équilibre prime sur l'excès.
- La stabilité, la fluidité et la lisibilité passent avant les effets.
