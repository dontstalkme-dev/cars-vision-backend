'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('services', 'image', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      });
    } catch (error) {
      console.log('Colonne image existe déjà dans services, on continue...');
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeColumn('services', 'image');
    } catch (error) {
      console.log('Colonne image n\'existe pas dans services, on continue...');
    }
  }
};
