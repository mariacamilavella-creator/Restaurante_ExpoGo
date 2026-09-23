import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import Navigation from './src/Navigation';
import { escucharConexionYSincronizar } from './src/services/sync';

export default function App() {
  useEffect(() => {
    // Apenas el celular recupera internet, se sincronizan automáticamente
    // los pedidos que se hicieron offline.
    const unsubscribe = escucharConexionYSincronizar((resultado) => {
      if (resultado.sincronizados > 0) {
        console.log(`${resultado.sincronizados} pedido(s) sincronizado(s) automáticamente`);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Navigation />
    </AuthProvider>
  );
}