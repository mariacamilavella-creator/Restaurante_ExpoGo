import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  async function manejarLogin() {
    if (!email || !password) {
      Alert.alert('Faltan datos', 'Ingresa tu email y contraseña');
      return;
    }
    setCargando(true);
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Error al iniciar sesión', error.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>🍽️ Restaurante App</Text>
      <Text style={styles.subtitulo}>Inicia sesión</Text>

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

      <TouchableOpacity style={styles.boton} onPress={manejarLogin} disabled={cargando}>
        {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botonTexto}>Ingresar</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
        <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  titulo: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subtitulo: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 24 },
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
