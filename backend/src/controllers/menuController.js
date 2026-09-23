const { Plato } = require('../models');

async function listarPlatos(req, res) {
  const platos = await Plato.findAll({ where: { disponible: true } });
  res.json(platos);
}

async function crearPlato(req, res) {
  try {
    const { nombre, descripcion, precio, categoria } = req.body;
    if (!nombre || precio == null) {
      return res.status(400).json({ mensaje: 'Nombre y precio son obligatorios' });
    }
    const plato = await Plato.create({ nombre, descripcion, precio, categoria });
    res.status(201).json(plato);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear plato', error: error.message });
  }
}

module.exports = { listarPlatos, crearPlato };
