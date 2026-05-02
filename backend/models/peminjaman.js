'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Peminjaman extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Peminjaman.init({
    anggotaId: DataTypes.INTEGER,
    bukuId: DataTypes.INTEGER,
    tanggal_pinjam: DataTypes.DATE,
    tanggal_jatuh_tempo: DataTypes.DATE,
    tanggal_kembali: DataTypes.DATE,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Peminjaman',
  });
  return Peminjaman;
};