import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';

const ETIQUETAS_ESTADO = {
  pendiente: { texto: 'Pendiente', color: '#ffb703' },
  confirmado: { texto: 'Confirmado', color: '#2a9d8f' },
  en_preparacion: { texto: 'En preparación', color: '#457b9d' },
  cancelado: { texto: 'Cancelado', color: '#e63946' },
  entregado: { texto: 'Entregado', color: '#6c757d' },
};

export default function AdminPedidosScreen() {
  const [pedidos, setPedidos] = useState([]);

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
      data={pedidos}
      keyExtractor={(item) => String(item.id)}
      ListEmptyComponent={<Text style={styles.vacio}>No hay pedidos todavía</Text>}
      renderItem={({ item }) => {
        const etiqueta = ETIQUETAS_ESTADO[item.estado] || ETIQUETAS_ESTADO.pendiente;
        return (
          <View style={styles.tarjeta}>
            <Text style={styles.pedidoId}>Pedido #{item.id} — Usuario {item.usuarioId}</Text>
            {item.items.map((it, idx) => (
              <Text key={idx} style={styles.item}>
                {it.cantidad}x {it.nombre}
              </Text>
            ))}
            <Text style={styles.total}>Total: ${item.total.toLocaleString()}</Text>
            <Text style={[styles.estado, { color: etiqueta.color }]}>{etiqueta.texto}</Text>

            {item.estado === 'pendiente' && (
              <View style={styles.acciones}>
                <TouchableOpacity style={[styles.boton, styles.confirmar]} onPress={() => cambiarEstado(item, 'confirmado')}>
                  <Text style={styles.botonTexto}>Confirmar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.boton, styles.cancelar]} onPress={() => cambiarEstado(item, 'cancelado')}>
                  <Text style={styles.botonTexto}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}
            {item.estado === 'confirmado' && (
              <TouchableOpacity style={[styles.boton, styles.preparacion]} onPress={() => cambiarEstado(item, 'en_preparacion')}>
                <Text style={styles.botonTexto}>Marcar en preparación</Text>
              </TouchableOpacity>
            )}
            {item.estado === 'en_preparacion' && (
              <TouchableOpacity style={[styles.boton, styles.entregar]} onPress={() => cambiarEstado(item, 'entregado')}>
                <Text style={styles.botonTexto}>Marcar entregado</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fff' },
  vacio: { textAlign: 'center', marginTop: 40, color: '#999' },
  tarjeta: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  pedidoId: { fontWeight: 'bold', marginBottom: 4 },
  item: { fontSize: 15 },
  total: { fontWeight: 'bold', marginTop: 4 },
  estado: { marginTop: 4, fontWeight: '600' },
  acciones: { flexDirection: 'row', marginTop: 10, gap: 8 },
  boton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, marginTop: 10, alignSelf: 'flex-start' },
  confirmar: { backgroundColor: '#2a9d8f' },
  cancelar: { backgroundColor: '#e63946' },
  preparacion: { backgroundColor: '#457b9d' },
  entregar: { backgroundColor: '#6c757d' },
  botonTexto: { color: '#fff', fontWeight: 'bold' },
});
