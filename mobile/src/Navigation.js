import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from './context/AuthContext';

import LoginScreen from './screens/LoginScreen';
import RegistroScreen from './screens/RegistroScreen';
import MenuScreen from './screens/MenuScreen';
import MisPedidosScreen from './screens/MisPedidosScreen';
import AdminPedidosScreen from './screens/AdminPedidosScreen';
import CrearPlatoScreen from './screens/CrearPlatoScreen';

const Stack = createNativeStackNavigator();

function BotonSalir() {
  const { logout } = useAuth();
  return (
    <TouchableOpacity onPress={logout}>
      <Text style={styles.textoSalir}>Salir</Text>
    </TouchableOpacity>
  );
}

function EncabezadoAdmin({ navigation }) {
  return (
    <View style={styles.contenedorEncabezado}>
      <TouchableOpacity 
        onPress={() => navigation.navigate('CrearPlato')} 
        style={styles.btnCrearPlato}
      >
        <Text style={styles.textoBtnCrear}>+ Crear Plato</Text>
      </TouchableOpacity>
      <BotonSalir />
    </View>
  );
}

function EncabezadoMenu({ navigation }) {
  const { logout } = useAuth();
  return (
    <View style={styles.contenedorEncabezado}>
      <TouchableOpacity onPress={() => navigation.navigate('MisPedidos')} style={{ marginRight: 16 }}>
        <Text style={{ color: '#2a9d8f', fontWeight: '600' }}>Mis Pedidos</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={logout}>
        <Text style={styles.textoSalir}>Salir</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function Navigation() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!usuario ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Registro" component={RegistroScreen} options={{ title: 'Crear cuenta' }} />
          </>
        ) : usuario.rol === 'admin' ? (
          <>
            <Stack.Screen
              name="AdminPedidos"
              component={AdminPedidosScreen}
              options={({ navigation }) => ({
                title: 'Gestión de Pedidos',
                headerRight: () => <EncabezadoAdmin navigation={navigation} />,
              })}
            />
            <Stack.Screen
              name="CrearPlato"
              component={CrearPlatoScreen}
              options={{ title: 'Crear Nuevo Plato' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Menu"
              component={MenuScreen}
              options={({ navigation }) => ({
                title: 'Menú',
                headerRight: () => <EncabezadoMenu navigation={navigation} />,
              })}
            />
            <Stack.Screen name="MisPedidos" component={MisPedidosScreen} options={{ title: 'Mis Pedidos' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centrado: { 
    flex: 1, 
    alignItems: 'center', 
    justify: 'center' 
  },
  contenedorEncabezado: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  btnCrearPlato: {
    backgroundColor: '#2a9d8f',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 12,
  },
  textoBtnCrear: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  textoSalir: { 
    color: '#e63946', 
    fontWeight: '600' 
  },
});