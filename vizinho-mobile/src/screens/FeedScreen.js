import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, Modal,
  RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Plus, X, Send, Trash2, Bell } from 'lucide-react-native';
import { colors, radius } from '../utils/theme';

export default function FeedScreen({ navigation }) {
  const { user, isAdmin, unreadCount } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: '', contenido: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const { data } = await api.get('/api/publicaciones?limit=50');
      setPosts(data.items || []);
    } catch (e) {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await api.post('/api/publicaciones', form);
      setForm({ titulo: '', contenido: '' });
      setShowForm(false);
      fetchPosts();
    } catch (err) { Alert.alert('Error', err.message); } finally { setSubmitting(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Eliminar', 'Eliminar esta publicacion?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await api.delete(`/api/publicaciones/${id}`); fetchPosts(); } catch (err) { Alert.alert('Error', err.message); }
      }},
    ]);
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const renderPost = ({ item, index }) => (
    <View style={{ backgroundColor: colors.white, borderRadius: radius.xl, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.stone[100] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary[100], alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary[700] }}>
              {(item.autor?.nombre_completo || item.autor?.username || '?')[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.stone[900] }}>{item.autor?.nombre_completo || item.autor?.username}</Text>
            <Text style={{ fontSize: 11, color: colors.stone[400] }}>{formatDate(item.fecha)}</Text>
          </View>
        </View>
        {(item.vecino_id === user?.id || isAdmin) && (
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 8 }}>
            <Trash2 size={16} color={colors.stone[400]} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.stone[900], marginBottom: 4 }}>{item.titulo}</Text>
      <Text style={{ fontSize: 14, color: colors.stone[600], lineHeight: 20 }}>{item.contenido}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.stone[100] }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 0.5, borderBottomColor: colors.stone[200] }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.stone[900], letterSpacing: -0.3 }}>Mural</Text>
          <Text style={{ fontSize: 13, color: colors.stone[500] }}>Publicaciones de tu comunidad</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Notificaciones')} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.stone[100], alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={20} color={colors.stone[700]} />
            {unreadCount > 0 && (
              <View style={{ position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, backgroundColor: colors.danger[500], borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: colors.white }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowForm(true)} style={{ height: 40, paddingHorizontal: 14, backgroundColor: colors.primary[700], borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Plus size={18} color={colors.white} />
            <Text style={{ color: colors.white, fontSize: 13, fontWeight: '600' }}>Publicar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary[700]} />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPosts(); }} tintColor={colors.primary[700]} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Text style={{ fontSize: 15, color: colors.stone[500], fontWeight: '500' }}>No hay publicaciones aun</Text>
              <Text style={{ fontSize: 13, color: colors.stone[400], marginTop: 4 }}>Se el primero en publicar algo</Text>
            </View>
          }
        />
      )}

      {/* Create Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.stone[200] }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.stone[900] }}>Nueva Publicacion</Text>
            <TouchableOpacity onPress={() => setShowForm(false)} style={{ padding: 8 }}>
              <X size={22} color={colors.stone[500]} />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 16, gap: 16 }}>
            <TextInput
              value={form.titulo}
              onChangeText={v => setForm({ ...form, titulo: v })}
              placeholder="Titulo de la publicacion"
              placeholderTextColor={colors.stone[400]}
              style={{ height: 48, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, fontSize: 15, color: colors.stone[900] }}
            />
            <TextInput
              value={form.contenido}
              onChangeText={v => setForm({ ...form, contenido: v })}
              placeholder="Escribe tu mensaje para la comunidad..."
              placeholderTextColor={colors.stone[400]}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={{ minHeight: 120, backgroundColor: colors.stone[50], borderWidth: 1, borderColor: colors.stone[200], borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: colors.stone[900] }}
            />
            <TouchableOpacity
              onPress={handleCreate}
              disabled={submitting || !form.titulo.trim() || !form.contenido.trim()}
              activeOpacity={0.85}
              style={{ height: 48, backgroundColor: colors.primary[700], borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (submitting || !form.titulo.trim() || !form.contenido.trim()) ? 0.6 : 1 }}
            >
              {submitting ? <ActivityIndicator color={colors.white} /> : (
                <>
                  <Send size={18} color={colors.white} />
                  <Text style={{ color: colors.white, fontSize: 15, fontWeight: '600' }}>Publicar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
