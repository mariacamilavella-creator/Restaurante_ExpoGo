const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Plato = require('./Plato');
const Pedido = require('./Pedido');

Usuario.hasMany(Pedido, { foreignKey: 'usuarioId' });
Pedido.belongsTo(Usuario, { foreignKey: 'usuarioId' });

module.exports = { sequelize, Usuario, Plato, Pedido };
