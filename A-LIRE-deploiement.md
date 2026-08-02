# Dépôt sur GitHub — marche à suivre

Dépôt : `lamicisse33-dotcom/equilibre-des-choix`

---

## ÉTAPE 1 — Supprimer (obligatoire)

Un envoi par-dessus n'efface jamais rien sur GitHub. Ces fichiers doivent être supprimés à la main.

Pour chacun : ouvrir le fichier → icône **corbeille** en haut à droite → **Commit changes**.
Quand le dernier fichier d'un dossier disparaît, GitHub supprime le dossier tout seul.

- [ ] `rosie/controls/rosieControls.js`
- [ ] `rosie/controls/rosieMobileControls.js`
- [ ] `rosie/README.md`
- [ ] `__rosebud/rosebud-icon.png`

À ce stade, les dossiers `rosie/` et `__rosebud/` n'existent plus.

---

## ÉTAPE 2 — Créer le fichier `.nojekyll`

Ne pas essayer de le glisser-déposer : macOS masque les fichiers commençant par un point, il ne partira pas.

Sur GitHub : **Add file** → **Create new file** → nommer le fichier `.nojekyll` → laisser le contenu **vide** → **Commit changes**.

Sans ce fichier, GitHub Pages fait tourner Jekyll, qui ignore silencieusement tout chemin commençant par un tiret bas.

---

## ÉTAPE 3 — Déposer les fichiers

**Add file** → **Upload files**, puis glisser les fichiers ci-dessous. Ils écrasent les anciens.

### À la racine du dépôt (9 fichiers)

| Fichier | Ce qui change |
|---|---|
| `README.md` | remplace la doc Rosie par celle d'ÉQUILIBRE |
| `index.html` | enregistrement du service worker, icônes, métadonnées iOS |
| `manifest.json` | icônes valides, scope, id — débloque l'installation |
| `sw.js` | **VERSION v5**, 70 entrées en précache |
| `game-config.js` | 30 cartes rééquilibrées + les 2 cartes à convergence |
| `game-engine.js` | correction des modificateurs + mécanique de convergence |
| `card-controller.js` | cadrage responsive continu, bandeau CONVERGENCE |
| `scene-manager.js` | cadrage adaptatif, textures sRGB, optimisations |
| `table-controller.js` | matières, cadre extrudé, éclairage |

### Dans `assets/icons/` (4 fichiers)

Ce dossier n'existe pas encore. Le glisser-déposer du dossier `assets/icons` complet le crée automatiquement — il suffit de déposer le dossier plutôt que les fichiers un par un.

- `icon-192.png`
- `icon-512.png`
- `icon-maskable-512.png`
- `apple-touch-icon.png`

---

## ÉTAPE 4 — Optionnel : purger les images inutilisées

Ces 11 fichiers ne sont référencés nulle part (1,1 Mo). Les garder ne casse rien, mais ils alourdissent le dépôt et ne seront pas mis en cache par le service worker.

- `assets/illustration-spirituality.webp`
- `assets/illustration-love.webp`
- `assets/illustration-health.webp`
- `assets/illustration-money.webp`
- `assets/icon-spirituality.webp`
- `assets/icon-love.webp`
- `assets/icon-health.webp`
- `assets/icon-money.webp`
- `assets/card-back-texture.webp`
- `assets/audio/equilibre-heritage-theme.mp3`
- `assets/audio/zen-prestige-ambience-long.mp3`

Attention à ne pas confondre : `card-back-texture-v2.webp` et `icon-pillar-*-minimal.webp` sont **utilisés**, il faut les garder.

---

## Vérification après déploiement

1. La page d'accueil du dépôt affiche **ÉQUILIBRE DES CHOIX**, plus *Rosie Component Library*.
2. Sur le site, ouvrir la console : aucune erreur 404.
3. Sur téléphone, **les trois cartes tiennent entièrement dans l'écran** — c'était le bug de cadrage.
4. Chrome propose **« Installer l'application »** (il la refusait à cause des icônes invalides).
5. Mode avion après une première visite : le jeu se lance quand même.

---

## Rappel pour les prochaines livraisons

Incrémenter `VERSION` dans `sw.js` à **chaque** dépôt. Sinon les navigateurs continuent de servir la version en cache et tes corrections restent invisibles.
