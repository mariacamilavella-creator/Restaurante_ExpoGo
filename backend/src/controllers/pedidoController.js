const { Pedido } = require('../models');

const ESTADOS_VALIDOS = ['pendiente', 'confirmado', 'en_preparacion', 'cancelado', 'entregado'];

// Crea un pedido nuevo (usado cuando el celular tiene internet al momento de pedir)
async function crearPedido(req, res) {
  try {
    const { uuidCliente, items, total, notas } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ mensaje: 'El pedido debe tener al menos un producto' });
    }

    // Si ya existe un pedido con ese uuidCliente, lo devolvemos tal cual
    // en vez de crear uno duplicado (evita duplicados por reintentos).
    if (uuidCliente) {
      const existente = await Pedido.findOne({ where: { uuidCliente } });
      if (existente) {
        return res.status(200).json(existente);
      }
    }

    const pedido = await Pedido.create({
      uuidCliente: uuidCliente || null,
      usuarioId: req.usuario.id,
      items,
      total,
      notas: notas || '',
    });

    res.status(201).json(pedido);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear pedido', error: error.message });
  }
}

// Recibe un arreglo de pedidos que se hicieron sin conexión (guardados en
// SQLite local) y los crea en el servidor, uno por uno, evitando duplicados
// gracias al uuidCliente generado en el celular.
async function sincronizarPedidos(req, res) {
  try {
    const { pedidos } = req.body;

    if (!Array.isArray(pedidos)) {
      return res.status(400).json({ mensaje: 'Se esperaba un arreglo de pedidos en "pedidos"' });
    }

    const resultados = [];

    for (const p of pedidos) {
      let pedido = p.uuidCliente
        ? await Pedido.findOne({ where: { uuidCliente: p.uuidCliente } })
        : null;

      if (!pedido) {
        pedido = await Pedido.create({
          uuidCliente: p.uuidCliente || null,
          usuarioId: req.usuario.id,
          items: p.items,
          total: p.total,
          notas: p.notas || '',
        });
      }

      resultados.push(pedido);
    }

    res.json(resultados);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al sincronizar pedidos', error: error.message });
  }
}

// Lista los pedidos del usuario que hizo la petición (perfil usuario)
async function misPedidos(req, res) {
  try {
    const pedidos = await Pedido.findAll({
      where: { usuarioId: req.usuario.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener tus pedidos', error: error.message });
  }
}

// Cancela un pedido propio (solo si sigue pendiente, y solo el dueño)
async function cancelarPedidoUsuario(req, res) {
  try {
    const pedido = await Pedido.findByPk(req.params.id);

    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }
    if (pedido.usuarioId !== req.usuario.id) {
      return res.status(403).json({ mensaje: 'No puedes cancelar un pedido que no es tuyo' });
    }
    if (pedido.estado !== 'pendiente') {
      return res.status(400).json({ mensaje: 'Solo se pueden cancelar pedidos en estado pendiente' });
    }

    pedido.estado = 'cancelado';
    await pedido.save();

    res.json(pedido);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cancelar pedido', error: error.message });
  }
}

// Lista TODOS los pedidos (perfil administrador)
async function listarTodosPedidos(req, res) {
  try {
    const pedidos = await Pedido.findAll({ order: [['createdAt', 'DESC']] });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar pedidos', error: error.message });
  }
}

// Cambia el estado de un pedido (perfil administrador): confirmar, poner en
// preparación, cancelar o marcar como entregado.
async function actualizarEstadoPedido(req, res) {
  try {
    const { estado } = req.body;

    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ mensaje: `Estado inválido. Usa uno de: ${ESTADOS_VALIDOS.join(', ')}` });
    }

    const pedido = await Pedido.findByPk(req.params.id);
    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    pedido.estado = estado;
    await pedido.save();

    res.json(pedido);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar estado del pedido', error: error.message });
  }
}

module.exports = {
  crearPedido,
  sincronizarPedidos,
  misPedidos,
  cancelarPedidoUsuario,
  listarTodosPedidos,
  actualizarEstadoPedido,
};