import * as SQLite from 'expo-sqlite';

let dbInstance = null;

export async function abrirDB() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('restaurante_v2.db');
    await dbInstance.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS pedidos_local (
        uuidCliente TEXT PRIMARY KEY NOT NULL,
        items TEXT NOT NULL,
        notas TEXT,
        total REAL NOT NULL,
        estado TEXT NOT NULL DEFAULT 'pendiente',
        sincronizado INTEGER NOT NULL DEFAULT 0,
        creadoEn TEXT NOT NULL
      );
    `);
  }
  return dbInstance;
}

// Guarda un pedido localmente (se ejecuta SIEMPRE antes de intentar subir al servidor)
export async function guardarPedidoLocal(pedido) {
  const db = await abrirDB();
  await db.runAsync(
    `INSERT INTO pedidos_local (uuidCliente, items, notas, total, estado, sincronizado, creadoEn)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [
      pedido.uuidCliente,
      JSON.stringify(pedido.items),
      pedido.notas || null,
      pedido.total,
      'pendiente',
      new Date().toISOString(),
    ]
  );
}

// Obtener todos los pedidos guardados localmente
export async function obtenerPedidosLocales() {
  const db = await abrirDB();
  const filas = await db.getAllAsync(`SELECT * FROM pedidos_local ORDER BY creadoEn DESC`);
  return filas.map((f) => ({ ...f, items: JSON.parse(f.items) }));
}

// Pedidos que aún no se han enviado al backend Node.js / PostgreSQL
export async function obtenerPedidosPendientesDeSync() {
  const db = await abrirDB();
  const filas = await db.getAllAsync(`SELECT * FROM pedidos_local WHERE sincronizado = 0`);
  return filas.map((f) => ({ ...f, items: JSON.parse(f.items) }));
}

// Marcar pedido como sincronizado en SQLite
export async function marcarComoSincronizado(uuidCliente) {
  const db = await abrirDB();
  await db.runAsync(`UPDATE pedidos_local SET sincronizado = 1 WHERE uuidCliente = ?`, [uuidCliente]);
}