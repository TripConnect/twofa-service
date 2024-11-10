'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'totp_factor_settings',
      {
        resourceId: {
          primaryKey: true,
          allowNull: false,
          unique: false,
          type: Sequelize.STRING
        },
        secret: {
          primaryKey: true,
          allowNull: false,
          unique: true,
          type: Sequelize.STRING
        },
        enabled: {
          defaultValue: false,
          allowNull: false,
          type: Sequelize.BOOLEAN
        },
      },
      {
        timestamps: false // Disable createdAt and updatedAt fields
      }
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('totp_factor_settings');
  }
};