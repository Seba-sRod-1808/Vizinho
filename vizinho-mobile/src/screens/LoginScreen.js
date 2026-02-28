import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { colors, spacing, radius } from '../utils/theme';

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', email: '', nombre_completo: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(form);
      } else {
        await login(form.username, form.password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.primary[700] }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={{ flex: 0.35, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.white }}>V</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.white, letterSpacing: -0.5 }}>Vizinho</Text>
          <Text style={{ fontSize: 14, color: colors.primary[200], marginTop: 4 }}>Tu comunidad, conectada</Text>
        </View>

        {/* Card */}
        <ScrollView
          style={{ flex: 0.65, backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
          contentContainerStyle={{ padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.stone[900], marginBottom: 4 }}>
            {isRegister ? 'Crear cuenta' : 'Bienvenido'}
          </Text>
          <Text style={{ fontSize: 14, color: colors.stone[500], marginBottom: 24 }}>
            {isRegister ? 'Registrate para unirte a tu comunidad' : 'Inicia sesion en tu comunidad'}
          </Text>

          {error ? (
            <View style={{ backgroundColor: colors.danger[50], padding: 12, borderRadius: radius.lg, marginBottom: 16 }}>
              <Text style={{ color: colors.danger[600], fontSize: 13, fontWeight: '500' }}>{error}</Text>
            </View>
          ) : null}

          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.stone[700], marginBottom: 6 }}>Usuario</Text>
          <TextInput
            value={form.username}
            onChangeText={v => setForm({ ...form, username: v })}
            placeholder="Tu nombre de usuario"
            placeholderTextColor={colors.stone[400]}
            autoCapitalize="none"
            style={{ height: 48, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, fontSize: 15, color: colors.stone[900], marginBottom: 16 }}
          />

          {isRegister && (
            <>
              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.stone[700], marginBottom: 6 }}>Correo</Text>
              <TextInput
                value={form.email}
                onChangeText={v => setForm({ ...form, email: v })}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={colors.stone[400]}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ height: 48, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, fontSize: 15, color: colors.stone[900], marginBottom: 16 }}
              />
              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.stone[700], marginBottom: 6 }}>Nombre completo</Text>
              <TextInput
                value={form.nombre_completo}
                onChangeText={v => setForm({ ...form, nombre_completo: v })}
                placeholder="Juan Perez"
                placeholderTextColor={colors.stone[400]}
                style={{ height: 48, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, fontSize: 15, color: colors.stone[900], marginBottom: 16 }}
              />
            </>
          )}

          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.stone[700], marginBottom: 6 }}>Contrasena</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 48, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, marginBottom: 24 }}>
            <TextInput
              value={form.password}
              onChangeText={v => setForm({ ...form, password: v })}
              placeholder="Tu contrasena"
              placeholderTextColor={colors.stone[400]}
              secureTextEntry={!showPwd}
              style={{ flex: 1, paddingHorizontal: 16, fontSize: 15, color: colors.stone[900] }}
            />
            <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={{ padding: 12 }}>
              {showPwd ? <EyeOff size={20} color={colors.stone[400]} /> : <Eye size={20} color={colors.stone[400]} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
            style={{ height: 48, backgroundColor: colors.primary[700], borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: colors.primary[700], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 }}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={{ color: colors.white, fontSize: 15, fontWeight: '600' }}>
                  {isRegister ? 'Crear cuenta' : 'Iniciar Sesion'}
                </Text>
                <ArrowRight size={18} color={colors.white} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setIsRegister(!isRegister); setError(''); }} style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={{ fontSize: 14, color: colors.primary[700], fontWeight: '500' }}>
              {isRegister ? 'Ya tengo cuenta - Iniciar Sesion' : 'No tengo cuenta - Registrarme'}
            </Text>
          </TouchableOpacity>

          {/* Quick access */}
          {!isRegister && (
            <View style={{ marginTop: 24, padding: 16, backgroundColor: colors.stone[50], borderRadius: radius.lg, borderWidth: 1, borderColor: colors.stone[100] }}>
              <Text style={{ fontSize: 12, color: colors.stone[500], fontWeight: '500', marginBottom: 8 }}>Acceso rapido (demo):</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setForm({ ...form, username: 'admin', password: 'admin123' })}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primary[50], borderRadius: 8 }}
                >
                  <Text style={{ fontSize: 12, color: colors.primary[700], fontWeight: '600' }}>Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setForm({ ...form, username: 'vecino1', password: 'vecino123' })}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.stone[100], borderRadius: 8 }}
                >
                  <Text style={{ fontSize: 12, color: colors.stone[600], fontWeight: '600' }}>Vecino</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
