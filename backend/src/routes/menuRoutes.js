const express = require('express');
const router = express.Router();
const { listarPlatos, crearPlato } = require('../controllers/menuController');
const { verificarToken, soloAdmin } = require('../middleware/auth');

router.get('/', verificarToken, listarPlatos);
router.post('/', verificarToken, soloAdmin, crearPlato);

module.exports = router;
