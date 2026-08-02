# ÉQUILIBRE DES CHOIX — Sprint 1, rapport de livraison

Base : export Rosebud du 2026-08-02 01:18 — *Fix missing translation function in HomeController callback*.

**Verdict : 21 critères sur 22. Sprint refusé sur un seul point — la lisibilité des cartes.**

---

## Fichiers modifiés (6)

| Fichier | Corrections |
|---|---|
| `game-engine.js` | rotation des modificateurs, panthéon restauré à la reprise, effets complets sur le tour fatal |
| `scene-manager.js` | cadrage adaptatif, suivi des modèles 3D, remontée des erreurs d'assets, emplacements pour n cartes, mode clair, espace colorimétrique de la bordure |
| `main.js` | masquage prématuré de l'écran de chargement, panneau d'info au tap, fermeture après validation, raccourci clavier 4ᵉ carte |
| `index.html` | enregistrement du service worker, icônes, métadonnées iOS, retrait du splash Rosebud, crédits KHALAM |
| `manifest.json` | icônes valides, `scope` |
| `sw.js` | réécrit — `VERSION` v5, 79 entrées, purge des anciens caches, `skipWaiting` |

## Fichiers ajoutés (4)

`assets/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`
Générés à partir du lotus doré existant, centré sur fond noir profond. Aucun motif inventé.

## Fichiers supprimés (8)

- `rosie/README.md`, `rosie/controls/rosieControls.js`, `rosie/controls/rosieMobileControls.js` — bibliothèque Rosebud, zéro référence
- `rosebud-game-defaults.css`, `rosebud-game-defaults.js` — jamais chargés par `index.html`
- `__rosebud/rosebud-icon.png` — logo du splash retiré
- 2 captures d'écran dans `assets/` — 1,2 Mo, référencées nulle part

Projet passé de 6,9 Mo à 5,6 Mo.

## Fichiers INTACTS — bit pour bit

`game-config.js` · `card-controller.js` · `table-controller.js` · `vfx-controller.js`

Aucune carte modifiée : ni valeur, ni titre, ni description, ni illustration, ni dessin, ni taille, ni écartement.

---

## Les 11 bugs corrigés

**1 — Effets spéciaux décalés d'un tour.** La rotation des modificateurs faisait deux crans. Choix supplémentaire, Multiplicateur, Protection et Corruption arrivaient deux tours après la carte.

**2 — Cartes coupées sur téléphone.** Cadrage figé à fov 45°. Demi-largeur visible 1,48 pour un besoin de 2,17 sur iPhone 14. Corrigé **par la caméra seule**, sans toucher aux cartes.

**3 — Écran de chargement masqué trop tôt.** `main.js` le masquait à la fin de `init()`, bien avant le chargement des assets.

**4 — Modèles 3D non suivis.** `GLTFLoader` créé sans le `LoadingManager` : 1,6 Mo de modèles chargés hors de tout contrôle.

**5 — Erreurs d'assets silencieuses.** Aucun `onError` sur le `LoadingManager`. La console nomme désormais chaque fichier en échec.

**6 — Panthéon perdu à la reprise.** Sauvegardé mais jamais relu par `loadState()`. Le joueur perdait badge, capacité et multiplicateurs en appuyant sur Continuer.

**7 — Effets abandonnés au tour fatal.** `applyPillarChange` sortait sur `isGameOver` : trois effets sur quatre étaient perdus, et le résultat dépendait de l'ordre des clés.

**8 — La 4ᵉ carte tombait à l'origine du monde.** Trois emplacements construits pour quatre cartes distribuées. 2,2 % des tours, **19 % des parties**.

**9 — Panneau d'info inaccessible au tap.** Ouvert uniquement au survol. Sur mobile, le joueur sélectionnait une carte sans jamais pouvoir la lire.

**10 — Panneau figé après validation.** Rien ne le refermait sur tactile.

**11 — Service worker jamais enregistré.** `sw.js` existait, aucun `register()` nulle part. Et il ne mettait en cache que 14 fichiers sur 79.

Corrections annexes : installation PWA débloquée, mode clair réversible, bordure dorée en sRGB, raccourci clavier pour la 4ᵉ carte, boucles de relance bornées.

---

## Le critère non validé

**« Les cartes sont lisibles. »**

Hauteur réelle du texte imprimé sur la carte 3D :

| Écran | Titre | Description |
|---|---|---|
| iPhone 14 | 5,0 px | **3,0 px** |
| Pixel 7 | 5,3 px | **3,2 px** |
| iPhone SE | 4,9 px | **2,9 px** |
| iPad portrait | 10,3 px | **6,1 px** |
| Desktop 16:9 | 10,3 px | **6,1 px** |

Seuil de confort : 11 px. Minimum absolu : 8 px. **Aucun appareil ne passe.**

Atténuation apportée : le panneau `#card-info` s'ouvre maintenant au tap et affiche titre, rareté, description et aperçu des effets en texte HTML natif — 17,6 px et 12,8 px sur iPhone. L'information est accessible, mais une carte à la fois : impossible de comparer les trois d'un coup d'œil.

**Correction possible, en attente d'accord :** le canvas des cartes fait 512×768 et n'utilise que 19 px pour la description. La monter à 34 ne changerait ni la taille, ni la position, ni le dessin des cartes — uniquement la hauteur des caractères.

---

## Signalé, non corrigé

- **La balance mesure la mauvaise chose.** Elle oppose Spiritualité + Amour à Santé + Argent. Un état 95 / 5 / 95 / 5 — variance 2025, joueur au bord de la mort — affiche l'équilibre parfait.
- **Mode Méditation sans fin.** `applyPillarChange` désactive volontairement le contrôle de fin de partie. Conforme à la feuille de route, mais une partie ne se termine jamais d'elle-même.
- **Duel simulé.** `duel-controller.js` détecte que l'`appId` InstantDB est un placeholder et bascule sur un adversaire fictif. Le vrai multijoueur demandera un compte InstantDB.
- **Code mort** : `high-score-value` et `vol-voice` lus par `ui-controller.js` sans exister dans le HTML. Sans effet — le record est déjà affiché sous `stat-best-val`, et rien ne joue sur le canal audio `voice`.
- **Crédits** : « Sonic Sanctum » en design sonore, origine inconnue. Copyright indiqué « © 2024 ».

---

## Déploiement

**Le problème des `.webp` sur GitHub n'est pas un bug du code.** Les chemins `assets/…` de cet export ne correspondent pas à ton dépôt, où tous les fichiers sont à plat à la racine. Deux voies :

1. Rétablir l'arborescence sur GitHub (`github.dev` permet de déplacer en masse : touche `.` sur la page du dépôt)
2. Aplatir à nouveau les 198 références dans le code

Ne pas oublier : créer `.nojekyll`, et incrémenter `VERSION` dans `sw.js` à **chaque** dépôt.

---

## Validation

Ces résultats viennent d'un audit de code et de simulations chiffrées — 1 220 284 tours joués sur le moteur réel, géométrie du cadrage calculée sur six formats d'écran, 20 000 parties fuzzées sans une seule exception. **Le jeu n'a pas été exécuté dans un navigateur.** La confirmation finale se fait sur appareil, console ouverte.
