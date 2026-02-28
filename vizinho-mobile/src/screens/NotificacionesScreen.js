import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Bell, CheckCheck, AlertTriangle, FileWarning, Receipt, Info } from 'lucide-react-native';
import { colors, radius } from '../utils/theme';

const iconMap = { panico: AlertTriangle, reporte: FileWarning, multa: Receipt };
const colorMap = { panico: { bg: '#FEE2E2', fg: colors.danger[600] }, reporte: { bg: '#DBEAFE', fg: colors.blue[600] }, multa: { bg: colors.amber[50], fg: colors.amber[600] } };

export default function NotificacionesScreen() {
  const { notifications, unreadCount, fetchNotifications } = useAuth();

  useEffect(() => {
    if (unreadCount > 0) api.put('/api/notificaciones/leer-todas').then(() => fetchNotifications());
  }, []);

  const formatDate = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (diff < 1) return 'Ahora';
    if (diff < 60) return `hace ${diff}m`;
    if (diff < 1440) return `hace ${Math.floor(diff / 60)}h`;
    return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  };

  const renderItem = ({ item: n }) => {
    const Icon = iconMap[n.tipo] || Info;
    const c = colorMap[n.tipo] || { bg: '#DBEAFE', fg: colors.blue[600] };
    return (
      <View style={{ flexDirection: 'row', gap: 12, backgroundColor: !n.leida ? colors.primary[50] : colors.white, padding: 16, borderRadius: radius.xl, marginBottom: 8, borderWidth: 1, borderColor: !n.leida ? colors.primary[200] : colors.stone[100] }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={c.fg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.stone[900] }}>{n.titulo}</Text>
          <Text style={{ fontSize: 12, color: colors.stone[500], marginTop: 2 }}>{n.mensaje}</Text>
          <Text style={{ fontSize: 10, color: colors.stone[400], marginTop: 4 }}>{formatDate(n.fecha)}</Text>
        </View>
        {!n.leida && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary[500], marginTop: 6 }} />}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.stone[100] }}>
      <FlatList data={notifications} renderItem={renderItem} keyExtractor={item => item.id} contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Bell size={48} color={colors.stone[300]} />
            <Text style={{ color: colors.stone[500], marginTop: 12, fontWeight: '500' }}>Sin notificaciones</Text>
          </View>
        }
      />
    </View>
  );
}
