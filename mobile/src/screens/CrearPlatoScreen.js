import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { api } from '../services/api';

export default function CrearPlatoScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('');
  const [cargando, setCargando] = useState(false);

  async function manejarCrear() {
    const precioNumero = Number(precio);

    if (!nombre.trim()) {
      Alert.alert('Falta el nombre', 'Escribe el nombre del plato');
      return;
    }
    if (!precio || Number.isNaN(precioNumero) || precioNumero <= 0) {
      Alert.alert('Precio inválido', 'Ingresa un precio válido mayor a $0');
      return;
    }

    setCargando(true);
    try {
      await api.crearPlato({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: precioNumero,
        categoria: categoria.trim(),
      });
      Alert.alert('Plato creado', `"${nombre.trim()}" se agregó al menú`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('No se pudo crear el plato', error.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Nuevo plato</Text>
        <Text style={styles.subtitulo}>Se agregará al menú y quedará disponible de inmediato</Text>

        <Text style={styles.etiqueta}>Nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Lomo de res a la plancha"
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.etiqueta}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.inputMultilinea]}
          placeholder="Ingredientes, preparación, porción..."
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.etiqueta}>Precio</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 25000"
          keyboardType="numeric"
          value={precio}
          onChangeText={setPrecio}
        />

        <Text style={styles.etiqueta}>Categoría</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Entradas, Fuertes, Postres, Bebidas"
          value={categoria}
          onChangeText={setCategoria}
        />

        <TouchableOpacity
          style={[styles.boton, cargando && styles.botonDeshabilitado]}
          onPress={manejarCrear}
          disabled={cargando}
          activeOpacity={0.85}
        >
          {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botonTexto}>Crear plato</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  titulo: { fontSize: 22, fontWeight: '800', color: '#111' },
  subtitulo: { fontSize: 13, color: '#888', marginTop: 4, marginBottom: 20 },

  etiqueta: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  inputMultilinea: { minHeight: 80, textAlignVertical: 'top' },

  boton: {
    backgroundColor: '#e63946',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 28,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
});