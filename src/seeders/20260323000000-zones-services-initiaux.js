const { v4: uuidv4 } = require('uuid');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const now = new Date();

        // Zones de livraison
        const zones = [
            {
                id: uuidv4(),
                nom: 'Douala - Centre (Akwa, Bonanjo, Bali)',
                description: 'Livraison rapide dans le centre-ville de Douala',
                frais_livraison: 2000,
                delai_livraison_jours: 1,
                est_actif: true,
                ordre: 1,
                cree_le: now,
                modifie_le: now
            },
            {
                id: uuidv4(),
                nom: 'Douala - Périphérie (Bonabéri, Logbaba, Makepe)',
                description: 'Livraison dans les quartiers périphériques de Douala',
                frais_livraison: 3000,
                delai_livraison_jours: 2,
                est_actif: true,
                ordre: 2,
                cree_le: now,
                modifie_le: now
            },
            {
                id: uuidv4(),
                nom: 'Yaoundé',
                description: 'Livraison dans toute la ville de Yaoundé',
                frais_livraison: 5000,
                delai_livraison_jours: 3,
                est_actif: true,
                ordre: 3,
                cree_le: now,
                modifie_le: now
            },
            {
                id: uuidv4(),
                nom: 'Autres villes (Bafoussam, Bamenda, Garoua, etc.)',
                description: 'Livraison dans les autres grandes villes du Cameroun',
                frais_livraison: 8000,
                delai_livraison_jours: 5,
                est_actif: true,
                ordre: 4,
                cree_le: now,
                modifie_le: now
            }
        ];

        await queryInterface.bulkInsert('zones_livraison', zones);

        // Services garage
        const services = [
            {
                id: uuidv4(),
                nom: 'Révision complète',
                slug: 'revision-complete',
                description: 'Révision complète du véhicule incluant vidange, filtres, freins, pneus',
                prix: 45000,
                duree_minutes: 120,
                est_actif: true,
                ordre: 1,
                cree_le: now,
                modifie_le: now
            },
            {
                id: uuidv4(),
                nom: 'Vidange moteur',
                slug: 'vidange-moteur',
                description: 'Changement d\'huile moteur et filtre à huile',
                prix: 25000,
                duree_minutes: 60,
                est_actif: true,
                ordre: 2,
                cree_le: now,
                modifie_le: now
            },
            {
                id: uuidv4(),
                nom: 'Changement plaquettes de frein',
                slug: 'changement-plaquettes-frein',
                description: 'Remplacement des plaquettes de frein avant ou arrière',
                prix: 35000,
                duree_minutes: 90,
                est_actif: true,
                ordre: 3,
                cree_le: now,
                modifie_le: now
            },
            {
                id: uuidv4(),
                nom: 'Diagnostic électronique',
                slug: 'diagnostic-electronique',
                description: 'Diagnostic complet du système électronique du véhicule',
                prix: 15000,
                duree_minutes: 60,
                est_actif: true,
                ordre: 4,
                cree_le: now,
                modifie_le: now
            },
            {
                id: uuidv4(),
                nom: 'Réparation moteur',
                slug: 'reparation-moteur',
                description: 'Réparation et entretien du moteur',
                prix: 80000,
                duree_minutes: 180,
                est_actif: true,
                ordre: 5,
                cree_le: now,
                modifie_le: now
            },
            {
                id: uuidv4(),
                nom: 'Entretien climatisation',
                slug: 'entretien-climatisation',
                description: 'Recharge et entretien du système de climatisation',
                prix: 20000,
                duree_minutes: 60,
                est_actif: true,
                ordre: 6,
                cree_le: now,
                modifie_le: now
            }
        ];

        await queryInterface.bulkInsert('services', services);

        console.log('✓ Zones de livraison et services créés avec succès');
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('zones_livraison', null, {});
        await queryInterface.bulkDelete('services', null, {});
    }
};
