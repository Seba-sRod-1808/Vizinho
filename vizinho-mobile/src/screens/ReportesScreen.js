import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Plus, X, Send, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react-native';
import { colors, radius } from '../utils/theme';

const estadoConfig = {
  'Recibido': { color: colors.amber[500], bg: colors.amber[50], label: 'Recibido' },
  'EnProceso': { color: colors.blue[500], bg: colors.blue[50], label: 'En Proceso' },
  'Resuelto': { color: colors.primary[500], bg: colors.primary[50], label: 'Resuelto' },
};

export default function ReportesScreen() {
  const { isAdmin } = useAuth();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: '', descripcion: '', ubicacion: '' });
  const [submitting, setSubmitting] = useState(false);
  const [filtro, setFiltro] = useState('');

  const fetchReportes = useCallback(async () => {
    try {
      const url = filtro ? `/api/reportes?limit=50&estado=${filtro}` : '/api/reportes?limit=50';
      const { data } = await api.get(url);
      setReportes(data.items || []);
    } catch (e) {} finally { setLoading(false); setRefreshing(false); }
  }, [filtro]);

  useEffect(() => { fetchReportes(); }, [fetchReportes]);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await api.post('/api/reportes', form);
      setForm({ titulo: '', descripcion: '', ubicacion: '' });
      setShowForm(false);
      fetchReportes();
    } catch (err) { Alert.alert('Error', err.message); } finally { setSubmitting(false); }
  };

  const handleEstado = (id, estado) => {
    Alert.alert('Cambiar estado', `Marcar como ${estado}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: async () => {
        try { await api.put(`/api/reportes/${id}/estado`, { estado }); fetchReportes(); } catch (err) { Alert.alert('Error', err.message); }
      }},
    ]);
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const filters = ['', 'Recibido', 'EnProceso', 'Resuelto'];

  const renderItem = ({ item }) => {
    const cfg = estadoConfig[item.estado] || estadoConfig['Recibido'];
    return (
      <View style={{ backgroundColor: colors.white, borderRadius: radius.xl, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.stone[100] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.stone[900] }}>{item.titulo}</Text>
          <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: cfg.color }}>{cfg.label}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 13, color: colors.stone[600], marginBottom: 8 }} numberOfLines={2}>{item.descripcion}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: isAdmin && item.estado !== 'Resuelto' ? 12 : 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} color={colors.stone[400]} />
            <Text style={{ fontSize: 11, color: colors.stone[400] }}>{item.ubicacion}</Text>
          </View>
          <Text style={{ fontSize: 11, color: colors.stone[400] }}>{formatDate(item.fecha)}</Text>
        </View>
        {isAdmin && item.estado !== 'Resuelto' && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {item.estado === 'Recibido' && (
              <TouchableOpacity onPress={() => handleEstado(item.id, 'EnProceso')} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.blue[50], borderRadius: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.blue[600] }}>En Proceso</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => handleEstado(item.id, 'Resuelto')} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primary[50], borderRadius: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary[600] }}>Resuelto</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.stone[100] }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 0.5, borderBottomColor: colors.stone[200] }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.stone[900] }}>Reportes</Text>
        <TouchableOpacity onPress={() => setShowForm(true)} style={{ height: 40, paddingHorizontal: 14, backgroundColor: colors.primary[700], borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Plus size={18} color={colors.white} />
          <Text style={{ color: colors.white, fontSize: 13, fontWeight: '600' }}>Reportar</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.white }}>
        {filters.map(f => (
          <TouchableOpacity key={f || 'all'} onPress={() => setFiltro(f)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: filtro === f ? colors.primary[700] : colors.stone[100] }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: filtro === f ? colors.white : colors.stone[600] }}>{f ? (estadoConfig[f]?.label || f) : 'Todos'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary[700]} /> : (
        <FlatList
          data={reportes}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReportes(); }} tintColor={colors.primary[700]} />}
          ListEmptyComponent={<View style={{ alignItems: 'center', paddingVertical: 60 }}><Text style={{ color: colors.stone[500] }}>No hay reportes</Text></View>}
        />
      )}

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.stone[200] }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.stone[900] }}>Nuevo Reporte</Text>
            <TouchableOpacity onPress={() => setShowForm(false)} style={{ padding: 8 }}><X size={22} color={colors.stone[500]} /></TouchableOpacity>
          </View>
          <View style={{ padding: 16, gap: 16 }}>
            <TextInput value={form.titulo} onChangeText={v => setForm({ ...form, titulo: v })} placeholder="Titulo del incidente" placeholderTextColor={colors.stone[400]} style={{ height: 48, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, fontSize: 15, color: colors.stone[900] }} />
            <TextInput value={form.descripcion} onChangeText={v => setForm({ ...form, descripcion: v })} placeholder="Describe el incidente..." placeholderTextColor={colors.stone[400]} multiline numberOfLines={4} textAlignVertical="top" style={{ minHeight: 100, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: colors.stone[900] }} />
            <TextInput value={form.ubicacion} onChangeText={v => setForm({ ...form, ubicacion: v })} placeholder="Ubicacion" placeholderTextColor={colors.stone[400]} style={{ height: 48, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, fontSize: 15, color: colors.stone[900] }} />
            <TouchableOpacity onPress={handleCreate} disabled={submitting} activeOpacity={0.85} style={{ height: 48, backgroundColor: colors.primary[700], borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? <ActivityIndicator color={colors.white} /> : <><Send size={18} color={colors.white} /><Text style={{ color: colors.white, fontWeight: '600' }}>Enviar Reporte</Text></>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
