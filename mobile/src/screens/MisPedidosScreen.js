import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { api } from '../services/api';
import { obtenerPedidosLocales } from '../services/db';
import { sincronizarSiHayInternet } from '../services/sync';

const ETIQUETAS_ESTADO = {
  pendiente: { texto: 'Pendiente', color: '#ffb703' },
  confirmado: { texto: 'Confirmado', color: '#2a9d8f' },
  en_preparacion: { texto: 'En preparación', color: '#457b9d' },
  cancelado: { texto: 'Cancelado', color: '#e63946' },
  entregado: { texto: 'Entregado', color: '#6c757d' },
};

export default function MisPedidosScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    const estadoRed = await NetInfo.fetch();

    if (estadoRed.isConnected) {
      try {
        await sincronizarSiHayInternet();
        const data = await api.misPedidos();
        setPedidos(data.map((p) => ({ ...p, origen: 'servidor' })));
        return;
      } catch {
        // si falla, mostramos lo que haya en local
      }
    }

    const locales = await obtenerPedidosLocales();
    setPedidos(
      locales.map((p) => ({
        id: p.uuidCliente,
        estado: p.sincronizado ? p.estado : 'pendiente',
        total: p.total,
        items: p.items,
        origen: p.sincronizado ? 'servidor' : 'local (sin sincronizar)',
      }))
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  async function cancelar(pedido) {
    if (pedido.origen !== 'servidor') {
      Alert.alert('Aún no sincronizado', 'Este pedido todavía no se ha enviado al servidor. Inténtalo cuando tengas conexión.');
      return;
    }
    try {
      await api.cancelarPedido(pedido.id);
      Alert.alert('Pedido cancelado');
      cargar();
    } catch (error) {
      Alert.alert('No se pudo cancelar', error.message);
    }
  }

  return (
    <FlatList
      style={styles.contenedor}
      data={pedidos}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={async () => {
        setRefrescando(true);
        await cargar();
        setRefrescando(false);
      }} />}
      ListEmptyComponent={<Text style={styles.vacio}>Aún no tienes pedidos</Text>}
      renderItem={({ item }) => {
        const etiqueta = ETIQUETAS_ESTADO[item.estado] || ETIQUETAS_ESTADO.pendiente;
        return (
          <View style={styles.tarjeta}>
            <View style={{ flex: 1 }}>
              {item.items.map((it, idx) => (
                <Text key={idx} style={styles.item}>
                  {it.cantidad}x {it.nombre}
                </Text>
              ))}
              <Text style={styles.total}>Total: ${item.total.toLocaleString()}</Text>
              <Text style={[styles.estado, { color: etiqueta.color }]}>{etiqueta.texto}</Text>
              {item.origen !== 'servidor' && <Text style={styles.pendienteSync}>⏳ Pendiente de sincronizar</Text>}
            </View>
            {item.estado === 'pendiente' && item.origen === 'servidor' && (
              <TouchableOpacity style={styles.botonCancelar} onPress={() => cancelar(item)}>
                <Text style={styles.botonCancelarTexto}>Cancelar</Text>
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
  tarjeta: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  item: { fontSize: 15 },
  total: { fontWeight: 'bold', marginTop: 4 },
  estado: { marginTop: 4, fontWeight: '600' },
  pendienteSync: { marginTop: 4, color: '#e76f51', fontSize: 12 },
  botonCancelar: { backgroundColor: '#e63946', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  botonCancelarTexto: { color: '#fff', fontWeight: 'bold' },
});
