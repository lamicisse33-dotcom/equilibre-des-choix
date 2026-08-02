# TOME 14 — DIRECTION TECHNIQUE : ÉQUILIBRE DES CHOIX

- **Structure Complète du Projet**
    - **Architecture Modulaire (ESM)** : Utilisation exclusive de modules JavaScript natifs pour une gestion claire des dépendances sans étape de compilation.
    - **Modèle-Vue-Contrôleur (MVC)** :
        - **Modèle** : `game-engine.js` (Logique de jeu pure).
        - **Vue** : `scene-manager.js` (Three.js), `ui-controller.js` (DOM).
        - **Contrôleur** : `main.js` (Orchestration globale).

- **Organisation des Fichiers**
    - `/assets/` : Médias (images, audio, modèles 3D).
    - `game-config.js` : Source unique de vérité pour les données et constantes.
    - `*-controller.js` : Modules spécialisés (Audio, Duel, Narrative, etc.).
    - `persistence-controller.js` : Gestion de l'état local et des statistiques.

- **Sauvegardes (Persistence)**
    - **LocalStorage** : Sauvegarde asynchrone de l'état du cycle en cours à chaque tour.
    - **Persistence Robuste** : Séparation des statistiques globales (Héritage) et de la progression de la partie actuelle.
    - **Auto-Sync** : Sauvegarde automatique lors de la perte de focus ou de la fermeture de l'onglet.

- **PWA (Progressive Web App)**
    - **Service Worker (`sw.js`)** : Gestion du cache pour permettre le jeu hors-ligne.
    - **Manifest (`manifest.json`)** : Configuration pour l'installation sur mobile (icônes, couleurs de thème, mode standalone).

- **Performances**
    - **Optimisation WebGL** : Réutilisation des géométries et matériaux dans Three.js. Gestion dynamique de la résolution pour les appareils mobiles.
    - **Rendu Card-Canvas** : Utilisation d'un seul canvas source pour générer les textures de cartes, minimisant la consommation mémoire GPU.
    - **Lazy Loading** : Chargement asynchrone des configurations et des données de duel pour un démarrage instantané.

- **Sécurité**
    - **Intégrité des Données** : Validation des schémas de données lors du chargement des sauvegardes.
    - **Communication Duel** : Sécurisation des échanges via InstantDB avec des règles d'accès strictes.
    - **Sanitisation DOM** : Génération sécurisée de l'interface dynamique pour prévenir les injections.
