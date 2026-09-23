const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Plato = sequelize.define('Plato', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  precio: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  categoria: {
    type: DataTypes.STRING,
    defaultValue: 'General',
  },
  disponible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = Plato;
