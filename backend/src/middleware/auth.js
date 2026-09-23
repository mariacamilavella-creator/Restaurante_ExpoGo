const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ mensaje: 'Token no proporcionado' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, rol, email }
    next();
  } catch (err) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
}

function soloAdmin(req, res, next) {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso solo para administradores' });
  }
  next();
}

module.exports = { verificarToken, soloAdmin };
