'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Make utilisateur_id nullable for guest bookings
        await queryInterface.changeColumn('rendez_vous', 'utilisateur_id', {
            type: Sequelize.UUID,
            allowNull: true
        });

        // Add guest columns if they don't exist
        const tableDesc = await queryInterface.describeTable('rendez_vous');

        if (!tableDesc.nom_client) {
            await queryInterface.addColumn('rendez_vous', 'nom_client', {
                type: Sequelize.STRING,
                allowNull: true
            });
        }

        if (!tableDesc.telephone_client) {
            await queryInterface.addColumn('rendez_vous', 'telephone_client', {
                type: Sequelize.STRING,
                allowNull: true
            });
        }

        if (!tableDesc.email_client) {
            await queryInterface.addColumn('rendez_vous', 'email_client', {
                type: Sequelize.STRING,
                allowNull: true
            });
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.changeColumn('rendez_vous', 'utilisateur_id', {
            type: Sequelize.UUID,
            allowNull: false
        });

        await queryInterface.removeColumn('rendez_vous', 'nom_client');
        await queryInterface.removeColumn('rendez_vous', 'telephone_client');
        await queryInterface.removeColumn('rendez_vous', 'email_client');
    }
};
