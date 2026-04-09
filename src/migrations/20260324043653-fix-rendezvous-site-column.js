'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Supprimer la colonne site si elle existe
    try {
      await queryInterface.removeColumn('rendez_vous', 'site');
    } catch (error) {
      console.log('Colonne site n\'existe pas encore, on continue...');
    }

    // Créer le type ENUM
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_rendez_vous_site" AS ENUM('bonamoussadi', 'ndokoti');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Ajouter la colonne avec le bon type
    await queryInterface.addColumn('rendez_vous', 'site', {
      type: Sequelize.ENUM('bonamoussadi', 'ndokoti'),
      allowNull: false,
      defaultValue: 'bonamoussadi',
      comment: 'Site du garage pour le rendez-vous'
    });

    // Ajouter les autres colonnes si elles n'existent pas
    const tableDescription = await queryInterface.describeTable('rendez_vous');

    if (!tableDescription.besoin_remorquage) {
      await queryInterface.addColumn('rendez_vous', 'besoin_remorquage', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Le véhicule doit être remorqué'
      });
    }

    if (!tableDescription.besoin_navette) {
      await queryInterface.addColumn('rendez_vous', 'besoin_navette', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Client a besoin du service de navette'
      });
    }

    if (!tableDescription.voiture_courtoisie) {
      await queryInterface.addColumn('rendez_vous', 'voiture_courtoisie', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Client demande une voiture de courtoisie'
      });
    }

    if (!tableDescription.offre_speciale) {
      await queryInterface.addColumn('rendez_vous', 'offre_speciale', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Offre spéciale sélectionnée (ex: lavage gratuit)'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Supprimer les colonnes ajoutées
    await queryInterface.removeColumn('rendez_vous', 'offre_speciale');
    await queryInterface.removeColumn('rendez_vous', 'voiture_courtoisie');
    await queryInterface.removeColumn('rendez_vous', 'besoin_navette');
    await queryInterface.removeColumn('rendez_vous', 'besoin_remorquage');
    await queryInterface.removeColumn('rendez_vous', 'site');

    // Supprimer le type ENUM
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_rendez_vous_site";');
  }
};
