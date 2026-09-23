import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { api } from '../services/api';
import { obtenerPedidosLocales } from '../services/db';
import { sincronizarSiHayInternet } from '../services/sync';

const ETIQUETAS_ESTADO = {
  pendiente: { texto: 'Pendiente', color: '#b98900', fondo: '#fff3cd' },
  confirmado: { texto: 'Confirmado', color: '#0f6f63', fondo: '#d7f0ec' },
  en_preparacion: { texto: 'En preparación', color: '#2a5d82', fondo: '#dcebf5' },
  cancelado: { texto: 'Cancelado', color: '#b02a37', fondo: '#fbe0e2' },
  entregado: { texto: 'Entregado', color: '#495057', fondo: '#e9ecef' },
};

function calcularTotal(items) {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((acc, it) => acc + (it.precio || 0) * (it.cantidad || 0), 0);
}

function parsearItems(items) {
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    try {
      return JSON.parse(items);
    } catch {
      return [];
    }
  }
  return [];
}

// Limita el tiempo de espera a la API para no congelar la interfaz
const ejecutarConTimeout = (promesa, ms = 2000) => {
  return Promise.race([
    promesa,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de conexión')), ms)),
  ]);
};

export default function MisPedidosScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [modoOffline, setModoOffline] = useState(false);

  const cargar = useCallback(async () => {
    let locales = [];
    
    // 1. Obtiene primero los pedidos locales guardados en SQLite
    try {
      const datosRaw = await obtenerPedidosLocales();
      locales = (datosRaw || []).map((p) => ({
        ...p,
        items: parsearItems(p.items),
      }));
    } catch (e) {
      console.error('Error cargando SQLite local:', e);
    }

    let conexionRed = false;
    try {
      const estadoRed = await NetInfo.fetch();
      conexionRed = !!estadoRed.isConnected;
    } catch {
      conexionRed = false;
    }

    // 2. Intenta conectarse al backend si detecta conexión a internet
    if (conexionRed) {
      try {
        await ejecutarConTimeout(sincronizarSiHayInternet(), 2000);
        const data = await ejecutarConTimeout(api.misPedidos(), 2000);

        const pedidosServidor = data.map((p) => ({
          ...p,
          items: parsearItems(p.items),
          origen: 'servidor',
          sincronizado: 1,
        }));

        setPedidos(pedidosServidor);
        setModoOffline(false);
        setCargandoInicial(false);
        return;
      } catch (err) {
        console.log('Servidor offline o fuera de tiempo:', err.message);
      }
    }

    // 3. Si no hay conexión o el servidor falló, muestra los de SQLite
    setModoOffline(true);
    setPedidos(
      locales.map((p) => ({
        id: p.uuidCliente || String(p.id),
        uuidCliente: p.uuidCliente,
        estado: p.sincronizado ? p.estado : 'pendiente',
        total: p.total,
        items: p.items,
        sincronizado: p.sincronizado,
        origen: p.sincronizado ? 'servidor' : 'local (sin sincronizar)',
      }))
    );
    setCargandoInicial(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  async function cancelar(pedido) {
    if (pedido.origen !== 'servidor') {
      Alert.alert('Sin sincronizar', 'Este pedido aún no se ha subido al servidor. Conéctate antes de cancelarlo.');
      return;
    }
    Alert.alert('Cancelar pedido', '¿Seguro que quieres cancelar este pedido?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.cancelarPedido(pedido.id);
            cargar();
          } catch (error) {
            Alert.alert('No se pudo cancelar', error.message);
          }
        },
      },
    ]);
  }

  if (cargandoInicial) {
    return (
      <View style={[styles.contenedor, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#e63946" />
        <Text style={{ marginTop: 10, color: '#666' }}>Cargando pedidos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      {modoOffline && (
        <View style={styles.bannerOffline}>
          <Text style={styles.bannerTexto}>⚠️ Servidor desconectado: Mostrando pedidos de SQLite</Text>
        </View>
      )}

      <FlatList
        contentContainerStyle={{ padding: 12 }}
        data={pedidos}
        keyExtractor={(item, index) => String(item.id || item.uuidCliente || index)}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={async () => {
              setRefrescando(true);
              await cargar();
              setRefrescando(false);
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.vacioContenedor}>
            <Text style={styles.vacioEmoji}>🧾</Text>
            <Text style={styles.vacio}>Aún no tienes pedidos</Text>
          </View>
        }
        renderItem={({ item }) => {
          const etiqueta = ETIQUETAS_ESTADO[item.estado] || ETIQUETAS_ESTADO.pendiente;
          const totalCalculado = calcularTotal(item.items) || item.total || 0;
          const puedeCancelar = item.estado === 'pendiente' && item.origen === 'servidor';

          return (
            <View style={styles.tarjeta}>
              <View style={styles.encabezadoTarjeta}>
                <View style={[styles.pill, { backgroundColor: etiqueta.fondo }]}>
                  <Text style={[styles.pillTexto, { color: etiqueta.color }]}>{etiqueta.texto}</Text>
                </View>
                {(item.sincronizado === 0 || item.sincronizado === false) && (
                  <View style={[styles.pill, styles.pillSync]}>
                    <Text style={styles.pillSyncTexto}>⏳ Sin sincronizar</Text>
                  </View>
                )}
              </View>

              <View style={styles.listaItems}>
                {item.items && item.items.length > 0 ? (
                  item.items.map((it, idx) => (
                    <View key={idx} style={styles.filaItem}>
                      <Text style={styles.cantidadItem}>{it.cantidad}x</Text>
                      <Text style={styles.nombreItem} numberOfLines={1}>
                        {it.nombre}
                      </Text>
                      <Text style={styles.subtotalItem}>
                        ${((it.precio || 0) * (it.cantidad || 1)).toLocaleString()}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: '#888', fontStyle: 'italic' }}>Sin detalles de productos</Text>
                )}
              </View>

              <View style={styles.piePedido}>
                <Text style={styles.totalTexto}>
                  Total <Text style={styles.totalMonto}>${totalCalculado.toLocaleString()}</Text>
                </Text>

                {puedeCancelar && (
                  <TouchableOpacity style={styles.botonCancelar} onPress={() => cancelar(item)}>
                    <Text style={styles.botonCancelarTexto}>Cancelar pedido</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#f5f5f7' },
  bannerOffline: { backgroundColor: '#fff3cd', padding: 8, alignItems: 'center', borderBottomWidth: 1, borderColor: '#ffebaa' },
  bannerTexto: { color: '#856404', fontSize: 12, fontWeight: 'bold' },
  vacioContenedor: { alignItems: 'center', marginTop: 80 },
  vacioEmoji: { fontSize: 40, marginBottom: 8 },
  vacio: { textAlign: 'center', color: '#999', fontSize: 15 },
  tarjeta: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  encabezadoTarjeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, alignSelf: 'flex-start' },
  pillTexto: { fontSize: 12, fontWeight: '700' },
  pillSync: { backgroundColor: '#ffe8d9' },
  pillSyncTexto: { fontSize: 11, fontWeight: '600', color: '#c1602c' },
  listaItems: { marginBottom: 12 },
  filaItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  cantidadItem: { width: 30, fontWeight: '700', color: '#e63946' },
  nombreItem: { flex: 1, fontSize: 15, color: '#222' },
  subtotalItem: { fontSize: 14, color: '#666' },
  piePedido: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalTexto: { fontSize: 14, color: '#555' },
  totalMonto: { fontSize: 17, fontWeight: '800', color: '#111' },
  botonCancelar: { backgroundColor: '#e63946', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  botonCancelarTexto: { color: '#fff', fontWeight: '700', fontSize: 13 },
});