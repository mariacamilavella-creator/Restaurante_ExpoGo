const express = require('express');
const router = express.Router();
const {
  crearPedido,
  sincronizarPedidos,
  misPedidos,
  cancelarPedido, // <--- Cambiado para que coincida con el controlador
  listarTodosPedidos,
  actualizarEstadoPedido,
} = require('../controllers/pedidoController');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// Usuario
router.post('/', verificarToken, crearPedido);
router.post('/sincronizar', verificarToken, sincronizarPedidos);
router.get('/mios', verificarToken, misPedidos);
router.put('/:id/cancelar', verificarToken, cancelarPedido);

// Admin
router.get('/', verificarToken, soloAdmin, listarTodosPedidos);
router.put('/:id/estado', verificarToken, soloAdmin, actualizarEstadoPedido);

module.exports = router;