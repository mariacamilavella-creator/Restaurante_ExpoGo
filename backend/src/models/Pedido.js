const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pedido = sequelize.define('Pedido', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // uuid generado en el celular; permite reconocer un pedido creado offline
  // y evitar duplicados cuando se sincroniza.
  uuidCliente: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'confirmado', 'en_preparacion', 'cancelado', 'entregado'),
    defaultValue: 'pendiente',
  },
  total: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  notas: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // items del pedido guardados como JSON: [{platoId, nombre, cantidad, precio}]
  items: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const raw = this.getDataValue('items');
      return raw ? JSON.parse(raw) : [];
    },
    set(value) {
      this.setDataValue('items', JSON.stringify(value));
    },
  },
});

module.exports = Pedido;
