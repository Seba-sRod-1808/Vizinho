import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Plus, X, Send, Calendar, Users, MapPin } from 'lucide-react-native';
import { colors, radius } from '../utils/theme';

export default function AreasScreen() {
  const { isAdmin } = useAuth();
  const [areas, setAreas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReserva, setShowReserva] = useState(null);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [areaForm, setAreaForm] = useState({ nombre: '', descripcion: '', capacidad: '10' });
  const [reservaForm, setReservaForm] = useState({ fecha: '', hora_inicio: '', hora_fin: '', motivo: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [a, r] = await Promise.all([api.get('/api/areas-comunes'), api.get('/api/reservas')]);
      setAreas(a.data.items || []); setReservas(r.data.items || []);
    } catch (e) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateArea = async () => {
    setSubmitting(true);
    try {
      await api.post('/api/areas-comunes', { ...areaForm, capacidad: parseInt(areaForm.capacidad), disponible: true });
      setAreaForm({ nombre: '', descripcion: '', capacidad: '10' }); setShowAreaForm(false); fetchData();
    } catch (err) { Alert.alert('Error', err.message); } finally { setSubmitting(false); }
  };

  const handleReservar = async () => {
    setSubmitting(true);
    try {
      await api.post('/api/reservas', { ...reservaForm, area_id: showReserva });
      setReservaForm({ fecha: '', hora_inicio: '', hora_fin: '', motivo: '' }); setShowReserva(null); fetchData();
    } catch (err) { Alert.alert('Error', err.message); } finally { setSubmitting(false); }
  };

  const renderArea = ({ item }) => (
    <View style={{ backgroundColor: colors.white, borderRadius: radius.xl, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: colors.stone[100] }}>
      <View style={{ height: 120, backgroundColor: colors.primary[100], alignItems: 'center', justifyContent: 'center' }}>
        <MapPin size={32} color={colors.primary[500]} />
      </View>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.stone[900], marginBottom: 4 }}>{item.nombre}</Text>
        <Text style={{ fontSize: 13, color: colors.stone[500], marginBottom: 12 }} numberOfLines={2}>{item.descripcion}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Users size={14} color={colors.stone[400]} />
            <Text style={{ fontSize: 12, color: colors.stone[400] }}>Capacidad: {item.capacidad}</Text>
          </View>
          {item.disponible && (
            <TouchableOpacity onPress={() => setShowReserva(item.id)} style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.primary[700], borderRadius: 999 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.white }}>Reservar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary[700]} /></View>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.stone[100] }} edges={['top']}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 0.5, borderBottomColor: colors.stone[200] }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.stone[900] }}>Areas Comunes</Text>
        {isAdmin && (
          <TouchableOpacity onPress={() => setShowAreaForm(true)} style={{ height: 40, paddingHorizontal: 14, backgroundColor: colors.primary[700], borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Plus size={18} color={colors.white} /><Text style={{ color: colors.white, fontSize: 13, fontWeight: '600' }}>Nueva</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList data={areas} renderItem={renderArea} keyExtractor={item => item.id.toString()} contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<View style={{ alignItems: 'center', paddingVertical: 60 }}><Text style={{ color: colors.stone[500] }}>No hay areas registradas</Text></View>}
      />

      {/* Reserva Modal */}
      <Modal visible={!!showReserva} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.stone[200] }}>
            <Text style={{ fontSize: 18, fontWeight: '700' }}>Reservar</Text>
            <TouchableOpacity onPress={() => setShowReserva(null)} style={{ padding: 8 }}><X size={22} color={colors.stone[500]} /></TouchableOpacity>
          </View>
          <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: colors.stone[600] }}>Fecha (YYYY-MM-DD)</Text>
            <TextInput value={reservaForm.fecha} onChangeText={v => setReservaForm({ ...reservaForm, fecha: v })} placeholder="2026-03-15" placeholderTextColor={colors.stone[400]} style={{ height: 48, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, fontSize: 15, color: colors.stone[900] }} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.stone[600], marginBottom: 6 }}>Hora inicio</Text>
                <TextInput value={reservaForm.hora_inicio} onChangeText={v => setReservaForm({ ...reservaForm, hora_inicio: v })} placeholder="10:00" placeholderTextColor={colors.stone[400]} style={{ height: 48, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, fontSize: 15, color: colors.stone[900] }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.stone[600], marginBottom: 6 }}>Hora fin</Text>
                <TextInput value={reservaForm.hora_fin} onChangeText={v => setReservaForm({ ...reservaForm, hora_fin: v })} placeholder="12:00" placeholderTextColor={colors.stone[400]} style={{ height: 48, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, fontSize: 15, color: colors.stone[900] }} />
              </View>
            </View>
            <TextInput value={reservaForm.motivo} onChangeText={v => setReservaForm({ ...reservaForm, motivo: v })} placeholder="Motivo" placeholderTextColor={colors.stone[400]} style={{ height: 48, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, fontSize: 15, color: colors.stone[900] }} />
            <TouchableOpacity onPress={handleReservar} disabled={submitting} style={{ height: 48, backgroundColor: colors.primary[700], borderRadius: 999, alignItems: 'center', justifyContent: 'center', opacity: submitting ? 0.6 : 1, marginTop: 8 }}>
              {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={{ color: colors.white, fontWeight: '600' }}>Reservar</Text>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Area form modal */}
      <Modal visible={showAreaForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.stone[200] }}>
            <Text style={{ fontSize: 18, fontWeight: '700' }}>Nueva Area</Text>
            <TouchableOpacity onPress={() => setShowAreaForm(false)} style={{ padding: 8 }}><X size={22} color={colors.stone[500]} /></TouchableOpacity>
          </View>
          <View style={{ padding: 16, gap: 12 }}>
            <TextInput value={areaForm.nombre} onChangeText={v => setAreaForm({ ...areaForm, nombre: v })} placeholder="Nombre del area" placeholderTextColor={colors.stone[400]} style={{ height: 48, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, fontSize: 15, color: colors.stone[900] }} />
            <TextInput value={areaForm.descripcion} onChangeText={v => setAreaForm({ ...areaForm, descripcion: v })} placeholder="Descripcion" placeholderTextColor={colors.stone[400]} style={{ height: 48, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, fontSize: 15, color: colors.stone[900] }} />
            <TextInput value={areaForm.capacidad} onChangeText={v => setAreaForm({ ...areaForm, capacidad: v })} placeholder="Capacidad" keyboardType="numeric" placeholderTextColor={colors.stone[400]} style={{ height: 48, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, fontSize: 15, color: colors.stone[900] }} />
            <TouchableOpacity onPress={handleCreateArea} disabled={submitting} style={{ height: 48, backgroundColor: colors.primary[700], borderRadius: 999, alignItems: 'center', justifyContent: 'center', opacity: submitting ? 0.6 : 1, marginTop: 8 }}>
              {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={{ color: colors.white, fontWeight: '600' }}>Crear Area</Text>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
