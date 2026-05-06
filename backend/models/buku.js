'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Buku extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Buku.hasMany(models.Peminjaman, { foreignKey: 'bukuId', as: 'peminjaman' });
    }
  }
  Buku.init({
    judul: DataTypes.STRING,
    penulis: DataTypes.STRING,
    kategori: DataTypes.STRING,
    status: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Buku',
  });
  return Buku;
};