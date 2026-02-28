import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Plus, X, Send, CheckCircle, Package } from 'lucide-react-native';
import { colors, radius } from '../utils/theme';

export default function ObjetosPerdidosScreen() {
  const { user, isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: '', descripcion: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    try { const { data } = await api.get('/api/objetos-perdidos?limit=50'); setItems(data.items || []); } catch (e) {} finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCreate = async () => {
    setSubmitting(true);
    try { await api.post('/api/objetos-perdidos', form); setForm({ titulo: '', descripcion: '' }); setShowForm(false); fetchItems(); } catch (err) { Alert.alert('Error', err.message); } finally { setSubmitting(false); }
  };

  const handleFound = (id) => Alert.alert('Encontrado', 'Marcar como encontrado?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Confirmar', onPress: async () => { try { await api.put(`/api/objetos-perdidos/${id}/encontrado`); fetchItems(); } catch (err) { Alert.alert('Error', err.message); } }},
  ]);

  const formatDate = (iso) => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });

  const renderItem = ({ item }) => (
    <View style={{ backgroundColor: item.encontrado ? colors.primary[50] : colors.white, borderRadius: radius.xl, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: item.encontrado ? colors.primary[200] : colors.stone[100] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.stone[900], flex: 1 }}>{item.titulo}</Text>
        {item.encontrado && <CheckCircle size={16} color={colors.primary[500]} />}
      </View>
      <Text style={{ fontSize: 13, color: colors.stone[600], marginBottom: 8 }} numberOfLines={2}>{item.descripcion}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 11, color: colors.stone[400] }}>{item.autor?.nombre_completo} - {formatDate(item.fecha)}</Text>
        {!item.encontrado && (item.usuario_id === user?.id || isAdmin) && (
          <TouchableOpacity onPress={() => handleFound(item.id)} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primary[50], borderRadius: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary[600] }}>Encontrado</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary[700]} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.stone[100] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 16, paddingBottom: 0 }}>
        <TouchableOpacity onPress={() => setShowForm(true)} style={{ height: 40, paddingHorizontal: 14, backgroundColor: colors.primary[700], borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Plus size={18} color={colors.white} /><Text style={{ color: colors.white, fontSize: 13, fontWeight: '600' }}>Reportar</Text>
        </TouchableOpacity>
      </View>
      <FlatList data={items} renderItem={renderItem} keyExtractor={item => item.id} contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems(); }} tintColor={colors.primary[700]} />}
        ListEmptyComponent={<View style={{ alignItems: 'center', paddingVertical: 60 }}><Text style={{ color: colors.stone[500] }}>No hay objetos reportados</Text></View>}
      />
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.stone[200] }}>
            <Text style={{ fontSize: 18, fontWeight: '700' }}>Reportar Objeto Perdido</Text>
            <TouchableOpacity onPress={() => setShowForm(false)} style={{ padding: 8 }}><X size={22} color={colors.stone[500]} /></TouchableOpacity>
          </View>
          <View style={{ padding: 16, gap: 16 }}>
            <TextInput value={form.titulo} onChangeText={v => setForm({ ...form, titulo: v })} placeholder="Que perdiste?" placeholderTextColor={colors.stone[400]} style={{ height: 48, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, fontSize: 15, color: colors.stone[900] }} />
            <TextInput value={form.descripcion} onChangeText={v => setForm({ ...form, descripcion: v })} placeholder="Describe el objeto..." placeholderTextColor={colors.stone[400]} multiline numberOfLines={4} textAlignVertical="top" style={{ minHeight: 100, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: colors.stone[900] }} />
            <TouchableOpacity onPress={handleCreate} disabled={submitting} style={{ height: 48, backgroundColor: colors.primary[700], borderRadius: 999, alignItems: 'center', justifyContent: 'center', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={{ color: colors.white, fontWeight: '600' }}>Reportar</Text>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
