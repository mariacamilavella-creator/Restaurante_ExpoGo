import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl, ScrollView } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../services/api';
import { guardarPedidoLocal } from '../services/db';
import { sincronizarSiHayInternet } from '../services/sync';

// Menú de respaldo para poder pedir aunque nunca se haya podido
// descargar el menú desde el servidor (offline desde el primer uso).
const MENU_RESPALDO = [
  { id: 'r1', nombre: 'Hamburguesa clásica', descripcion: 'Carne, queso, lechuga y tomate', precio: 18000, categoria: 'Plato fuerte' },
  { id: 'r2', nombre: 'Pizza margarita', descripcion: 'Salsa de tomate, mozzarella y albahaca', precio: 25000, categoria: 'Plato fuerte' },
  { id: 'r3', nombre: 'Ensalada César', descripcion: 'Lechuga, pollo, crutones y aderezo césar', precio: 14000, categoria: 'Entrada' },
  { id: 'r4', nombre: 'Limonada natural', descripcion: 'Limonada fresca de la casa', precio: 6000, categoria: 'Bebida' },
];

// Orden en el que queremos que aparezcan las pestañas de categoría.
// Cualquier categoría que no esté en esta lista aparece al final.
const ORDEN_CATEGORIAS = ['Entrada', 'Plato fuerte', 'Bebida', 'Postre'];

function obtenerCategoriasOrdenadas(platos) {
  const presentes = [...new Set(platos.map((p) => p.categoria || 'Otros'))];
  return presentes.sort((a, b) => {
    const posA = ORDEN_CATEGORIAS.indexOf(a);
    const posB = ORDEN_CATEGORIAS.indexOf(b);
    if (posA === -1 && posB === -1) return a.localeCompare(b);
    if (posA === -1) return 1;
    if (posB === -1) return -1;
    return posA - posB;
  });
}

export default function MenuScreen() {
  const [menu, setMenu] = useState(MENU_RESPALDO);
  const [carrito, setCarrito] = useState({}); // { platoId: cantidad }
  const [sinConexion, setSinConexion] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState(null);

  const cargarMenu = useCallback(async () => {
    const estadoRed = await NetInfo.fetch();
    setSinConexion(!estadoRed.isConnected);
    if (estadoRed.isConnected) {
      try {
        const data = await api.listarMenu();
        if (data.length > 0) setMenu(data);
      } catch {
        // si falla, seguimos con el menú de respaldo / el último cargado
      }
    }
  }, []);

  useEffect(() => {
    cargarMenu();
  }, [cargarMenu]);

  const categorias = useMemo(() => obtenerCategoriasOrdenadas(menu), [menu]);

  // Cuando el menú cambia (por ejemplo llega de la API), si no hay
  // categoría activa todavía, o la que estaba activa ya no existe,
  // seleccionamos la primera disponible automáticamente.
  useEffect(() => {
    if (categorias.length === 0) return;
    if (!categoriaActiva || !categorias.includes(categoriaActiva)) {
      setCategoriaActiva(categorias[0]);
    }
  }, [categorias, categoriaActiva]);

  const platosFiltrados = useMemo(
    () => menu.filter((p) => (p.categoria || 'Otros') === categoriaActiva),
    [menu, categoriaActiva]
  );

  function cambiarCantidad(platoId, delta) {
    setCarrito((prev) => {
      const actual = prev[platoId] || 0;
      const nueva = Math.max(0, actual + delta);
      return { ...prev, [platoId]: nueva };
    });
  }

  async function confirmarPedido() {
    const items = Object.entries(carrito)
      .filter(([, cantidad]) => cantidad > 0)
      .map(([platoId, cantidad]) => {
        const plato = menu.find((p) => String(p.id) === String(platoId));
        return { platoId, nombre: plato.nombre, precio: plato.precio, cantidad };
      });

    if (items.length === 0) {
      Alert.alert('Carrito vacío', 'Agrega al menos un plato');
      return;
    }

    const total = items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
    const uuidCliente = uuidv4();
    const pedido = { uuidCliente, items, notas: '', total };

    // 1) SIEMPRE se guarda primero en SQLite local (offline-first)
    await guardarPedidoLocal(pedido);
    setCarrito({});

    // 2) Si hay internet, se intenta sincronizar de inmediato
    const estadoRed = await NetInfo.fetch();
    if (estadoRed.isConnected) {
      try {
        await sincronizarSiHayInternet();
        Alert.alert('Pedido enviado', 'Tu pedido fue creado y enviado al restaurante ✅');
        return;
      } catch (error) {
        // si falla la sync, no pasa nada: queda pendiente y se reintentará
      }
    }
    Alert.alert(
      'Pedido guardado sin conexión',
      'No hay internet. Tu pedido se guardó en el celular y se enviará automáticamente cuando recuperes la conexión.'
    );
  }

  const totalCarrito = Object.entries(carrito).reduce((acc, [platoId, cantidad]) => {
    const plato = menu.find((p) => String(p.id) === String(platoId));
    return acc + (plato ? plato.precio * cantidad : 0);
  }, 0);

  return (
    <View style={styles.contenedor}>
      {sinConexion && (
        <View style={styles.bannerOffline}>
          <Text style={styles.bannerTexto}>📴 Sin conexión — modo offline (los pedidos se guardan localmente)</Text>
        </View>
      )}

      {/* Pestañas de categoría */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filaPestanas}
        contentContainerStyle={{ paddingHorizontal: 12 }}
      >
        {categorias.map((categoria) => {
          const activa = categoria === categoriaActiva;
          return (
            <TouchableOpacity
              key={categoria}
              onPress={() => setCategoriaActiva(categoria)}
              style={[styles.pestana, activa && styles.pestanaActiva]}
            >
              <Text style={[styles.textoPestana, activa && styles.textoPestanaActiva]}>
                {categoria}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={platosFiltrados}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={async () => {
          setRefrescando(true);
          await cargarMenu();
          setRefrescando(false);
        }} />}
        ListEmptyComponent={
          <Text style={styles.textoVacio}>No hay platos en esta categoría todavía.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.fila}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.nombrePlato}>{item.nombre}</Text>
              {!!item.descripcion && (
                <Text style={styles.descripcionPlato} numberOfLines={2}>{item.descripcion}</Text>
              )}
              <Text style={styles.precioPlato}>${item.precio.toLocaleString()}</Text>
            </View>
            <View style={styles.controlCantidad}>
              <TouchableOpacity style={styles.botonCantidad} onPress={() => cambiarCantidad(item.id, -1)}>
                <Text style={styles.botonCantidadTexto}>-</Text>
              </TouchableOpacity>
              <Text style={styles.cantidad}>{carrito[item.id] || 0}</Text>
              <TouchableOpacity style={styles.botonCantidad} onPress={() => cambiarCantidad(item.id, 1)}>
                <Text style={styles.botonCantidadTexto}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {totalCarrito > 0 && (
        <TouchableOpacity style={styles.botonConfirmar} onPress={confirmarPedido}>
          <Text style={styles.botonConfirmarTexto}>Hacer pedido — ${totalCarrito.toLocaleString()}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fff' },
  bannerOffline: { backgroundColor: '#ffb703', padding: 10 },
  bannerTexto: { textAlign: 'center', fontWeight: '600' },
  filaPestanas: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  pestana: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f1f1f1',
    marginRight: 8,
  },
  pestanaActiva: {
    backgroundColor: '#e63946',
  },
  textoPestana: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  textoPestanaActiva: {
    color: '#fff',
  },
  textoVacio: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  nombrePlato: { fontSize: 16, fontWeight: '600' },
  descripcionPlato: { color: '#888', fontSize: 13, marginTop: 2 },
  precioPlato: { color: '#e63946', fontWeight: '600', marginTop: 6 },
  controlCantidad: { flexDirection: 'row', alignItems: 'center' },
  botonCantidad: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e63946',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonCantidadTexto: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cantidad: { width: 30, textAlign: 'center', fontSize: 16 },
  botonConfirmar: { backgroundColor: '#2a9d8f', padding: 16, margin: 16, borderRadius: 8, alignItems: 'center' },
  botonConfirmarTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});