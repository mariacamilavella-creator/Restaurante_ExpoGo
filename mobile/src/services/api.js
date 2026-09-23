import AsyncStorage from '@react-native-async-storage/async-storage';

// Cambia esta IP por la IP local de tu máquina en la red Wi-Fi
export const API_URL = 'http://10.137.214.76:3000/api';

async function getToken() {
  return AsyncStorage.getItem('token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const respuesta = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      throw new Error(data.mensaje || `Error en el servidor (${respuesta.status})`);
    }

    return data;
  } catch (error) {
    // Si la conexión falla porque el backend Node.js está apagado
    if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
      console.warn(`[Offline] Servidor inalcanzable en ${path}`);
      throw new Error('SERVIDOR_OFFLINE');
    }
    throw error;
  }
}

export const api = {
  // Autenticación
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),

  registro: (nombre, email, password) =>
    request('/auth/registro', { method: 'POST', body: { nombre, email, password }, auth: false }),

  // Menú
  listarMenu: () => request('/menu'),
  crearPlato: (plato) => request('/menu', { method: 'POST', body: plato }),

  // Pedidos
  crearPedido: (pedido) => request('/pedidos', { method: 'POST', body: pedido }),
  sincronizarPedidos: (pedidos) => request('/pedidos/sincronizar', { method: 'POST', body: { pedidos } }),
  misPedidos: () => request('/pedidos/mios'),
  cancelarPedido: (id) => request(`/pedidos/${id}/cancelar`, { method: 'PUT' }),

  // Administrador
  listarTodosPedidos: () => request('/pedidos'),
  actualizarEstadoPedido: (id, estado) => request(`/pedidos/${id}/estado`, { method: 'PUT', body: { estado } }),
};