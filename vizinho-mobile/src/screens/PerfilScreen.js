import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Mail, Phone, Edit3, Save, LogOut, Shield, AlertTriangle, ChevronRight } from 'lucide-react-native';
import { colors, radius } from '../utils/theme';

export default function PerfilScreen({ navigation }) {
  const { user, updateUser, logout, isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nombre_completo: user?.nombre_completo || '', telefono: user?.telefono || '', bio: user?.bio || '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/profile', form);
      updateUser({ ...user, ...form }); setEditing(false);
    } catch (err) { Alert.alert('Error', err.message); } finally { setSaving(false); }
  };

  const handlePanic = () => {
    Alert.alert('ALERTA DE PANICO', 'Esto enviara una alerta de emergencia a todos los administradores. Deseas continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: async () => {
        try { await api.post('/api/panico'); Alert.alert('Alerta activada', 'Los administradores han sido notificados.'); } catch (err) { Alert.alert('Error', err.message); }
      }},
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesion', 'Deseas cerrar tu sesion?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesion', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.stone[100] }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Profile Card */}
        <View style={{ backgroundColor: colors.white, borderRadius: radius.xl, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: colors.stone[100] }}>
          <View style={{ height: 80, backgroundColor: colors.primary[700] }} />
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: colors.white, marginTop: -32, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.white, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary[700] }}>{(user?.nombre_completo || user?.username || '?')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.stone[900] }}>{user?.nombre_completo || user?.username}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, backgroundColor: isAdmin ? colors.primary[50] : colors.stone[100], paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
                  {isAdmin && <Shield size={12} color={colors.primary[700]} />}
                  <Text style={{ fontSize: 11, fontWeight: '600', color: isAdmin ? colors.primary[700] : colors.stone[600] }}>{isAdmin ? 'Administrador' : 'Vecino'}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setEditing(!editing)} style={{ padding: 8, borderRadius: 10, backgroundColor: colors.stone[50] }}>
                <Edit3 size={18} color={colors.stone[500]} />
              </TouchableOpacity>
            </View>

            {editing ? (
              <View style={{ marginTop: 16, gap: 12 }}>
                <TextInput value={form.nombre_completo} onChangeText={v => setForm({ ...form, nombre_completo: v })} placeholder="Nombre completo" placeholderTextColor={colors.stone[400]} style={{ height: 44, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 14, fontSize: 14, color: colors.stone[900] }} />
                <TextInput value={form.telefono} onChangeText={v => setForm({ ...form, telefono: v })} placeholder="Telefono" keyboardType="phone-pad" placeholderTextColor={colors.stone[400]} style={{ height: 44, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 14, fontSize: 14, color: colors.stone[900] }} />
                <TextInput value={form.bio} onChangeText={v => setForm({ ...form, bio: v })} placeholder="Biografia" multiline numberOfLines={3} textAlignVertical="top" maxLength={500} placeholderTextColor={colors.stone[400]} style={{ minHeight: 80, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.stone[900] }} />
                <TouchableOpacity onPress={handleSave} disabled={saving} style={{ height: 44, backgroundColor: colors.primary[700], borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.6 : 1 }}>
                  {saving ? <ActivityIndicator color={colors.white} /> : <><Save size={16} color={colors.white} /><Text style={{ color: colors.white, fontWeight: '600', fontSize: 14 }}>Guardar</Text></>}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ marginTop: 12, gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Mail size={16} color={colors.stone[400]} />
                  <Text style={{ fontSize: 14, color: colors.stone[600] }}>{user?.email}</Text>
                </View>
                {user?.telefono ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Phone size={16} color={colors.stone[400]} /><Text style={{ fontSize: 14, color: colors.stone[600] }}>{user.telefono}</Text></View> : null}
                {user?.bio ? <Text style={{ fontSize: 14, color: colors.stone[600], backgroundColor: colors.stone[50], padding: 12, borderRadius: radius.lg }}>{user.bio}</Text> : null}
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <TouchableOpacity onPress={() => navigation.navigate('Multas')} style={{ backgroundColor: colors.white, borderRadius: radius.xl, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.stone[100] }}>
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.stone[900] }}>Mis Multas</Text>
          <ChevronRight size={18} color={colors.stone[400]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ObjetosPerdidos')} style={{ backgroundColor: colors.white, borderRadius: radius.xl, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.stone[100] }}>
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.stone[900] }}>Objetos Perdidos</Text>
          <ChevronRight size={18} color={colors.stone[400]} />
        </TouchableOpacity>
        {isAdmin && (
          <TouchableOpacity onPress={() => navigation.navigate('Admin')} style={{ backgroundColor: colors.white, borderRadius: radius.xl, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.stone[100] }}>
            <Shield size={18} color={colors.primary[700]} />
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.stone[900], marginLeft: 10 }}>Panel Admin</Text>
            <ChevronRight size={18} color={colors.stone[400]} />
          </TouchableOpacity>
        )}

        {/* Panic */}
        <View style={{ backgroundColor: colors.white, borderRadius: radius.xl, padding: 16, marginTop: 8, marginBottom: 8, borderWidth: 1, borderColor: colors.stone[100] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={18} color={colors.danger[500]} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.stone[900] }}>Boton de Panico</Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.stone[500], marginBottom: 12 }}>Activa una alerta de emergencia.</Text>
          <TouchableOpacity onPress={handlePanic} activeOpacity={0.85} style={{ height: 48, backgroundColor: colors.danger[600], borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <AlertTriangle size={20} color={colors.white} />
            <Text style={{ color: colors.white, fontWeight: '700', fontSize: 15 }}>ACTIVAR ALERTA</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: colors.white, borderRadius: radius.xl, padding: 16, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: colors.stone[100] }}>
          <LogOut size={18} color={colors.danger[600]} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.danger[600] }}>Cerrar Sesion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
