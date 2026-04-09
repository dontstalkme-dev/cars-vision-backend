'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('tokens_refresh');

    // Ne rien faire si la colonne existe déjà
    if (tableDescription.type) {
      console.log('Colonne "type" existe déjà dans tokens_refresh, migration ignorée.');
      return;
    }

    // Créer le type ENUM en PostgreSQL
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_tokens_refresh_type" AS ENUM('refresh', 'reset');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Ajouter la colonne type avec 'refresh' comme valeur par défaut
    // Cela ne casse pas les tokens existants (tous traités comme refresh tokens)
    await queryInterface.addColumn('tokens_refresh', 'type', {
      type: Sequelize.ENUM('refresh', 'reset'),
      allowNull: false,
      defaultValue: 'refresh',
      comment: 'Type de token : refresh = JWT refresh | reset = réinitialisation mot de passe'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('tokens_refresh', 'type');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_tokens_refresh_type";'
    );
  }
};
