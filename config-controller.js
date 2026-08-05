/**
 * ConfigController
 * Handles localization, themes, and global application options.
 */
export class ConfigController {
    constructor(options = {}) {
        this.onConfigChange = options.onConfigChange || (() => {});
        
        this.languages = {
            fr: {
                start_experience: "Commencer l'expérience",
                start_duel: "Mode Duel (Bêta)",
                settings: "Paramètres",
                daily_challenge: "LE DÉFI DU JOUR :",
                play: "Jouer",
                meditation_mode: "Mode Méditation",
                duel_mode: "Mode Duel (Alpha)",
                continue: "Continuer",
                rules: "Règles",
                close: "Fermer",
                rules_1: "Maintenez l'équilibre entre les 4 piliers de vie.",
                rules_2: "Chaque pilier doit rester entre 1 et 99 pour survivre.",
                rules_3: "L'harmonie est atteinte lorsque les piliers sont proches les uns des autres.",
                rules_4: "Choisissez vos cartes avec sagesse. Le destin est entre vos mains.",
                turn: "Tour",
                score: "Score",
                best: "Best:",
                total_balance: "Équilibre Total",
                legacy: "Héritage",
                harmony: "HARMONIE",
                meditation: "MÉDITATION",
                select_pantheon: "CHOISIR VOTRE PANTHÉON",
                select_meditation: "MÉDITATION : CHOISIR VOTRE VOIE",
                music: "Musique",
                sfx: "Effets",
                voice: "Voix",
                stop_speech: "ARRÊTER LA LECTURE",
                read_aloud: "LIRE À VOIX HAUTE",
                swipe_hint: "← BALAYEZ POUR VOIR LES AUTRES →",
                maj_dispo: "Nouvelle version disponible",
                maj_appliquer: "METTRE À JOUR",
                maj_plus_tard: "Plus tard",
                tuto_next: "J'AI COMPRIS",
                tuto_skip: "Passer l'initiation",
                tuto_1: "Quatre piliers soutiennent votre existence : Spiritualité, Amour, Santé et Argent. Aucun ne doit tomber à zéro ni atteindre cent.",
                tuto_2: "Chaque tour, trois cartes vous sont proposées. Chacune donne et chacune prend. Il n'existe aucune carte parfaite.",
                tuto_3: "On ne vous jugera pas sur votre plus haut pilier, mais sur le plus bas. L'équilibre vaut mieux que l'excès.",
                peril_low: "en péril",
                cause_zero: "est tombée à zéro.",
                cause_cent: "a atteint cent. L'excès aussi rompt l'équilibre.",
                peril_high: "en excès",
                back: "Retour",
                heritage_tree: "Arbre d'Héritage",
                master_vol: "Global",
                language: "Langue",
                theme: "Thème",
                light_mode: "Mode Clair",
                confirm_click: "Confirmer par un second clic",
                game_over_title: "L'EXPÉRIENCE S'ACHÈVE",
                game_over_subtitle: "Équilibre Rompu",
                game_over_desc: "Votre voyage s'arrête ici.",
                final_score: "Score Final",
                restart: "Recommencer",
                menu: "Menu",
                daily_retry: "LE DÉFI REPRENDRA CHAQUE JOUR",
                opponent: "Adversaire",
                opponent_final: "Adversaire",
                waiting: "En attente...",
                victory: "VICTOIRE",
                defeat: "DÉFAITE",
                draw: "ÉGALITÉ",
                history: "Historique",
                share: "Partager",
                memories: "Souvenirs",
                statistics: "Statistiques",
                leaderboard: "Classement",
                rank: "Rang",
                name: "Nom",
                score_label: "Score",
                date: "Date",
                no_scores: "Aucun record encore...",
                stat_games: "Vies vécues",
                stat_turns: "Cycles totaux",
                stat_best: "Record de sagesse",
                stat_legacy: "Héritage accumulé",
                stat_harmonies: "Moments d'harmonie",
                confirm_click_opt: "Confirmation Double",
                screen_shake_opt: "Secousses Caméra",
                reset_data: "RÉINITIALISER L'HÉRITAGE",
                credits: "Crédits",
                paused: "Pause",
                player_name: "Nom du Gardien",
                resume: "Reprendre",
                quit: "Quitter",
                director: "DIRECTION ARTISTIQUE",
                sound_design: "DESIGN SONORE",
                technology: "TECHNOLOGIE",
                pillar_spirituality: "Spiritualité",
                pillar_love: "Amour",
                pillar_health: "Santé",
                pillar_money: "Argent",
                logo_subtext: "LES 4 PILIERS",
                autosave: "SYNCHRONISATION...",
                common: "COMMUNE",
                uncommon: "PEU COMMUNE",
                rare: "RARE",
                epic: "ÉPIQUE",
                legendary: "LÉGENDAIRE",
                // Scenarios mapping
                "Retraite Méditative": "Retraite Méditative",
                "Don de Charité": "Don de Charité",
                "Étude Intensive": "Étude Intensive",
                "Pèlerinage Sacré": "Pèlerinage Sacré",
                "Sagesse Ancestrale": "Sagesse Ancestrale",
                "Minimalisme": "Minimalisme",
                "Heures Supplémentaires": "Heures Supplémentaires",
                "Nouvelle Entreprise": "Nouvelle Entreprise",
                "Gain au Loto": "Gain au Loto",
                "Investissement Sûr": "Investissement Sûr",
                "Marché Boursier": "Marché Boursier",
                "Héritage Inattendu": "Héritage Inattendu",
                "Vacances en Famille": "Vacances en Famille",
                "Dîner Romantique": "Dîner Romantique",
                "Visite d'un Vieil Ami": "Visite d'un Vieil Ami",
                "Mariage Royal": "Mariage Royal",
                "Adoption d'un Animal": "Adoption d'un Animal",
                "Réconciliation": "Réconciliation",
                "Mode de Vie Sain": "Mode de Vie Sain",
                "Journée Spa": "Journée Spa",
                "Bilan Médical": "Bilan Médical",
                "Marathon de la Ville": "Marathon de la Ville",
                "Sommeil Réparateur": "Sommeil Réparateur",
                "Cure de Détox": "Cure de Détox",
                "Équilibre Parfait": "Équilibre Parfait",
                "Effondrement Boursier": "Effondrement Boursier",
                "Éveil Spirituel": "Éveil Spirituel",
                "Pandémie Globale": "Pandémie Globale",
                "Grand Amour": "Grand Amour",
                // Descriptions
                "Se concentrer sur la paix intérieure.": "Se concentrer sur la paix intérieure.",
                "Aider ceux qui sont dans le besoin.": "Aider ceux qui sont dans le besoin.",
                "La connaissance est le pouvoir.": "La connaissance est le pouvoir.",
                "Un voyage pour l'âme.": "Un voyage pour l'âme.",
                "Écouter les leçons du passé.": "Écouter les leçons du passé.",
                "Se libérer des possessions matérielles.": "Se libérer des possessions matérielles.",
                "Gagner plus, stresser plus.": "Gagner plus, stresser plus.",
                "Risque élevé, récompense élevée.": "Risque élevé, récompense élevée.",
                "De la chance pure.": "De la chance pure.",
                "La patience paye enfin.": "La patience paye enfin.",
                "Spéculation audacieuse.": "Spéculation audacieuse.",
                "Un souffle financier.": "Un souffle financier.",
                "Se connecter avec ses proches.": "Se connecter avec ses proches.",
                "Une soirée à deux.": "Une soirée à deux.",
                "Moments nostalgiques.": "Moments nostalgiques.",
                "Célébration de l'union.": "Célébration de l'union.",
                "Un nouveau compagnon fidèle.": "Un nouveau compagnon fidèle.",
                "Pardonner et avancer.": "Pardonner et avancer.",
                "Mieux manger, plus de sport.": "Mieux manger, plus de sport.",
                "Relaxation ultime.": "Relaxation ultime.",
                "La prévention est la clé.": "La prévention est la clé.",
                "Repousser ses limites physiques.": "Repousser ses limites physiques.",
                "Une semaine de repos total.": "Une semaine de repos total.",
                "Nettoyer son corps.": "Nettoyer son corps.",
                "Un moment de clarté absolue.": "Un moment de clarté absolue.",
                "Une crise financière majeure.": "Une crise financière majeure.",
                "Une révélation qui change tout.": "Une révélation qui change tout.",
                "Le monde s'arrête.": "Le monde s'arrête.",
                "Une rencontre qui définit une vie.": "Une rencontre qui définit une vie."
            },
            en: {
                start_experience: "Begin Experience",
                start_duel: "Duel Mode (Beta)",
                settings: "Settings",
                daily_challenge: "DAILY CHALLENGE:",
                play: "Play",
                meditation_mode: "Meditation Mode",
                duel_mode: "Duel Mode (Alpha)",
                continue: "Continue",
                rules: "Rules",
                close: "Close",
                rules_1: "Maintain balance between the 4 life pillars.",
                rules_2: "Each pillar must stay between 1 and 99 to survive.",
                rules_3: "Harmony is reached when pillars are close to each other.",
                rules_4: "Choose your cards wisely. Destiny is in your hands.",
                turn: "Turn",
                score: "Score",
                best: "Best:",
                total_balance: "Total Balance",
                legacy: "Legacy",
                harmony: "HARMONY",
                meditation: "MEDITATION",
                select_pantheon: "CHOOSE YOUR PANTHEON",
                select_meditation: "MEDITATION: CHOOSE YOUR PATH",
                music: "Music",
                sfx: "Effects",
                voice: "Voice",
                stop_speech: "STOP READING",
                read_aloud: "READ ALOUD",
                swipe_hint: "← SWIPE TO SEE THE OTHERS →",
                maj_dispo: "A new version is available",
                maj_appliquer: "UPDATE",
                maj_plus_tard: "Later",
                tuto_next: "GOT IT",
                tuto_skip: "Skip the introduction",
                tuto_1: "Four pillars hold up your life: Spirituality, Love, Health and Money. None may fall to zero or reach one hundred.",
                tuto_2: "Each turn, three cards are offered. Every one gives and every one takes. No card is ever perfect.",
                tuto_3: "You will not be judged on your highest pillar, but on your lowest. Balance is worth more than excess.",
                peril_low: "in peril",
                cause_zero: "fell to zero.",
                cause_cent: "reached one hundred. Excess breaks the balance too.",
                peril_high: "in excess",
                back: "Back",
                heritage_tree: "Heritage Tree",
                master_vol: "Master",
                language: "Language",
                theme: "Theme",
                light_mode: "Light Mode",
                confirm_click: "Click again to confirm",
                game_over_title: "THE EXPERIENCE ENDS",
                game_over_subtitle: "Broken Equilibrium",
                game_over_desc: "Your journey ends here.",
                final_score: "Final Score",
                restart: "Restart",
                menu: "Menu",
                daily_retry: "THE CHALLENGE RESUMES DAILY",
                opponent: "Opponent",
                opponent_final: "Opponent",
                waiting: "Waiting...",
                victory: "VICTORY",
                defeat: "DEFEAT",
                draw: "DRAW",
                history: "History",
                share: "Share",
                memories: "Memories",
                statistics: "Statistics",
                leaderboard: "Leaderboard",
                rank: "Rank",
                name: "Name",
                score_label: "Score",
                date: "Date",
                no_scores: "No records yet...",
                stat_games: "Lives Lived",
                stat_turns: "Total Cycles",
                stat_best: "Wisdom Record",
                stat_legacy: "Accumulated Legacy",
                stat_harmonies: "Moments of Harmony",
                confirm_click_opt: "Double Confirmation",
                screen_shake_opt: "Screen Shake",
                reset_data: "RESET LEGACY",
                credits: "Credits",
                paused: "Paused",
                player_name: "Guardian Name",
                resume: "Resume",
                quit: "Quit",
                director: "ARTISTIC DIRECTION",
                sound_design: "SOUND DESIGN",
                technology: "TECHNOLOGY",
                pillar_spirituality: "Spirituality",
                pillar_love: "Love",
                pillar_health: "Health",
                pillar_money: "Money",
                logo_subtext: "THE 4 PILLARS",
                autosave: "SYNCHRONIZING...",
                common: "COMMUNE",
                uncommon: "PEU COMMUNE",
                rare: "RARE",
                epic: "ÉPIQUE",
                legendary: "LÉGENDAIRE",
                // Scenarios mapping
                "Retraite Méditative": "Meditative Retreat",
                "Don de Charité": "Charity Donation",
                "Étude Intensive": "Intensive Study",
                "Pèlerinage Sacré": "Sacred Pilgrimage",
                "Sagesse Ancestrale": "Ancestral Wisdom",
                "Minimalisme": "Minimalism",
                "Heures Supplémentaires": "Overtime",
                "Nouvelle Entreprise": "New Business",
                "Gain au Loto": "Lottery Win",
                "Investissement Sûr": "Safe Investment",
                "Marché Boursier": "Stock Market",
                "Héritage Inattendu": "Unexpected Inheritance",
                "Vacances en Famille": "Family Vacation",
                "Dîner Romantique": "Romantic Dinner",
                "Visite d'un Vieil Ami": "Old Friend Visit",
                "Mariage Royal": "Royal Wedding",
                "Adoption d'un Animal": "Pet Adoption",
                "Réconciliation": "Reconciliation",
                "Mode de Vie Sain": "Healthy Lifestyle",
                "Journée Spa": "Spa Day",
                "Bilan Médical": "Medical Checkup",
                "Marathon de la Ville": "City Marathon",
                "Sommeil Réparateur": "Restful Sleep",
                "Cure de Détox": "Detox Cure",
                "Équilibre Parfait": "Perfect Balance",
                "Effondrement Boursier": "Market Crash",
                "Éveil Spirituel": "Spiritual Awakening",
                "Pandémie Globale": "Global Pandemic",
                "Grand Amour": "True Love",
                // Descriptions
                "Se concentrer sur la paix intérieure.": "Focus on inner peace.",
                "Aider ceux qui sont dans le besoin.": "Help those in need.",
                "La connaissance est le pouvoir.": "Knowledge is power.",
                "Un voyage pour l'âme.": "A journey for the soul.",
                "Écouter les leçons du passé.": "Listen to the lessons of the past.",
                "Se libérer des possessions matérielles.": "Free yourself from material possessions.",
                "Gagner plus, stresser plus.": "Earn more, stress more.",
                "Risque élevé, récompense élevée.": "High risk, high reward.",
                "De la chance pure.": "Pure luck.",
                "La patience paye enfin.": "Patience finally pays off.",
                "Spéculation audacieuse.": "Bold speculation.",
                "Un souffle financier.": "A financial boost.",
                "Se connecter avec ses proches.": "Connect with your loved ones.",
                "Une soirée à deux.": "An evening for two.",
                "Moments nostalgiques.": "Nostalgic moments.",
                "Célébration de l'union.": "Celebration of union.",
                "Un nouveau compagnon fidèle.": "A new faithful companion.",
                "Pardonner et avancer.": "Forgive and move forward.",
                "Mieux manger, plus de sport.": "Eat better, exercise more.",
                "Relaxation ultime.": "Ultimate relaxation.",
                "La prévention est la clé.": "Prevention is key.",
                "Repousser ses limites physiques.": "Push your physical limits.",
                "Une semaine de repos total.": "A week of total rest.",
                "Nettoyer son corps.": "Cleanse your body.",
                "Un moment de clarté absolue.": "A moment of absolute clarity.",
                "Une crise financière majeure.": "A major financial crisis.",
                "Une révélation qui change tout.": "A revelation that changes everything.",
                "Le monde s'arrête.": "The world stops.",
                "Une rencontre qui définit une vie.": "A life-defining encounter."
            }
        };

        this.themes = {
            classic: {
                name: "Classic",
                colors: {
                    gold: "#c5a059",
                    goldBright: "#f3e5ab",
                    bg: "#030303",
                    glass: "rgba(10, 10, 10, 0.6)"
                }
            },
            zen: {
                name: "Zen",
                colors: {
                    gold: "#78909c",
                    goldBright: "#b0bec5",
                    bg: "#1a1a1a",
                    glass: "rgba(30, 30, 30, 0.6)"
                }
            },
            prestige: {
                name: "Prestige",
                colors: {
                    gold: "#d4af37",
                    goldBright: "#ffdf00",
                    bg: "#0a0a0a",
                    glass: "rgba(20, 20, 20, 0.7)"
                }
            }
        };

        this.currentConfig = {
            language: 'fr',
            theme: 'classic',
            playerName: 'Gardien',
            lightMode: false,
            confirmClick: true,
            screenShake: true
        };
    }

    init(savedConfig) {
        if (savedConfig) {
            this.currentConfig = { ...this.currentConfig, ...savedConfig };
        }
        // Ensure defaults if missing from saved config
        if (!this.currentConfig.playerName) this.currentConfig.playerName = 'Gardien';
        if (this.currentConfig.confirmClick === undefined) this.currentConfig.confirmClick = true;
        if (this.currentConfig.screenShake === undefined) this.currentConfig.screenShake = true;
        
        this.applyConfig();
    }

    setLanguage(lang) {
        if (this.languages[lang]) {
            this.currentConfig.language = lang;
            this.applyConfig();
            this.onConfigChange('language', lang);
        }
    }

    setPlayerName(name) {
        this.currentConfig.playerName = name || 'Gardien';
        this.onConfigChange('playerName', this.currentConfig.playerName);
    }

    setTheme(themeKey) {
        if (this.themes[themeKey]) {
            this.currentConfig.theme = themeKey;
            this.applyConfig();
            this.onConfigChange('theme', themeKey);
        }
    }

    setLightMode(enabled) {
        this.currentConfig.lightMode = enabled;
        this.applyConfig();
        this.onConfigChange('lightMode', enabled);
    }

    setConfirmClick(enabled) {
        this.currentConfig.confirmClick = enabled;
        this.applyConfig();
        this.onConfigChange('confirmClick', enabled);
    }

    setScreenShake(enabled) {
        this.currentConfig.screenShake = enabled;
        this.applyConfig();
        this.onConfigChange('screenShake', enabled);
    }

    applyConfig() {
        const config = this.currentConfig;
        
        // Apply Language to DOM elements with data-i18n
        const langData = this.languages[config.language];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (langData[key]) {
                el.textContent = langData[key];
            }
        });

        // Apply pillar titles for accessibility/tooltips
        const pillarIcons = document.querySelectorAll('.pillar-icon');
        const pillars = ['spirituality', 'love', 'health', 'money'];
        pillarIcons.forEach((icon, i) => {
            if (pillars[i]) {
                icon.title = langData[`pillar_${pillars[i]}`];
            }
        });

        // Apply Theme Colors
        const themeData = this.themes[config.theme] || this.themes.classic;
        const root = document.documentElement;
        root.style.setProperty('--gold', themeData.colors.gold);
        root.style.setProperty('--gold-bright', themeData.colors.goldBright);
        
        if (!config.lightMode) {
            root.style.setProperty('--bg', themeData.colors.bg);
            root.style.setProperty('--glass', themeData.colors.glass);
            document.body.classList.remove('light-mode');
        } else {
            root.style.setProperty('--bg', '#f5f5f5');
            root.style.setProperty('--glass', 'rgba(255, 255, 255, 0.8)');
            document.body.classList.add('light-mode');
        }
    }

    getTranslation(key) {
        return this.languages[this.currentConfig.language][key] || key;
    }
}
