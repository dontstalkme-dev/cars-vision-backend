const { v4: uuidv4 } = require('uuid');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.bulkInsert('parametres', [
            {
                id: uuidv4(),
                cle: 'nom_boutique',
                valeur: 'Cars Vision Auto',
                type: 'string',
                description: 'Nom de la boutique',
                cree_le: new Date(),
                modifie_le: new Date()
            },
            {
                id: uuidv4(),
                cle: 'email_contact',
                valeur: 'contact@carsvisionauto.cm',
                type: 'string',
                description: 'Email de contact',
                cree_le: new Date(),
                modifie_le: new Date()
            },
            {
                id: uuidv4(),
                cle: 'telephone_contact',
                valeur: '+237600000000',
                type: 'string',
                description: 'Téléphone de contact',
                cree_le: new Date(),
                modifie_le: new Date()
            },
            {
                id: uuidv4(),
                cle: 'adresse',
                valeur: 'Douala, Cameroun',
                type: 'string',
                description: 'Adresse physique',
                cree_le: new Date(),
                modifie_le: new Date()
            },
            {
                id: uuidv4(),
                cle: 'frais_livraison_defaut',
                valeur: '2000',
                type: 'number',
                description: 'Frais de livraison par défaut en FCFA',
                cree_le: new Date(),
                modifie_le: new Date()
            },
            {
                id: uuidv4(),
                cle: 'seuil_stock_alerte',
                valeur: '5',
                type: 'number',
                description: 'Seuil de stock pour alerte',
                cree_le: new Date(),
                modifie_le: new Date()
            },
            {
                id: uuidv4(),
                cle: 'politique_retour',
                valeur: 'Retour possible sous 7 jours si le produit est dans son emballage d\'origine.',
                type: 'string',
                description: 'Politique de retour',
                cree_le: new Date(),
                modifie_le: new Date()
            }
        ], {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('parametres', null, {});
    }
};
