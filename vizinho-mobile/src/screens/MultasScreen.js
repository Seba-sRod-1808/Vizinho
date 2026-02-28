import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Receipt, Clock, CheckCircle, CreditCard, DollarSign } from 'lucide-react-native';
import { colors, radius } from '../utils/theme';

export default function MultasScreen() {
  const { user, isAdmin } = useAuth();
  const [multas, setMultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMultas = useCallback(async () => {
    try { const { data } = await api.get('/api/multas?limit=50'); setMultas(data.items || []); } catch (e) {} finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { fetchMultas(); }, [fetchMultas]);

  const handlePagar = (id) => Alert.alert('Pagar multa', 'Confirmar pago?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Pagar', onPress: async () => { try { await api.put(`/api/multas/${id}/pagar`); fetchMultas(); Alert.alert('Pago exitoso'); } catch (err) { Alert.alert('Error', err.message); } }},
  ]);

  const totalPendiente = multas.filter(m => m.estado === 'Pendiente').reduce((s, m) => s + m.monto, 0);
  const formatDate = (iso) => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });

  const renderItem = ({ item }) => (
    <View style={{ backgroundColor: colors.white, borderRadius: radius.xl, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.stone[100] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.stone[900] }}>{item.motivo}</Text>
          {isAdmin && <Text style={{ fontSize: 12, color: colors.stone[400], marginTop: 2 }}>{item.vecino?.nombre_completo || item.vecino?.username}</Text>}
        </View>
        <View style={{ backgroundColor: item.estado === 'Pendiente' ? colors.amber[50] : colors.primary[50], paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: item.estado === 'Pendiente' ? colors.amber[600] : colors.primary[600] }}>{item.estado}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.stone[900] }}>${item.monto.toFixed(2)}</Text>
          <Text style={{ fontSize: 11, color: colors.stone[400] }}>{formatDate(item.fecha)}</Text>
        </View>
        {item.estado === 'Pendiente' && item.vecino_id === user?.id && (
          <TouchableOpacity onPress={() => handlePagar(item.id)} style={{ height: 40, paddingHorizontal: 16, backgroundColor: colors.primary[700], borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <CreditCard size={16} color={colors.white} /><Text style={{ color: colors.white, fontSize: 13, fontWeight: '600' }}>Pagar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary[700]} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.stone[100] }}>
      {!isAdmin && totalPendiente > 0 && (
        <View style={{ margin: 16, marginBottom: 0, padding: 20, borderRadius: radius.xl, backgroundColor: colors.amber[500] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <DollarSign size={22} color={colors.white} /><Text style={{ color: colors.white, fontSize: 13, fontWeight: '500' }}>Total pendiente</Text>
          </View>
          <Text style={{ color: colors.white, fontSize: 28, fontWeight: '800' }}>${totalPendiente.toFixed(2)}</Text>
        </View>
      )}
      <FlatList data={multas} renderItem={renderItem} keyExtractor={item => item.id} contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMultas(); }} tintColor={colors.primary[700]} />}
        ListEmptyComponent={<View style={{ alignItems: 'center', paddingVertical: 60 }}><Text style={{ color: colors.stone[500] }}>No hay multas</Text></View>}
      />
    </View>
  );
}
