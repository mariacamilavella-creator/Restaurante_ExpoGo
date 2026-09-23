const express = require('express');
const router = express.Router();
const {
  crearPedido,
  sincronizarPedidos,
  misPedidos,
  cancelarPedidoUsuario,
  listarTodosPedidos,
  actualizarEstadoPedido,
} = require('../controllers/pedidoController');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// Usuario
router.post('/', verificarToken, crearPedido);
router.post('/sincronizar', verificarToken, sincronizarPedidos);
router.get('/mios', verificarToken, misPedidos);
router.put('/:id/cancelar', verificarToken, cancelarPedidoUsuario);

// Admin
router.get('/', verificarToken, soloAdmin, listarTodosPedidos);
router.put('/:id/estado', verificarToken, soloAdmin, actualizarEstadoPedido);

module.exports = router;
