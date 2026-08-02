/**
 * NarrativeEvents Module
 * Defines the sequences and random encounters for the game Équilibre.
 */

export const NARRATIVE_CHAINS = [
    {
        id: "startup_adventure",
        trigger: (engine) => engine.pillars.money > 60 && engine.turn > 5,
        chance: 0.3,
        steps: [
            { 
                title: "L'Idée de Génie", 
                category: "money", 
                desc: "Une vision pour une startup révolutionnaire.", 
                effects: { money: -20, spirituality: 10, health: -5, love: -5 }
            },
            { 
                title: "Le Lancement", 
                category: "money", 
                desc: "Le produit est sur le marché. C'est le moment de vérité.", 
                effects: { money: 40, spirituality: -10, health: -15, love: -10 }
            },
            { 
                title: "L'Exode Doré", 
                category: "money", 
                desc: "Vente de l'entreprise. La liberté financière est là.", 
                effects: { money: 60, spirituality: 20, health: 10, love: 20 }
            }
        ]
    },
    {
        id: "spiritual_awakening",
        trigger: (engine) => engine.pillars.spirituality < 20 && engine.turn > 10,
        chance: 0.4,
        steps: [
            { 
                title: "La Nuit Noire", 
                category: "spirituality", 
                desc: "Tout semble vide. Une quête intérieure s'impose.", 
                effects: { spirituality: 10, love: -10, health: -10, money: -5 }
            },
            { 
                title: "Rencontre au Sommet", 
                category: "spirituality", 
                desc: "Un guide croise votre chemin dans les montagnes.", 
                effects: { spirituality: 30, love: 10, health: 15, money: -20 }
            },
            { 
                title: "Illumination", 
                category: "spirituality", 
                desc: "La paix que vous cherchiez était déjà en vous.", 
                effects: { spirituality: 50, love: 20, health: 10, money: 0 }
            }
        ]
    }
];

export const RANDOM_ENCOUNTERS = [
    {
        id: "mysterious_stranger",
        trigger: (engine) => engine.turn > 3,
        chance: 0.05, // Rare
        steps: [
            {
                title: "L'Étranger Mystérieux",
                category: "spirituality",
                desc: "Un homme vous propose un pacte inhabituel.",
                effects: { spirituality: 20, money: -20, love: -10, health: 10 }
            },
            {
                title: "Le Contrecoup du Pacte",
                category: "money",
                desc: "Les conséquences de votre accord se font sentir.",
                effects: { money: 40, spirituality: -20, health: -10, love: 10 }
            }
        ]
    },
    {
        id: "old_friend_reunion",
        trigger: (engine) => engine.turn > 8,
        chance: 0.08,
        steps: [
            {
                title: "Retrouvailles Inattendues",
                category: "love",
                desc: "Un ami d'enfance réapparaît dans votre vie.",
                effects: { love: 25, spirituality: 10, money: -15, health: 5 }
            },
            {
                title: "Nostalgie Partagée",
                category: "love",
                desc: "Le lien est plus fort que jamais.",
                effects: { love: 15, health: 10, spirituality: 5, money: -5 }
            }
        ]
    }
];

export const ALL_NARRATIVE_EVENTS = [...NARRATIVE_CHAINS, ...RANDOM_ENCOUNTERS];
