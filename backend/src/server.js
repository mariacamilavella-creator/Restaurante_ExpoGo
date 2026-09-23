require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ mensaje: 'API Restaurante funcionando 🍽️' }));

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/pedidos', pedidoRoutes);

const PORT = process.env.PORT || 3000;

async function iniciar() {
  await sequelize.sync(); // crea las tablas si no existen
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
  });
}

iniciar();
