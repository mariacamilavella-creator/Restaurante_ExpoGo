const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

// Módulo 2: Registro
async function registro(req, res) {
  try {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ mensaje: 'Nombre, email y password son obligatorios' });
    }

    const existente = await Usuario.findOne({ where: { email } });
    if (existente) {
      return res.status(409).json({ mensaje: 'Ya existe un usuario con ese email' });
    }

    const hash = await bcrypt.hash(password, 10);
    const usuario = await Usuario.create({
      nombre,
      email,
      password: hash,
      // Solo permitimos crear admin explícitamente si se desea para pruebas;
      // en producción esto normalmente se restringe.
      rol: rol === 'admin' ? 'admin' : 'usuario',
    });

    const token = generarToken(usuario);
    return res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al registrar usuario', error: error.message });
  }
}

// Módulo 1: Login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Email y password son obligatorios' });
    }

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    const token = generarToken(usuario);
    return res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al iniciar sesión', error: error.message });
  }
}

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { registro, login };
