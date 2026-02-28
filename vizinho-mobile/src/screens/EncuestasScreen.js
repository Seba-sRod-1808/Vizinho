import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Plus, X, Send, CheckCircle, Lock, Trash2, Users } from 'lucide-react-native';
import { colors, radius } from '../utils/theme';

export default function EncuestasScreen() {
  const { user, isAdmin } = useAuth();
  const [encuestas, setEncuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ pregunta: '', descripcion: '', opciones: ['', ''] });
  const [submitting, setSubmitting] = useState(false);

  const fetchEncuestas = useCallback(async () => {
    try { const { data } = await api.get('/api/encuestas'); setEncuestas(data.items || []); } catch (e) {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchEncuestas(); }, [fetchEncuestas]);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const opciones = form.opciones.filter(o => o.trim());
      await api.post('/api/encuestas', { ...form, opciones });
      setForm({ pregunta: '', descripcion: '', opciones: ['', ''] });
      setShowForm(false);
      fetchEncuestas();
    } catch (err) { Alert.alert('Error', err.message); } finally { setSubmitting(false); }
  };

  const handleVote = async (encuestaId, opcionIndex) => {
    try { await api.post(`/api/encuestas/${encuestaId}/votar`, { opcion_index: opcionIndex }); fetchEncuestas(); } catch (err) { Alert.alert('Info', err.message); }
  };

  const handleCerrar = (id) => Alert.alert('Cerrar encuesta', 'No se podran agregar mas votos.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Cerrar', onPress: async () => { try { await api.put(`/api/encuestas/${id}/cerrar`); fetchEncuestas(); } catch (err) { Alert.alert('Error', err.message); } }},
  ]);

  const handleDelete = (id) => Alert.alert('Eliminar', 'Eliminar esta encuesta?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: async () => { try { await api.delete(`/api/encuestas/${id}`); fetchEncuestas(); } catch (err) { Alert.alert('Error', err.message); } }},
  ]);

  const addOption = () => form.opciones.length < 10 && setForm({ ...form, opciones: [...form.opciones, ''] });
  const updateOption = (idx, val) => { const o = [...form.opciones]; o[idx] = val; setForm({ ...form, opciones: o }); };
  const removeOption = (idx) => form.opciones.length > 2 && setForm({ ...form, opciones: form.opciones.filter((_, i) => i !== idx) });

  const formatDate = (iso) => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });

  const renderItem = ({ item: enc }) => {
    const maxVotos = Math.max(...enc.opciones.map(o => o.votos), 1);
    return (
      <View style={{ backgroundColor: colors.white, borderRadius: radius.xl, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.stone[100] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              {!enc.activa && <Lock size={14} color={colors.stone[400]} />}
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.stone[900], flex: 1 }}>{enc.pregunta}</Text>
            </View>
            {enc.descripcion ? <Text style={{ fontSize: 13, color: colors.stone[500], marginBottom: 4 }}>{enc.descripcion}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Text style={{ fontSize: 11, color: colors.stone[400] }}>{enc.creador?.nombre_completo || enc.creador?.username}</Text>
              <Text style={{ fontSize: 11, color: colors.stone[400] }}>{formatDate(enc.fecha)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Users size={11} color={colors.stone[400]} />
                <Text style={{ fontSize: 11, color: colors.stone[400] }}>{enc.total_votos}</Text>
              </View>
            </View>
          </View>
          {(enc.creador_id === user?.id || isAdmin) && (
            <View style={{ flexDirection: 'row' }}>
              {enc.activa && <TouchableOpacity onPress={() => handleCerrar(enc.id)} style={{ padding: 8 }}><Lock size={16} color={colors.stone[400]} /></TouchableOpacity>}
              <TouchableOpacity onPress={() => handleDelete(enc.id)} style={{ padding: 8 }}><Trash2 size={16} color={colors.stone[400]} /></TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ gap: 8, marginTop: 8 }}>
          {enc.opciones.map((opt, j) => {
            const pct = enc.total_votos > 0 ? Math.round((opt.votos / enc.total_votos) * 100) : 0;
            const isMyVote = enc.mi_voto === j;
            return (
              <TouchableOpacity
                key={j}
                onPress={() => enc.activa ? handleVote(enc.id, j) : null}
                disabled={!enc.activa}
                activeOpacity={0.7}
                style={{ borderRadius: radius.lg, borderWidth: 1.5, borderColor: isMyVote ? colors.primary[400] : colors.stone[200], overflow: 'hidden', backgroundColor: isMyVote ? colors.primary[50] : colors.white }}
              >
                <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${pct}%`, backgroundColor: isMyVote ? colors.primary[100] : colors.stone[100] }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {isMyVote && <CheckCircle size={16} color={colors.primary[600]} />}
                    <Text style={{ fontSize: 14, fontWeight: isMyVote ? '600' : '500', color: isMyVote ? colors.primary[700] : colors.stone[700] }}>{opt.texto}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.stone[500] }}>{pct}%</Text>
                    <Text style={{ fontSize: 10, color: colors.stone[400] }}>({opt.votos})</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        {!enc.activa && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
            <Lock size={12} color={colors.stone[400]} />
            <Text style={{ fontSize: 11, color: colors.stone[400] }}>Encuesta cerrada</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.stone[100] }} edges={['top']}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 0.5, borderBottomColor: colors.stone[200] }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.stone[900] }}>Encuestas</Text>
        <TouchableOpacity onPress={() => setShowForm(true)} style={{ height: 40, paddingHorizontal: 14, backgroundColor: colors.primary[700], borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Plus size={18} color={colors.white} /><Text style={{ color: colors.white, fontSize: 13, fontWeight: '600' }}>Crear</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary[700]} /> : (
        <FlatList data={encuestas} renderItem={renderItem} keyExtractor={item => item.id} contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEncuestas(); }} tintColor={colors.primary[700]} />}
          ListEmptyComponent={<View style={{ alignItems: 'center', paddingVertical: 60 }}><Text style={{ color: colors.stone[500] }}>No hay encuestas</Text></View>}
        />
      )}

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.stone[200] }}>
            <Text style={{ fontSize: 18, fontWeight: '700' }}>Nueva Encuesta</Text>
            <TouchableOpacity onPress={() => setShowForm(false)} style={{ padding: 8 }}><X size={22} color={colors.stone[500]} /></TouchableOpacity>
          </View>
          <View style={{ padding: 16, gap: 12 }}>
            <TextInput value={form.pregunta} onChangeText={v => setForm({ ...form, pregunta: v })} placeholder="Pregunta de la encuesta" placeholderTextColor={colors.stone[400]} style={{ height: 48, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, fontSize: 15, color: colors.stone[900] }} />
            <TextInput value={form.descripcion} onChangeText={v => setForm({ ...form, descripcion: v })} placeholder="Descripcion (opcional)" placeholderTextColor={colors.stone[400]} style={{ height: 48, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, fontSize: 15, color: colors.stone[900] }} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.stone[700] }}>Opciones</Text>
            {form.opciones.map((opt, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput value={opt} onChangeText={v => updateOption(i, v)} placeholder={`Opcion ${i + 1}`} placeholderTextColor={colors.stone[400]} style={{ flex: 1, height: 44, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, fontSize: 14, color: colors.stone[900] }} />
                {form.opciones.length > 2 && <TouchableOpacity onPress={() => removeOption(i)} style={{ justifyContent: 'center', padding: 8 }}><X size={16} color={colors.stone[400]} /></TouchableOpacity>}
              </View>
            ))}
            {form.opciones.length < 10 && <TouchableOpacity onPress={addOption}><Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary[700] }}>+ Agregar opcion</Text></TouchableOpacity>}
            <TouchableOpacity onPress={handleCreate} disabled={submitting} style={{ height: 48, backgroundColor: colors.primary[700], borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: submitting ? 0.6 : 1, marginTop: 8 }}>
              {submitting ? <ActivityIndicator color={colors.white} /> : <><Send size={18} color={colors.white} /><Text style={{ color: colors.white, fontWeight: '600' }}>Crear Encuesta</Text></>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
