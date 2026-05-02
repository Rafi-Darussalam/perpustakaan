'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Peminjamans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      anggotaId: {
        type: Sequelize.INTEGER
      },
      bukuId: {
        type: Sequelize.INTEGER
      },
      tanggal_pinjam: {
        type: Sequelize.DATE
      },
      tanggal_jatuh_tempo: {
        type: Sequelize.DATE
      },
      tanggal_kembali: {
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Peminjamans');
  }
};