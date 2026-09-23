import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegistroScreen({ navigation }) {
  const { registro } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  async function manejarRegistro() {
    if (!nombre || !email || !password) {
      Alert.alert('Faltan datos', 'Completa todos los campos');
      return;
    }
    setCargando(true);
    try {
      await registro(nombre, email, password);
    } catch (error) {
      Alert.alert('Error al registrar', error.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Crear cuenta</Text>

      <TextInput style={styles.input} placeholder="Nombre completo" value={nombre} onChangeText={setNombre} />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.boton} onPress={manejarRegistro} disabled={cargando}>
        {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botonTexto}>Registrarme</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Ya tengo cuenta, iniciar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  titulo: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  boton: { backgroundColor: '#e63946', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#e63946', textAlign: 'center', marginTop: 16 },
});
