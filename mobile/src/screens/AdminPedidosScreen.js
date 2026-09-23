import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';

const ETIQUETAS_ESTADO = {
  pendiente: { texto: 'Pendiente', color: '#b98900', fondo: '#fff3cd' },
  confirmado: { texto: 'Confirmado', color: '#0f6f63', fondo: '#d7f0ec' },
  en_preparacion: { texto: 'En preparación', color: '#2a5d82', fondo: '#dcebf5' },
  cancelado: { texto: 'Cancelado', color: '#b02a37', fondo: '#fbe0e2' },
  entregado: { texto: 'Entregado', color: '#495057', fondo: '#e9ecef' },
};

// Igual que en la pantalla de "Mis pedidos": el precio de un item puede
// venir en distintos nombres de campo según el origen del dato.
function precioUnitario(it) {
  const candidatos = [it.precio, it.precioUnitario, it.valor, it.valorUnitario, it.price, it.unitPrice];
  for (const c of candidatos) {
    const n = Number(c);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return 0;
}

function cantidadItem(it) {
  const n = Number(it.cantidad ?? it.qty ?? it.quantity);
  return Number.isNaN(n) || n <= 0 ? 1 : n;
}

function subtotalItem(it) {
  return precioUnitario(it) * cantidadItem(it);
}

// El nombre del usuario puede venir como campo plano (usuarioNombre,
// nombreUsuario) o anidado dentro de un objeto `usuario`/`cliente`.
// Antes solo se mostraba el usuarioId ("Usuario 2"), aquí se intenta
// mostrar el nombre real y solo se cae al ID si no hay nombre en el dato.
function nombreUsuario(pedido) {
  const candidatos = [
    pedido.usuarioNombre,
    pedido.nombreUsuario,
    pedido.usuario?.nombre,
    pedido.usuario?.nombreCompleto,
    pedido.cliente?.nombre,
    pedido.clienteNombre,
  ];
  for (const c of candidatos) {
    if (typeof c === 'string' && c.trim().length > 0) return c.trim();
  }
  return `Usuario #${pedido.usuarioId}`;
}

// Antes esta pantalla mostraba `item.total` tal cual venía de la API,
// sin validar nada — si el backend devolvía 0 (o el campo faltaba),
// se mostraba $0 aunque el pedido tuviera items con precio real.
// Ahora: si `item.total` es un número válido y mayor a 0, se usa ese.
// Si no, se recalcula sumando los items como respaldo.
function calcularTotal(pedido) {
  const totalApi = Number(pedido.total);
  if (!Number.isNaN(totalApi) && totalApi > 0) return totalApi;

  const items = pedido.items || [];
  return items.reduce((acc, it) => acc + subtotalItem(it), 0);
}

export default function AdminPedidosScreen({ navigation }) {
  const [pedidos, setPedidos] = useState([]);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await api.listarTodosPedidos();
      setPedidos(data);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  async function cambiarEstado(pedido, estado) {
    try {
      await api.actualizarEstadoPedido(pedido.id, estado);
      cargar();
    } catch (error) {
      Alert.alert('No se pudo actualizar', error.message);
    }
  }

  return (
    <FlatList
      style={styles.contenedor}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      data={pedidos}
      keyExtractor={(item) => String(item.id)}
      ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          tintColor="#e63946"
          onRefresh={async () => {
            setRefrescando(true);
            await cargar();
            setRefrescando(false);
          }}
        />
      }
      ListEmptyComponent={
        <View style={styles.vacioContenedor}>
          <Text style={styles.vacioEmoji}>📭</Text>
          <Text style={styles.vacioTitulo}>No hay pedidos todavía</Text>
        </View>
      }
      renderItem={({ item }) => {
        const etiqueta = ETIQUETAS_ESTADO[item.estado] || ETIQUETAS_ESTADO.pendiente;
        const total = calcularTotal(item);
        const items = item.items || [];

        return (
          <View style={styles.tarjeta}>
            <View style={[styles.barraEstado, { backgroundColor: etiqueta.color }]} />

            <View style={styles.contenidoTarjeta}>
              <View style={styles.encabezadoTarjeta}>
                <Text style={styles.pedidoId}>
                  Pedido #{item.id} <Text style={styles.pedidoUsuario}>· {nombreUsuario(item)}</Text>
                </Text>
                <View style={[styles.pill, { backgroundColor: etiqueta.fondo }]}>
                  <Text style={[styles.pillTexto, { color: etiqueta.color }]}>{etiqueta.texto}</Text>
                </View>
              </View>

              <View style={styles.listaItems}>
                {items.map((it, idx) => (
                  <View key={idx} style={styles.filaItem}>
                    <View style={styles.badgeCantidad}>
                      <Text style={styles.badgeCantidadTexto}>{cantidadItem(it)}</Text>
                    </View>
                    <Text style={styles.nombreItem} numberOfLines={1}>
                      {it.nombre}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.piePedido}>
                <View>
                  <Text style={styles.totalEtiqueta}>Total</Text>
                  <Text style={styles.totalMonto}>${total.toLocaleString()}</Text>
                </View>

                <View style={styles.acciones}>
                  {item.estado === 'pendiente' && (
                    <>
                      <TouchableOpacity
                        style={[styles.boton, styles.confirmar]}
                        activeOpacity={0.85}
                        onPress={() => cambiarEstado(item, 'confirmado')}
                      >
                        <Text style={styles.botonTexto}>Confirmar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.boton, styles.cancelar]}
                        activeOpacity={0.85}
                        onPress={() => cambiarEstado(item, 'cancelado')}
                      >
                        <Text style={styles.botonTexto}>Cancelar</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {item.estado === 'confirmado' && (
                    <TouchableOpacity
                      style={[styles.boton, styles.preparacion]}
                      activeOpacity={0.85}
                      onPress={() => cambiarEstado(item, 'en_preparacion')}
                    >
                      <Text style={styles.botonTexto}>En preparación</Text>
                    </TouchableOpacity>
                  )}
                  {item.estado === 'en_preparacion' && (
                    <TouchableOpacity
                      style={[styles.boton, styles.entregar]}
                      activeOpacity={0.85}
                      onPress={() => cambiarEstado(item, 'entregado')}
                    >
                      <Text style={styles.botonTexto}>Entregado</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f5f5f7' },

  vacioContenedor: { alignItems: 'center', marginTop: 100 },
  vacioEmoji: { fontSize: 44, marginBottom: 10 },
  vacioTitulo: { textAlign: 'center', color: '#333', fontSize: 16, fontWeight: '700' },

  tarjeta: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  barraEstado: { width: 5 },
  contenidoTarjeta: { flex: 1, padding: 16 },

  encabezadoTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  pedidoId: { fontSize: 15, fontWeight: '800', color: '#111', flexShrink: 1 },
  pedidoUsuario: { fontSize: 13, fontWeight: '500', color: '#888' },

  pill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  pillTexto: { fontSize: 12, fontWeight: '700' },

  listaItems: { marginBottom: 14 },
  filaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  badgeCantidad: {
    minWidth: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#fdeaec',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    paddingHorizontal: 4,
  },
  badgeCantidadTexto: { fontSize: 12, fontWeight: '800', color: '#e63946' },
  nombreItem: { flex: 1, fontSize: 15, color: '#222' },

  piePedido: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  totalEtiqueta: { fontSize: 12, color: '#999', marginBottom: 2 },
  totalMonto: { fontSize: 20, fontWeight: '800', color: '#111' },

  acciones: { flexDirection: 'row', gap: 8 },
  boton: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10 },
  confirmar: { backgroundColor: '#2a9d8f' },
  cancelar: { backgroundColor: '#e63946' },
  preparacion: { backgroundColor: '#457b9d' },
  entregar: { backgroundColor: '#6c757d' },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 13 },
});