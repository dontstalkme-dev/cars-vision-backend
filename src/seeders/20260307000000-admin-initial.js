const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const hashedPassword = await bcrypt.hash('Admin@2026', 10);

        await queryInterface.bulkInsert('utilisateurs', [{
            id: uuidv4(),
            email: 'admin@carsvisionauto.cm',
            mot_de_passe: hashedPassword,
            prenom: 'Admin',
            nom: 'Principal',
            telephone: '+237600000000',
            adresse: 'Douala, Cameroun',
            role: 'admin',
            statut: 'actif',
            tentatives_connexion: 0,
            cree_le: new Date(),
            modifie_le: new Date()
        }], {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('utilisateurs', {
            email: 'admin@carsvisionauto.cm'
        }, {});
    }
};
