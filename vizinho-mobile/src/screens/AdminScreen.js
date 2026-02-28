import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../utils/api';
import { FileWarning, Clock, Receipt, AlertTriangle, Package, Users, Shield } from 'lucide-react-native';
import { colors, radius } from '../utils/theme';

export default function AdminScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try { const { data } = await api.get('/api/admin/dashboard'); setStats(data); } catch (e) {} finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary[700]} /></View>;
  if (!stats) return null;

  const cards = [
    { label: 'Reportes Pendientes', value: stats.reportes_pendientes, icon: FileWarning, color: colors.amber[500], bg: colors.amber[50] },
    { label: 'En Proceso', value: stats.reportes_en_proceso, icon: Clock, color: colors.blue[500], bg: colors.blue[50] },
    { label: 'Multas Pendientes', value: stats.multas_pendientes, icon: Receipt, color: '#EA580C', bg: '#FFEDD5' },
    { label: 'Monto Pendiente', value: `$${stats.monto_multas_pendientes.toFixed(2)}`, icon: Receipt, color: colors.primary[600], bg: colors.primary[50] },
    { label: 'Alertas Activas', value: stats.alertas_activas, icon: AlertTriangle, color: colors.danger[500], bg: colors.danger[50] },
    { label: 'Objetos Perdidos', value: stats.objetos_perdidos_activos, icon: Package, color: '#9333EA', bg: '#F3E8FF' },
    { label: 'Total Usuarios', value: stats.total_usuarios, icon: Users, color: colors.stone[600], bg: colors.stone[100] },
    { label: 'Total Vecinos', value: stats.total_vecinos, icon: Users, color: colors.primary[600], bg: colors.primary[50] },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.stone[100] }} contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} tintColor={colors.primary[700]} />}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Shield size={22} color={colors.primary[700]} />
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.stone[900] }}>Resumen</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {cards.map((c, i) => (
          <View key={i} style={{ width: '47%', backgroundColor: colors.white, borderRadius: radius.xl, padding: 16, borderWidth: 1, borderColor: colors.stone[100] }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <c.icon size={20} color={c.color} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.stone[900] }}>{c.value}</Text>
            <Text style={{ fontSize: 11, color: colors.stone[500], marginTop: 2 }}>{c.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
