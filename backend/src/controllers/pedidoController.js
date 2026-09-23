const { Pedido, sequelize } = require('../models');

// 1. Crear Pedido
const crearPedido = async (req, res) => {
  try {
    const { uuidCliente, items, notas, total } = req.body;
    const usuarioId = req.usuario ? req.usuario.id : 1; 

    const nuevoPedido = await Pedido.create({
      uuidCliente: uuidCliente || null,
      usuarioId,
      notas: notas || '',
      total: total || 0,
      estado: 'pendiente',
      items: typeof items === 'string' ? items : JSON.stringify(items || []),
    });

    res.status(201).json({ mensaje: 'Pedido creado exitosamente', pedido: nuevoPedido });
  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ mensaje: 'Error al crear pedido' });
  }
};

// 2. Sincronizar Pedidos en Bloque (Offline -> PostgreSQL)
const sincronizarPedidos = async (req, res) => {
  const { pedidos } = req.body;

  if (!pedidos || !Array.isArray(pedidos)) {
    return res.status(400).json({ mensaje: 'Arreglo de pedidos no válido' });
  }

  let procesados = 0;
  let ignorados = 0;

  for (const p of pedidos) {
    // Cada pedido maneja su propia transacción independiente
    const t = await sequelize.transaction();
    try {
      if (p.uuidCliente) {
        const existente = await Pedido.findOne({
          where: { uuidCliente: p.uuidCliente },
          transaction: t,
        });

        if (existente) {
          await t.rollback();
          ignorados++;
          continue; // Salta el pedido duplicado
        }
      }

      const usuarioId = req.usuario ? req.usuario.id : (p.usuarioId || 1);

      await Pedido.create(
        {
          uuidCliente: p.uuidCliente || null,
          usuarioId: usuarioId,
          notas: p.notas || '',
          total: p.total || 0,
          estado: 'pendiente',
          items: typeof p.items === 'string' ? p.items : JSON.stringify(p.items || []),
        },
        { transaction: t }
      );

      await t.commit();
      procesados++;
    } catch (error) {
      await t.rollback();
      // Si ocurre una restricción de unicidad, se cuenta como ignorado sin detener el servidor
      if (error.name === 'SequelizeUniqueConstraintError') {
        ignorados++;
      } else {
        console.error('Error al procesar un pedido individual:', error.message);
      }
    }
  }

  res.status(200).json({
    mensaje: 'Sincronización completada con éxito',
    procesados,
    ignorados,
  });
};

// 3. Mis Pedidos
const misPedidos = async (req, res) => {
  try {
    const usuarioId = req.usuario ? req.usuario.id : null;
    const pedidos = await Pedido.findAll({
      where: usuarioId ? { usuarioId } : {},
      order: [['createdAt', 'DESC']],
    });

    const pedidosFormateados = pedidos.map((p) => {
      const jsonPedido = p.toJSON();
      if (typeof jsonPedido.items === 'string') {
        try {
          jsonPedido.items = JSON.parse(jsonPedido.items);
        } catch (e) {
          jsonPedido.items = [];
        }
      }
      return jsonPedido;
    });

    res.json(pedidosFormateados);
  } catch (error) {
    console.error('Error al obtener mis pedidos:', error);
    res.status(500).json({ mensaje: 'Error al obtener pedidos' });
  }
};

// 4. Cancelar Pedido
const cancelarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    await Pedido.update({ estado: 'cancelado' }, { where: { id } });
    res.json({ mensaje: 'Pedido cancelado correctamente' });
  } catch (error) {
    console.error('Error al cancelar pedido:', error);
    res.status(500).json({ mensaje: 'Error al cancelar pedido' });
  }
};

// 5. Listar Todos los Pedidos (Admin)
const listarTodosPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.findAll({
      order: [['createdAt', 'DESC']],
    });

    const pedidosFormateados = pedidos.map((p) => {
      const jsonPedido = p.toJSON();
      if (typeof jsonPedido.items === 'string') {
        try {
          jsonPedido.items = JSON.parse(jsonPedido.items);
        } catch (e) {
          jsonPedido.items = [];
        }
      }
      return jsonPedido;
    });

    res.json(pedidosFormateados);
  } catch (error) {
    console.error('Error al listar pedidos:', error);
    res.status(500).json({ mensaje: 'Error al listar pedidos' });
  }
};

// 6. Actualizar Estado de Pedido (Admin)
const actualizarEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    await Pedido.update({ estado }, { where: { id } });
    res.json({ mensaje: 'Estado actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ mensaje: 'Error al actualizar estado' });
  }
};

module.exports = {
  crearPedido,
  sincronizarPedidos,
  misPedidos,
  cancelarPedido,
  listarTodosPedidos,
  actualizarEstadoPedido,
};