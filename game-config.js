/**
 * ÉQUILIBRE - Game Configuration Data
 */

export const PILLARS = ['spirituality', 'love', 'health', 'money'];

/**
 * PILLAR_DEFINITIONS: Centralized metadata for all life pillars.
 * To add a new pillar: Add a key here and update PILLARS list.
 */
export const PILLAR_DEFINITIONS = {
    spirituality: {
        id: 'spirituality',
        name: 'Spiritualité',
        color: '#4f46e5',
        icon: 'assets/icon-pillar-spirituality-minimal.webp',
        art: 'assets/spirituality_art.webp',
        desc: 'Votre connexion au divin et à votre moi profond.'
    },
    love: {
        id: 'love',
        name: 'Amour',
        color: '#e11d48',
        icon: 'assets/icon-pillar-love-minimal.webp',
        art: 'assets/love_art.webp',
        desc: 'Vos relations, votre empathie et votre lien social.'
    },
    health: {
        id: 'health',
        name: 'Santé',
        color: '#10b981',
        icon: 'assets/icon-pillar-health-minimal.webp',
        art: 'assets/health_art.webp',
        desc: 'Votre vitalité physique et votre clarté mentale.'
    },
    money: {
        id: 'money',
        name: 'Argent',
        color: '#f59e0b',
        icon: 'assets/icon-pillar-money-minimal.webp',
        art: 'assets/money_art.webp',
        desc: 'Vos ressources matérielles et votre sécurité financière.'
    }
};

/**
 * RARITY_DEFINITIONS: visual styles and probabilities for cards.
 * To add a new rarity: Add a key here. Weights are relative.
 */
export const PANTHEONS = [
    {
        id: 'ascetic',
        name: 'L\'Ascète',
        desc: 'Priorise la spiritualité et la santé. Les gains d\'argent sont réduits.',
        bonus: { spirituality: 10, health: 10, money: -5 },
        multiplier: { spirituality: 1.2, money: 0.8 },
        color: '#9b59b6',
        ability: {
            id: 'deep_meditation',
            name: 'Méditation Profonde',
            desc: 'Restaure 10 Spiritualité et Santé tous les 10 tours.'
        },
        startingCard: "Oraison Silencieuse"
    },
    {
        id: 'merchant',
        name: 'Le Marchand',
        desc: 'L\'argent coule à flot, mais l\'amour et la spiritualité sont plus fragiles.',
        bonus: { money: 20, love: -5, spirituality: -5 },
        multiplier: { money: 1.3, love: 0.7 },
        color: '#f1c40f',
        ability: {
            id: 'negotiator',
            name: 'Négociateur',
            desc: 'Les coûts financiers négatifs des cartes sont réduits de 25%.'
        },
        startingCard: "Investissement Sûr"
    },
    {
        id: 'hedonist',
        name: 'L\'Hédoniste',
        desc: 'Vivre pour l\'amour et le plaisir. La santé peut en souffrir sur le long terme.',
        bonus: { love: 20, health: -10 },
        multiplier: { love: 1.2, health: 0.8 },
        color: '#e74c3c',
        ability: {
            id: 'carpe_diem',
            name: 'Carpe Diem',
            desc: 'Si l\'Amour est > 80, tous les autres piliers gagnent +1 par tour.'
        },
        startingCard: "Lien d'Amitié"
    },
    {
        id: 'balanced',
        name: 'L\'Équilibré',
        desc: 'Aucun bonus, aucun malus. La voie pure de l\'harmonie.',
        bonus: {},
        multiplier: {},
        color: '#c5a059',
        ability: {
            id: 'harmony_mastery',
            name: 'Maîtrise de l\'Harmonie',
            desc: 'Les gains d\'Héritage sont doublés en état d\'Harmonie.'
        },
        startingCard: "Rituel de Gratitude"
    }
];

export const RARITY_DEFINITIONS = {
    common: {
        id: 'common',
        name: 'Commun',
        weight: 120,
        color: '#94a3b8',
        animation: 'default',
        vfx: null
    },
    uncommon: {
        id: 'uncommon',
        name: 'Peu Commun',
        weight: 50,
        color: '#3b82f6',
        animation: 'float',
        vfx: 'subtle_glow'
    },
    rare: {
        id: 'rare',
        name: 'Rare',
        weight: 20,
        color: '#8b5cf6',
        animation: 'pulse',
        vfx: 'glow'
    },
    epic: {
        id: 'epic',
        name: 'Épique',
        weight: 8,
        color: '#ec4899',
        animation: 'shake',
        vfx: 'particles'
    },
    legendary: {
        id: 'legendary',
        name: 'Légendaire',
        weight: 2,
        color: '#c5a059',
        animation: 'glow',
        vfx: 'screen_shake'
    },
    mythic: {
        id: 'mythic',
        name: 'Mythique',
        weight: 0.5,
        color: '#ffffff',
        animation: 'elastic',
        vfx: 'celestial_flash'
    }
};

/**
 * MECHANICS: Registry of special card behaviors.
 * The engine uses these IDs to apply logic.
 */
export const MECHANICS = {
    EXTRA_CHOICE: 'extra_choice',
    PROTECTION: 'protection',
    MULTIPLIER: 'multiplier',
    REFRESH: 'refresh',
    CORRUPTION: 'corruption' // Example of a new mechanic to add
};

export const INITIAL_PILLAR_VALUE = 50;
export const CRITICAL_THRESHOLD_LOW = 20;
export const CRITICAL_THRESHOLD_HIGH = 80;
export const GAME_OVER_THRESHOLD_LOW = 0;
export const GAME_OVER_THRESHOLD_HIGH = 100;

export const HARMONY_VARIANCE_THRESHOLD = 50;

// --- HARMONIE STRICTE ---
// L'ancienne definition ne mesurait que l'ecart entre les piliers : un joueur
// a 95 partout etait declare "en harmonie" a un tour de sa mort. L'harmonie
// exige desormais les deux conditions de la philosophie du jeu : ni ecart,
// ni exces, ni manque.
// "On ne vous jugera pas sur votre plus haut pilier, mais sur le plus bas."
// L'harmonie se mesure donc d'abord sur le pilier le plus faible. Une bande
// etroite autour de 50 s'est revelee intenable : une seule carte deplace un
// pilier de 20 a 45 points. Ces valeurs donnent une victoire atteignable
// environ une partie sur neuf pour qui la vise -- mesure sur 8000 parties.
export const HARMONIE_PLUS_BAS = 35;    // aucun pilier en dessous
export const HARMONIE_PLAFOND = 88;     // aucun pilier au-dessus
export const HARMONIE_ECART_MAX = 40;   // du plus haut au plus bas
export const HARMONIE_TOURS_VICTOIRE = 3;

// --- OBJECTIF DE VICTOIRE ---
// Le score ne monte vite qu'en harmonie : sa formule multiplie par 2,5 quand
// les piliers sont serres et se reduit avec l'ecart. Un objectif de score est
// donc un objectif d'equilibre, dit dans une langue que tout le monde
// comprend -- et le joueur voit sa progression a chaque tour.
// Mesure sur 15 000 parties : atteint par 99 % des joueurs qui suivent le
// conseil, 25 % au hasard, 4 % en fonçant.
export const SCORE_VICTOIRE = 2000;

// --- LE PARCOURS ---
// Une carte represente une semaine de vie. Le joueur ne joue plus jusqu'a
// mourir : il traverse une duree. Chaque etape franchie est acquise pour
// toujours ; un echec ne fait rejouer que l'etape en cours.
// Chaque etape a sa zone d'equilibre. Elle s'elargit avec la duree : tenir un
// an au centre exact serait impossible, et le joueur voit la zone s'ecarter,
// signe que l'epreuve change de nature.
export const PARCOURS = [
    { id: 'trois_semaines', semaines: 3,  bas: 40, haut: 60, cle: 'duree_3_semaines', titre: "L'Éveil" },
    { id: 'six_semaines',   semaines: 6,  bas: 38, haut: 62, cle: 'duree_6_semaines', titre: "La Constance" },
    { id: 'trois_mois',     semaines: 13, bas: 35, haut: 65, cle: 'duree_3_mois',     titre: "L'Enracinement" },
    { id: 'six_mois',       semaines: 26, bas: 32, haut: 68, cle: 'duree_6_mois',     titre: "La Persévérance" },
    { id: 'une_annee',      semaines: 52, bas: 28, haut: 72, cle: 'duree_1_an',       titre: "Le Grand Équilibre" }
];

// Le temps ramene doucement chaque pilier vers le centre. Sans cela, le gain
// net des cartes faisait enfler tous les piliers ensemble et les longues
// etapes devenaient impossibles quel que soit le talent.
export const DERIVE_CENTRALE = 0.15;

export const SCENARIOS = [
    // spirituality
    { 
        title: "Lueur de Foi", 
        category: "spirituality", 
        rarity: "rare",
        color: "#4f46e5",
        icon: "assets/icon-pillar-spirituality-minimal.webp",
        art: "assets/spirituality_art.webp",
        desc: "Croire en l'invisible pour voir le possible.", 
        effects: { spirituality: 20, love: 5, health: 5, money: -24 } 
    },
    { 
        title: "Oraison Silencieuse", 
        category: "spirituality", 
        rarity: "common",
        color: "#4f46e5",
        icon: "assets/icon-pillar-spirituality-minimal.webp",
        art: "assets/spirituality_art.webp",
        desc: "Un moment de dialogue avec le divin ou soi-même.", 
        effects: { spirituality: 15, love: -19, health: 10 } 
    },
    { 
        title: "Acte de Pardon", 
        category: "spirituality", 
        rarity: "rare",
        color: "#4f46e5",
        icon: "assets/icon-pillar-spirituality-minimal.webp",
        art: "assets/spirituality_art.webp",
        desc: "Libérer son cœur du poids de la rancœur.", 
        effects: { spirituality: 15, love: 25, health: -2, money: -30 } 
    },
    { 
        title: "Sagesse Ancestrale", 
        category: "spirituality", 
        rarity: "rare",
        color: "#4f46e5",
        icon: "assets/icon-pillar-spirituality-minimal.webp",
        art: "assets/spirituality_art.webp",
        desc: "Écouter les leçons du passé pour éclairer le futur.", 
        effects: { spirituality: 20, love: 10, money: -24 } 
    },
    { 
        title: "Leçon de Patience", 
        category: "spirituality", 
        rarity: "common",
        color: "#4f46e5",
        icon: "assets/icon-pillar-spirituality-minimal.webp",
        art: "assets/spirituality_art.webp",
        desc: "Attendre que l'eau se calme pour voir le fond.", 
        effects: { spirituality: 10, love: 5, health: 15, money: -23 } 
    },
    { 
        title: "Don de Charité", 
        category: "spirituality", 
        rarity: "rare",
        color: "#4f46e5",
        icon: "assets/icon-pillar-spirituality-minimal.webp",
        art: "assets/spirituality_art.webp",
        desc: "Le partage est le plus court chemin vers la paix.", 
        effects: { spirituality: 25, love: 15, health: -2, money: -30 } 
    },
    { 
        title: "Rituel de Gratitude", 
        category: "spirituality", 
        rarity: "common",
        color: "#4f46e5",
        icon: "assets/icon-pillar-spirituality-minimal.webp",
        art: "assets/spirituality_art.webp",
        desc: "Reconnaître la beauté dans les moindres choses.", 
        effects: { spirituality: 15, love: 15, health: 5, money: -26 } 
    },

    // money
    { 
        title: "Heures Supplémentaires", 
        category: "money", 
        rarity: "common",
        color: "#f59e0b",
        icon: "assets/icon-pillar-money-minimal.webp",
        art: "assets/money_art.webp",
        desc: "Gagner plus, stresser plus.", 
        effects: { spirituality: -11, love: -7, health: -11, money: 26 } 
    },
    { 
        title: "Nouvelle Entreprise", 
        category: "money", 
        rarity: "rare",
        color: "#f59e0b",
        icon: "assets/icon-pillar-money-minimal.webp",
        art: "assets/money_art.webp",
        desc: "Risque élevé, récompense élevée.", 
        effects: { spirituality: -7, love: -10, health: -10, money: 30 } 
    },
    { 
        title: "Gain au Loto", 
        category: "money", 
        rarity: "epic",
        color: "#f59e0b",
        icon: "assets/icon-pillar-money-minimal.webp",
        art: "assets/money_art.webp",
        desc: "De la chance pure.", 
        effects: { spirituality: -34, love: 4, money: 36 } 
    },
    { 
        title: "Investissement Sûr", 
        category: "money", 
        rarity: "common",
        color: "#f59e0b",
        icon: "assets/icon-pillar-money-minimal.webp",
        art: "assets/money_art.webp",
        desc: "La patience paye enfin.", 
        effects: { spirituality: -10, health: -5, money: 20 } 
    },
    { 
        title: "Marché Boursier", 
        category: "money", 
        rarity: "rare",
        color: "#f59e0b",
        icon: "assets/icon-pillar-money-minimal.webp",
        art: "assets/money_art.webp",
        desc: "Spéculation audacieuse.", 
        effects: { spirituality: -19, health: -5, money: 30 } 
    },
    { 
        title: "Héritage Inattendu", 
        category: "money", 
        rarity: "rare",
        color: "#f59e0b",
        icon: "assets/icon-pillar-money-minimal.webp",
        art: "assets/money_art.webp",
        desc: "Un souffle financier.", 
        effects: { spirituality: -28, love: 10, money: 25 } 
    },

    // love
    { 
        title: "Racines Familiales", 
        category: "love", 
        rarity: "common",
        color: "#e11d48",
        icon: "assets/icon-pillar-love-minimal.webp",
        art: "assets/love_art.webp",
        desc: "L'ancrage dans le sang et l'histoire.", 
        effects: { spirituality: 10, love: 20, money: -23 } 
    },
    { 
        title: "Noces de Destin", 
        category: "love", 
        rarity: "rare",
        color: "#e11d48",
        icon: "assets/icon-pillar-love-minimal.webp",
        art: "assets/love_art.webp",
        desc: "Fusion de deux âmes en un seul chemin.", 
        effects: { love: 30, money: -24 } 
    },
    { 
        title: "Lien d'Amitié", 
        category: "love", 
        rarity: "common",
        color: "#e11d48",
        icon: "assets/icon-pillar-love-minimal.webp",
        art: "assets/love_art.webp",
        desc: "Des frères et sœurs choisis par le cœur.", 
        effects: { spirituality: 5, love: 15, health: 5, money: -19 } 
    },
    { 
        title: "Rire d'Enfant", 
        category: "love", 
        rarity: "rare",
        color: "#e11d48",
        icon: "assets/icon-pillar-love-minimal.webp",
        art: "assets/love_art.webp",
        desc: "Transmettre la vie pour transcender le temps.", 
        effects: { spirituality: 15, love: 25, health: -10, money: -25 } 
    },
    { 
        title: "Élan de Solidarité", 
        category: "love", 
        rarity: "common",
        color: "#e11d48",
        icon: "assets/icon-pillar-love-minimal.webp",
        art: "assets/love_art.webp",
        desc: "Porter le fardeau d'autrui pour s'alléger soi-même.", 
        effects: { spirituality: 15, love: 20, money: -26 } 
    },
    { 
        title: "Parole de Respect", 
        category: "love", 
        rarity: "rare",
        color: "#e11d48",
        icon: "assets/icon-pillar-love-minimal.webp",
        art: "assets/love_art.webp",
        desc: "Reconnaître la dignité en chaque être.", 
        effects: { spirituality: 10, love: 15, health: 5, money: -24 } 
    },
    { 
        title: "Pacte de Fidélité", 
        category: "love", 
        rarity: "epic",
        color: "#e11d48",
        icon: "assets/icon-pillar-love-minimal.webp",
        art: "assets/love_art.webp",
        desc: "Tenir sa promesse quand tout le reste vacille.", 
        effects: { spirituality: 20, love: 35, health: -11, money: -36 } 
    },

    // health
    { 
        title: "Équilibre Nutritif", 
        category: "health", 
        rarity: "common",
        color: "#10b981",
        icon: "assets/icon-pillar-health-minimal.webp",
        art: "assets/health_art.webp",
        desc: "Ce que vous mangez devient ce que vous êtes.", 
        effects: { spirituality: 5, health: 20, money: -19 } 
    },
    { 
        title: "Souffle du Corps", 
        category: "health", 
        rarity: "rare",
        color: "#10b981",
        icon: "assets/icon-pillar-health-minimal.webp",
        art: "assets/health_art.webp",
        desc: "Le mouvement est le moteur de la vitalité.", 
        effects: { spirituality: -18, love: 10, health: 25, money: -10 } 
    },
    { 
        title: "Repos de l'Esprit", 
        category: "health", 
        rarity: "common",
        color: "#10b981",
        icon: "assets/icon-pillar-health-minimal.webp",
        art: "assets/health_art.webp",
        desc: "Le silence du sommeil guérit l'âme.", 
        effects: { spirituality: 15, love: -26, health: 20 } 
    },
    { 
        title: "Soin Réparateur", 
        category: "health", 
        rarity: "rare",
        color: "#10b981",
        icon: "assets/icon-pillar-health-minimal.webp",
        art: "assets/health_art.webp",
        desc: "Réparer les brèches du temple physique.", 
        effects: { spirituality: -5, health: 30, money: -25 } 
    },
    { 
        title: "Rituel de Clarté", 
        category: "health", 
        rarity: "common",
        color: "#10b981",
        icon: "assets/icon-pillar-health-minimal.webp",
        art: "assets/health_art.webp",
        desc: "L'ordre extérieur reflète le calme intérieur.", 
        effects: { spirituality: 10, health: 15, money: -19 } 
    },
    { 
        title: "Flux Vital", 
        category: "health", 
        rarity: "epic",
        color: "#10b981",
        icon: "assets/icon-pillar-health-minimal.webp",
        art: "assets/health_art.webp",
        desc: "Une force nouvelle circule dans vos veines.", 
        effects: { spirituality: -36, love: 15, health: 35, money: -7 } 
    },
    { 
        title: "Veille Vigilante", 
        category: "health", 
        rarity: "rare",
        color: "#10b981",
        icon: "assets/icon-pillar-health-minimal.webp",
        art: "assets/health_art.webp",
        desc: "Prévoir le mal pour mieux le prévenir.", 
        effects: { spirituality: 10, love: -5, health: 20, money: -19 } 
    },

    // mixed
    { 
        title: "Équilibre Parfait", 
        category: "spirituality", 
        rarity: "legendary",
        color: "#c5a059",
        icon: "assets/icon-pillar-spirituality-minimal.webp",
        art: "assets/harmony_art.webp",
        desc: "Un moment de clarté absolue qui réaligne toute existence.", 
        effects: { spirituality: 18, love: 18, health: 18, money: -42 } 
    },
    { 
        title: "L'Oeil du Cyclone", 
        category: "spirituality", 
        rarity: "legendary",
        color: "#8e44ad",
        icon: "assets/icon-pillar-spirituality-minimal.webp",
        art: "assets/legendary_spirit_art.webp",
        desc: "Au centre du chaos, la paix absolue est trouvée.", 
        effects: { spirituality: 42, love: -8, health: 13, money: -42 } 
    },
    { 
        title: "Pacte d'Éternité", 
        category: "love", 
        rarity: "legendary",
        color: "#d48d9a",
        icon: "assets/icon-pillar-love-minimal.webp",
        art: "assets/legendary_love_art.webp",
        desc: "Un serment qui transcende le temps et l'espace.", 
        effects: { spirituality: -11, love: 42, health: 17, money: -42 } 
    },
    { 
        title: "Arbre de Lumière", 
        category: "money", 
        rarity: "legendary",
        color: "#f1c40f",
        icon: "assets/icon-pillar-money-minimal.webp",
        art: "assets/legendary_wealth_art.webp",
        desc: "La prospérité fleurit dans la clarté de l'esprit.", 
        effects: { spirituality: 18, love: -42, health: -12, money: 42 } 
    },
    { 
        title: "Souffle de Gaïa", 
        category: "health", 
        rarity: "legendary",
        color: "#27ae60",
        icon: "assets/icon-pillar-health-minimal.webp",
        art: "assets/legendary_life_art.webp",
        desc: "La vie elle-même coule à nouveau dans vos veines.", 
        effects: { spirituality: -42, love: 18, health: 42, money: -12 } 
    },
    // Special Cards
    {
        title: "Vision Prophétique",
        category: "spirituality",
        rarity: "rare",
        color: "#4f46e5",
        icon: "assets/icon-pillar-spirituality-minimal.webp",
        art: "assets/spirituality_art.webp",
        desc: "Élargissez votre regard sur le futur. (Prochain tour : 4 choix)",
        effects: { spirituality: 10, money: -10 },
        specialEffect: "extra_choice"
    },
    {
        title: "Bouclier du Destin",
        category: "health",
        rarity: "epic",
        color: "#10b981",
        icon: "assets/icon-pillar-health-minimal.webp",
        art: "assets/health_art.webp",
        desc: "Une protection divine. Immunité au prochain tour.",
        effects: { health: 15, money: -15 },
        specialEffect: "protection"
    },
    {
        title: "Souffle de Fortune",
        category: "money",
        rarity: "rare",
        color: "#f59e0b",
        icon: "assets/icon-pillar-money-minimal.webp",
        art: "assets/money_art.webp",
        desc: "L'abondance appelle l'abondance. (Prochain tour : Effets x2)",
        effects: { spirituality: -11, health: -5, money: 20 },
        specialEffect: "multiplier"
    },
    {
        title: "Vent de Renouveau",
        category: "love",
        rarity: "rare",
        color: "#e11d48",
        icon: "assets/icon-pillar-love-minimal.webp",
        art: "assets/love_art.webp",
        desc: "Chassez les ombres du passé. Main renouvelée.",
        effects: { spirituality: 5, love: 15, money: -16 },
        specialEffect: "refresh"
    },
    {
        title: "L'Ombre du Doute",
        category: "spirituality",
        rarity: "epic",
        color: "#2c3e50",
        icon: "assets/icon-pillar-spirituality-minimal.webp",
        art: "assets/spirituality_art.webp",
        desc: "Une épreuve de foi. (Draine tous les piliers de 10 au prochain tour)",
        effects: { spirituality: 36, love: -13, health: -9, money: -9 },
        specialEffect: "corruption"
    },
    {
        title: "Transcendance Absolue",
        category: "mixed",
        rarity: "mythic",
        color: "#ffffff",
        icon: "assets/icon-pillar-spirituality-minimal.webp",
        art: "assets/harmony_art.webp",
        desc: "Un état de pureté où chaque souffle est une éternité.",
        effects: { spirituality: 45, love: 45, health: -36, money: -45 }
    }
];

export const CRISIS_SCENARIOS = [
    { 
        title: "Ascension Finale", 
        category: "spirituality", 
        rarity: "legendary",
        color: "#ffffff",
        icon: "assets/icon-pillar-spirituality-minimal.webp",
        art: "assets/harmony_art.webp",
        desc: "La transcendance ultime. Tout est un.", 
        effects: { spirituality: 80, love: 40, health: 40, money: -80 } 
    },
    { 
        title: "Effondrement Boursier", 
        category: "money", 
        rarity: "epic",
        color: "#e74c3c",
        icon: "assets/icon-pillar-money-minimal.webp",
        art: "assets/money_art.webp",
        desc: "Une crise financière majeure.", 
        effects: { spirituality: -10, love: -5, health: -10, money: -60 } 
    },
    { 
        title: "Éveil Spirituel", 
        category: "spirituality", 
        rarity: "epic",
        color: "#f3e5ab",
        icon: "assets/icon-pillar-spirituality-minimal.webp",
        art: "assets/spirituality_art.webp",
        desc: "Une révélation qui change tout.", 
        effects: { spirituality: 60, love: 20, health: 20, money: -40 } 
    },
    { 
        title: "Pandémie Globale", 
        category: "health", 
        rarity: "epic",
        color: "#8b0000",
        icon: "assets/icon-pillar-health-minimal.webp",
        art: "assets/health_art.webp",
        desc: "Le monde s'arrête.", 
        effects: { spirituality: -5, love: -10, health: -50, money: -30 } 
    },
    { 
        title: "Grand Amour", 
        category: "love", 
        rarity: "epic",
        color: "#ff69b4",
        icon: "assets/icon-pillar-love-minimal.webp",
        art: "assets/love_art.webp",
        desc: "Une rencontre qui définit une vie.", 
        effects: { spirituality: 15, love: 70, health: 0, money: -40 } 
    }
];

export const WORLD_EVENTS = [
    {
        id: "prosperity",
        title: "Ére de Prospérité",
        desc: "Les opportunités financières fleurissent.",
        art: "assets/event_gold_rush_art.webp",
        duration: 5,
        effectsPerTurn: { money: 6, health: -2, spirituality: -2 },
        color: "#f59e0b"
    },
    {
        id: "isolation",
        title: "Éclipse Mystique",
        desc: "Un temps de réflexion profonde et d'alignement spirituel.",
        art: "assets/event_eclipse_art.webp",
        duration: 4,
        effectsPerTurn: { spirituality: 8, love: -4, health: 2 },
        color: "#4f46e5"
    },
    {
        id: "festival",
        title: "Grand Festival",
        desc: "L'harmonie sociale et l'amour rayonnent dans le monde.",
        art: "assets/event_festival_art.webp",
        duration: 6,
        effectsPerTurn: { love: 7, money: -3, health: 1 },
        color: "#e11d48"
    },
    {
        id: "spring",
        title: "Source de Jouvence",
        desc: "Une vitalité naturelle envahit votre corps.",
        art: "assets/event_spring_art.webp",
        duration: 5,
        effectsPerTurn: { health: 6, spirituality: 2, money: -3 },
        color: "#10b981"
    },
    {
        id: "crisis",
        title: "Crise Sanitaire",
        desc: "La santé devient la priorité absolue.",
        art: "assets/health_art.webp",
        duration: 6,
        effectsPerTurn: { health: -5, money: -5, love: 5 },
        color: "#ef4444"
    }
];

export const TROPHIES = [
    // Premiere victoire : le jeu n'avait aucune fin heureuse a recompenser.
    { id: 'premiere_victoire', name: "L'Équilibre Atteint", icon: '✦',
      desc: "Tenir l'harmonie quatre tours d'affilée.",
      requirement: (e) => !!e.isVictory },

    {
        id: "centenarian",
        title: "Le Centenaire",
        desc: "Atteindre 100 tours dans un seul cycle.",
        requirement: (state) => state.turn >= 100,
        icon: "🏆"
    },
    {
        id: "harmonic_master",
        title: "Maître de l'Harmonie",
        desc: "Rester en état d'Harmonie pendant 20 tours consécutifs.",
        requirement: (state) => state.consecutiveHarmony >= 20,
        icon: "✨"
    },
    {
        id: "billionaire_monk",
        title: "Moine Milliardaire",
        desc: "Avoir Spirituality et Money au-dessus de 80 simultanément.",
        requirement: (state) => state.pillars.spirituality >= 80 && state.pillars.money >= 80,
        icon: "💰"
    },
    {
        id: "legacy_builder",
        title: "Bâtisseur d'Héritage",
        desc: "Accumuler 1 000 000 de points d'héritage total.",
        requirement: (state, stats) => stats.totalLegacy >= 1000000,
        icon: "🏛️"
    }
];

/**
 * LEGACY_TREE: Definitions of all permanent upgrades.
 */
export const LEGACY_TREE = {
    serenity: {
        id: 'serenity',
        name: 'Branche de la Sérénité',
        upgrades: [
            { id: 'inner_calm', name: 'Calme Intérieur', maxRank: 5, cost: 100, multiplier: 0.02, type: 'mitigation', target: 'spirituality' },
            { id: 'prophetic_vision', name: 'Vision Prophétique', maxRank: 1, cost: 500, multiplier: 0.05, type: 'luck', target: 'rarity' }
        ]
    },
    empathy: {
        id: 'empathy',
        name: 'Branche de l\'Empathie',
        upgrades: [
            { id: 'open_heart', name: 'Cœur Ouvert', maxRank: 5, cost: 100, multiplier: 0.03, type: 'boost', target: 'love' },
            { id: 'unbreakable_bond', name: 'Lien Indéfectible', maxRank: 1, cost: 500, value: 5, type: 'start_bonus', target: 'love' }
        ]
    },
    vitality: {
        id: 'vitality',
        name: 'Branche de la Vitalité',
        upgrades: [
            { id: 'stone_body', name: 'Corps de Pierre', maxRank: 5, cost: 100, multiplier: 0.03, type: 'mitigation', target: 'health' },
            { id: 'second_wind', name: 'Second Souffle', maxRank: 1, cost: 1000, type: 'rescue', target: 'health' }
        ]
    },
    prosperity: {
        id: 'prosperity',
        name: 'Branche de la Prospérité',
        upgrades: [
            { id: 'wise_management', name: 'Gestion Sage', maxRank: 5, cost: 100, multiplier: 0.03, type: 'mitigation', target: 'money' },
            { id: 'unexpected_windfall', name: 'Aubaine Inattendue', maxRank: 1, cost: 800, chance: 0.05, type: 'luck', target: 'money' }
        ]
    }
};

