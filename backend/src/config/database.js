const { Sequelize } = require('sequelize');
const path = require('path');

// - En LOCAL (tu computador): usa SQLite automáticamente, no necesitas
//   instalar nada. Ideal para desarrollar y probar rápido.
// - En PRODUCCIÓN (Render, Neon, Railway, etc.): si existe la variable de
//   entorno DATABASE_URL, se usa PostgreSQL en su lugar, porque en esos
//   servidores el disco no es permanente.
//
// El SSL solo se activa si la base de datos NO es local, porque un
// PostgreSQL instalado en tu propio computador normalmente no tiene SSL
// habilitado, mientras que los servicios en la nube (Neon, Render) sí lo
// exigen siempre.
let sequelize;

if (process.env.DATABASE_URL) {
  const esLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: esLocal
      ? {}
      : { ssl: { require: true, rejectUnauthorized: false } },
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false,
  });
}

module.exports = sequelize;