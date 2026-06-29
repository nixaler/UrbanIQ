import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { getSwipeStack, recordSwipe, undoSwipe, getSwipesRemaining } from '../../services/api';
import SwipeCard from '../../components/SwipeCard';
import { colors, spacing, radius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

const { width: W } = Dimensions.get('window');

export default function SwipeScreen({ navigation }) {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState(null);
  const [lastSwipedUser, setLastSwipedUser] = useState(null);
  const [matchModal, setMatchModal] = useState(null);

  useEffect(() => {
    loadStack();
    if (!user?.is_premium) loadRemaining();
  }, []);

  const loadStack = async () => {
    try {
      const { cards: data } = await getSwipeStack(20);
      setCards(data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRemaining = async () => {
    try {
      const data = await getSwipesRemaining();
      setRemaining(data);
    } catch {}
  };

  const handleSwipeLeft = async (card) => {
    setLastSwipedUser(card);
    setCards((prev) => prev.filter((c) => c.id !== card.id));
    try {
      await recordSwipe(card.id, 'left');
      if (!user?.is_premium) loadRemaining();
    } catch (err) {
      if (err.message.includes('Daily swipe limit')) {
        Alert.alert('Daily Limit Reached', 'Upgrade to Premium for unlimited swipes!');
      }
    }
    if (cards.length < 5) loadStack();
  };

  const handleSwipeRight = async (card) => {
    setLastSwipedUser(card);
    setCards((prev) => prev.filter((c) => c.id !== card.id));
    try {
      const { match } = await recordSwipe(card.id, 'right');
      if (match) setMatchModal({ match, user: card });
      if (!user?.is_premium) loadRemaining();
    } catch (err) {
      if (err.message.includes('Daily swipe limit')) {
        Alert.alert('Daily Limit Reached', 'Upgrade to Premium for unlimited swipes!');
      }
    }
    if (cards.length < 5) loadStack();
  };

  const handleUndo = async () => {
    try {
      const { restored_user_id } = await undoSwipe();
      Alert.alert('Undone', 'Last swipe reversed.');
      loadStack();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>WHY</Text>
        {remaining && !remaining.unlimited && (
          <Text style={styles.swipeCount}>{remaining.remaining} swipes left today</Text>
        )}
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Card Stack */}
      <View style={styles.cardArea}>
        {cards.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySub}>No more profiles in your area. Check back soon.</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={loadStack}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Render top 2 cards (stack effect)
          cards.slice(0, 2).map((card, i) => (
            <SwipeCard
              key={card.id}
              card={card}
              isTop={i === 0}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
            />
          ))
        )}
      </View>

      {/* Action Buttons */}
      {cards.length > 0 && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.passBtn]} onPress={() => handleSwipeLeft(cards[0])}>
            <Text style={styles.actionIcon}>✕</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.undoBtn]} onPress={handleUndo}>
            <Text style={styles.actionIcon}>↩</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={() => handleSwipeRight(cards[0])}>
            <Text style={styles.actionIcon}>♥</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Match Modal */}
      {matchModal && (
        <View style={styles.matchOverlay}>
          <View style={styles.matchModal}>
            <Text style={styles.matchEmoji}>🎉</Text>
            <Text style={styles.matchTitle}>It's a Match!</Text>
            <Text style={styles.matchSub}>You and {matchModal.user.name} liked each other.</Text>
            <TouchableOpacity
              style={styles.matchBtn}
              onPress={() => { setMatchModal(null); navigation.navigate('Matches'); }}
            >
              <Text style={styles.matchBtnText}>Send a Message</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMatchModal(null)} style={styles.matchSkip}>
              <Text style={styles.matchSkipText}>Keep Swiping</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  logo: { fontSize: 24, fontWeight: '900', color: colors.primary, letterSpacing: 4 },
  swipeCount: { fontSize: 13, color: colors.textMuted },
  profileIcon: { fontSize: 24 },
  cardArea: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  emptySub: { color: colors.textSub, textAlign: 'center', lineHeight: 22 },
  refreshBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 12, paddingHorizontal: 32, marginTop: spacing.md,
  },
  refreshText: { color: colors.white, fontWeight: '700' },
  actions: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: spacing.xl, paddingVertical: spacing.xl,
  },
  actionBtn: {
    width: 60, height: 60, borderRadius: 30, alignItems: 'center',
    justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  passBtn: { backgroundColor: colors.bgCard, borderWidth: 2, borderColor: colors.pass },
  undoBtn: { backgroundColor: colors.bgCard, borderWidth: 2, borderColor: colors.accent, width: 48, height: 48, borderRadius: 24 },
  likeBtn: { backgroundColor: colors.bgCard, borderWidth: 2, borderColor: colors.like },
  actionIcon: { fontSize: 24 },
  matchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  matchModal: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl,
    padding: spacing.xxl, alignItems: 'center', width: W - 48,
    borderWidth: 1, borderColor: colors.primary,
  },
  matchEmoji: { fontSize: 64, marginBottom: spacing.md },
  matchTitle: { fontSize: 32, fontWeight: '900', color: colors.text, marginBottom: spacing.sm },
  matchSub: { color: colors.textSub, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 22 },
  matchBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 14, paddingHorizontal: 48, marginBottom: spacing.md,
  },
  matchBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  matchSkip: { paddingVertical: spacing.sm },
  matchSkipText: { color: colors.textMuted, fontSize: 15 },
});
