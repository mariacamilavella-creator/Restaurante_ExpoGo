const { Plato } = require('../models');

// Obtener todos los platos del menú
exports.listarPlatos = async (req, res) => {
  try {
    const platos = await Plato.findAll();
    res.json(platos);
  } catch (error) {
    console.error('Error al listar platos:', error);
    res.status(500).json({ mensaje: 'Error al obtener el menú' });
  }
};

// Crear un nuevo plato
exports.crearPlato = async (req, res) => {
  try {
    const { nombre, descripcion, precio, categoria, imagen_url, disponible } = req.body;

    // Validación básica de campos obligatorios
    if (!nombre || precio === undefined || precio === null) {
      return res.status(400).json({ mensaje: 'El nombre y el precio son obligatorios' });
    }

    const nuevoPlato = await Plato.create({
      nombre,
      descripcion: descripcion || '',
      precio: parseFloat(precio) || 0,
      categoria: (categoria && categoria.trim() !== '') ? categoria.trim() : 'Plato fuerte',
      imagen_url: imagen_url || null,
      disponible: disponible !== undefined ? disponible : true,
    });

    res.status(201).json({ mensaje: 'Plato creado con éxito', plato: nuevoPlato });
  } catch (error) {
    console.error('Error al crear el plato:', error);
    res.status(500).json({ mensaje: 'Error al crear el plato' });
  }
};

// Actualizar un plato existente
exports.actualizarPlato = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, categoria, imagen_url, disponible } = req.body;

    const plato = await Plato.findByPk(id);
    if (!plato) {
      return res.status(404).json({ mensaje: 'Plato no encontrado' });
    }

    await plato.update({
      nombre: nombre !== undefined ? nombre : plato.nombre,
      descripcion: descripcion !== undefined ? descripcion : plato.descripcion,
      precio: precio !== undefined ? parseFloat(precio) : plato.precio,
      categoria: (categoria && categoria.trim() !== '') ? categoria.trim() : plato.categoria,
      imagen_url: imagen_url !== undefined ? imagen_url : plato.imagen_url,
      disponible: disponible !== undefined ? disponible : plato.disponible,
    });

    res.json({ mensaje: 'Plato actualizado correctamente', plato });
  } catch (error) {
    console.error('Error al actualizar el plato:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el plato' });
  }
};

// Eliminar un plato
exports.eliminarPlato = async (req, res) => {
  try {
    const { id } = req.params;

    const plato = await Plato.findByPk(id);
    if (!plato) {
      return res.status(404).json({ mensaje: 'Plato no encontrado' });
    }

    await plato.destroy();
    res.json({ mensaje: 'Plato eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el plato:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el plato' });
  }
};