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

const Stack = createNativeStackNavigator();

function BotonSalir() {
  const { logout } = useAuth();
  return (
    <TouchableOpacity onPress={logout} style={{ marginRight: 12 }}>
      <Text style={{ color: '#e63946', fontWeight: '600' }}>Salir</Text>
    </TouchableOpacity>
  );
}

function EncabezadoMenu({ navigation }) {
  const { logout } = useAuth();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TouchableOpacity onPress={() => navigation.navigate('MisPedidos')} style={{ marginRight: 16 }}>
        <Text style={{ color: '#2a9d8f', fontWeight: '600' }}>Mis Pedidos</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={logout}>
        <Text style={{ color: '#e63946', fontWeight: '600' }}>Salir</Text>
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
          <Stack.Screen
            name="AdminPedidos"
            component={AdminPedidosScreen}
            options={{ title: 'Gestión de Pedidos', headerRight: BotonSalir }}
          />
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
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
