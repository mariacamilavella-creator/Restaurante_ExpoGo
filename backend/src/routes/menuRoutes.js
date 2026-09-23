const express = require('express');
const router = express.Router();
const { 
  listarPlatos, 
  crearPlato, 
  actualizarPlato, 
  eliminarPlato 
} = require('../controllers/menuController');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// Obtener el menú completo
router.get('/', verificarToken, listarPlatos);

// Crear plato (Soporta peticiones enviadas a '/' o a '/platos')
router.post('/', verificarToken, soloAdmin, crearPlato);
router.post('/platos', verificarToken, soloAdmin, crearPlato);

// Actualizar y eliminar platos por ID
router.put('/platos/:id', verificarToken, soloAdmin, actualizarPlato);
router.delete('/platos/:id', verificarToken, soloAdmin, eliminarPlato);

module.exports = router;