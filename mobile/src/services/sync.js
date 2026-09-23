import NetInfo from '@react-native-community/netinfo';
import { api } from './api';
import { obtenerPedidosPendientesDeSync, marcarComoSincronizado } from './db';

export async function sincronizarSiHayInternet() {
  const estadoRed = await NetInfo.fetch();

  if (!estadoRed.isConnected) {
    return { sincronizados: 0, motivo: 'sin_internet' };
  }

  const pendientes = await obtenerPedidosPendientesDeSync();
  if (pendientes.length === 0) {
    return { sincronizados: 0, motivo: 'nada_pendiente' };
  }

  const payload = pendientes.map((p) => ({
    uuidCliente: p.uuidCliente,
    items: p.items,
    notas: p.notas,
    total: p.total,
  }));

  try {
    const respuesta = await api.sincronizarPedidos(payload);

    // Marcar en SQLite solo los pedidos confirmados por PostgreSQL
    for (const p of pendientes) {
      await marcarComoSincronizado(p.uuidCliente);
    }

    return { sincronizados: pendientes.length, resultados: respuesta?.resultados };
  } catch (error) {
    console.log('Servidor offline. Los pedidos permanecen almacenados en SQLite.');
    return { sincronizados: 0, motivo: 'servidor_offline' };
  }
}

export function escucharConexionYSincronizar(onSync) {
  return NetInfo.addEventListener((estado) => {
    if (estado.isConnected) {
      sincronizarSiHayInternet().then((resultado) => {
        if (onSync && resultado.sincronizados > 0) {
          onSync(resultado);
        }
      });
    }
  });
}