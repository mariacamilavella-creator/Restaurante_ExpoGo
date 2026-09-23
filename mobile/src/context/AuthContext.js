import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      const guardado = await AsyncStorage.getItem('usuario');
      if (guardado) setUsuario(JSON.parse(guardado));
      setCargando(false);
    })();
  }, []);

  async function login(email, password) {
    const data = await api.login(email, password);
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
  }

  async function registro(nombre, email, password) {
    const data = await api.registro(nombre, email, password);
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
  }

  async function logout() {
    await AsyncStorage.multiRemove(['token', 'usuario']);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, registro, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
