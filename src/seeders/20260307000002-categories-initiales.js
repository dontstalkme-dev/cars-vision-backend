const { v4: uuidv4 } = require('uuid');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const categories = [
            {
                id: uuidv4(),
                nom: 'Pieces Moteur',
                slug: 'pieces-moteur',
                description: 'Toutes les pièces pour le moteur de votre véhicule',
                est_actif: true,
                cree_le: new Date(),
                modifie_le: new Date()
            },
            {
                id: uuidv4(),
                nom: 'Freinage',
                slug: 'freinage',
                description: 'Système de freinage complet',
                est_actif: true,
                cree_le: new Date(),
                modifie_le: new Date()
            },
            {
                id: uuidv4(),
                nom: 'Suspension',
                slug: 'suspension',
                description: 'Amortisseurs et pièces de suspension',
                est_actif: true,
                cree_le: new Date(),
                modifie_le: new Date()
            },
            {
                id: uuidv4(),
                nom: 'Electricite',
                slug: 'electricite',
                description: 'Batteries, alternateurs et composants électriques',
                est_actif: true,
                cree_le: new Date(),
                modifie_le: new Date()
            },
            {
                id: uuidv4(),
                nom: 'Carrosserie',
                slug: 'carrosserie',
                description: 'Pièces de carrosserie et accessoires',
                est_actif: true,
                cree_le: new Date(),
                modifie_le: new Date()
            },
            {
                id: uuidv4(),
                nom: 'Huiles et Lubrifiants',
                slug: 'huiles-et-lubrifiants',
                description: 'Huiles moteur, liquides de frein et autres lubrifiants',
                est_actif: true,
                cree_le: new Date(),
                modifie_le: new Date()
            }
        ];

        await queryInterface.bulkInsert('categories', categories, {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('categories', null, {});
    }
};
