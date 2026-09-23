import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ IMPORTANTE: reemplaza esto por la IP de tu computador en la red local
// (donde corre el backend), por ejemplo 'http://192.168.1.15:3000/api'.
// 'localhost' NO funciona desde el celular físico ni desde Expo Go.
export const API_URL = 'http://192.168.1.9:3000/api';

async function getToken() {
  return AsyncStorage.getItem('token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const respuesta = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(data.mensaje || 'Error en la petición al servidor');
  }
  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  registro: (nombre, email, password) =>
    request('/auth/registro', { method: 'POST', body: { nombre, email, password }, auth: false }),

  listarMenu: () => request('/menu'),

  crearPedido: (pedido) => request('/pedidos', { method: 'POST', body: pedido }),
  sincronizarPedidos: (pedidos) => request('/pedidos/sincronizar', { method: 'POST', body: { pedidos } }),
  misPedidos: () => request('/pedidos/mios'),
  cancelarPedido: (id) => request(`/pedidos/${id}/cancelar`, { method: 'PUT' }),

  listarTodosPedidos: () => request('/pedidos'),
  actualizarEstadoPedido: (id, estado) => request(`/pedidos/${id}/estado`, { method: 'PUT', body: { estado } }),
};
