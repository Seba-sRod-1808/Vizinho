import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { Home, FileWarning, BarChart3, Calendar, User } from 'lucide-react-native';
import { colors } from '../utils/theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import FeedScreen from '../screens/FeedScreen';
import ReportesScreen from '../screens/ReportesScreen';
import EncuestasScreen from '../screens/EncuestasScreen';
import AreasScreen from '../screens/AreasScreen';
import PerfilScreen from '../screens/PerfilScreen';
import MultasScreen from '../screens/MultasScreen';
import ObjetosPerdidosScreen from '../screens/ObjetosPerdidosScreen';
import NotificacionesScreen from '../screens/NotificacionesScreen';
import AdminScreen from '../screens/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { unreadCount } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[700],
        tabBarInactiveTintColor: colors.stone[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.stone[200],
          borderTopWidth: 0.5,
          height: 85,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Reportes"
        component={ReportesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <FileWarning size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Encuestas"
        component={EncuestasScreen}
        options={{
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Areas"
        component={AreasScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.stone[50] }}>
        <ActivityIndicator size="large" color={colors.primary[700]} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Multas" component={MultasScreen} options={{ headerShown: true, title: 'Multas', headerTintColor: colors.primary[700] }} />
            <Stack.Screen name="ObjetosPerdidos" component={ObjetosPerdidosScreen} options={{ headerShown: true, title: 'Objetos Perdidos', headerTintColor: colors.primary[700] }} />
            <Stack.Screen name="Notificaciones" component={NotificacionesScreen} options={{ headerShown: true, title: 'Notificaciones', headerTintColor: colors.primary[700] }} />
            <Stack.Screen name="Admin" component={AdminScreen} options={{ headerShown: true, title: 'Panel Admin', headerTintColor: colors.primary[700] }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
