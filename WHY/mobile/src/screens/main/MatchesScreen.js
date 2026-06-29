import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { getMatches, getLikes } from '../../services/api';
import MatchCard from '../../components/MatchCard';
import { colors, spacing, radius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export default function MatchesScreen({ navigation }) {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('matches');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { matches: m } = await getMatches();
      setMatches(m);
      if (user?.is_premium) {
        const { likes: l } = await getLikes();
        setLikes(l);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'matches' && styles.tabActive]}
          onPress={() => setTab('matches')}
        >
          <Text style={[styles.tabText, tab === 'matches' && styles.tabTextActive]}>Matches</Text>
        </TouchableOpacity>
        {user?.is_premium && (
          <TouchableOpacity
            style={[styles.tab, tab === 'likes' && styles.tabActive]}
            onPress={() => setTab('likes')}
          >
            <Text style={[styles.tabText, tab === 'likes' && styles.tabTextActive]}>
              Likes {likes.length > 0 ? `(${likes.length})` : ''}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : tab === 'matches' ? (
        <FlatList
          data={matches}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <MatchCard
              match={item}
              onPress={() => navigation.navigate('Chat', { matchId: item.id, name: item.other_user?.name })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptySub}>Keep swiping to find your people.</Text>
            </View>
          }
          onRefresh={load}
          refreshing={loading}
        />
      ) : (
        <FlatList
          data={likes}
          keyExtractor={(l) => l.swiper_id}
          renderItem={({ item }) => (
            <View style={styles.likeItem}>
              <View style={styles.blurredAvatar}>
                <Text style={styles.blurredText}>?</Text>
              </View>
              <View style={styles.likeInfo}>
                <Text style={styles.likeName}>{item.name}</Text>
                <Text style={styles.likeTime}>Liked you {formatTime(item.created_at)}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>❤️</Text>
              <Text style={styles.emptyTitle}>No pending likes</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function formatTime(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { color: colors.textMuted, fontWeight: '600', fontSize: 15 },
  tabTextActive: { color: colors.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  emptySub: { color: colors.textSub },
  likeItem: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  blurredAvatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.bgSurface,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  blurredText: { fontSize: 24, color: colors.textMuted },
  likeInfo: {},
  likeName: { fontSize: 16, fontWeight: '600', color: colors.text },
  likeTime: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
