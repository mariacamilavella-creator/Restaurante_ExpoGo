import NetInfo from '@react-native-community/netinfo';
import { api } from './api';
import { obtenerPedidosPendientesDeSync, marcarComoSincronizado } from './db';

// Revisa si hay internet; si lo hay, envía todos los pedidos pendientes
// que se crearon offline (guardados en SQLite) hacia la API.
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
  }));

  const respuesta = await api.sincronizarPedidos(payload);

  for (const p of pendientes) {
    await marcarComoSincronizado(p.uuidCliente);
  }

  return { sincronizados: pendientes.length, resultados: respuesta.resultados };
}

// Se suscribe a cambios de conectividad y sincroniza automáticamente
// apenas el celular recupera internet.
export function escucharConexionYSincronizar(onSync) {
  return NetInfo.addEventListener((estado) => {
    if (estado.isConnected) {
      sincronizarSiHayInternet().then((resultado) => {
        if (onSync) onSync(resultado);
      });
    }
  });
}
