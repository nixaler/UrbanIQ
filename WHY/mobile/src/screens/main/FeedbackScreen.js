import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  ActivityIndicator, TouchableOpacity, TextInput, Alert, ScrollView,
} from 'react-native';
import { getPendingFeedback, submitFeedback, getFeedbackInbox } from '../../services/api';
import FeedbackItem from '../../components/FeedbackItem';
import { colors, spacing, radius } from '../../theme/colors';

export default function FeedbackScreen() {
  const [tab, setTab] = useState('inbox');
  const [inbox, setInbox] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [inboxData, pendingData] = await Promise.all([getFeedbackInbox(), getPendingFeedback()]);
      setInbox(inboxData.feedback || []);
      setPending(pendingData.requests || []);
    } catch {}
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>WHY Feedback</Text>
        {pending.length > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pending.length}</Text>
          </View>
        )}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'inbox' && styles.tabActive]}
          onPress={() => setTab('inbox')}
        >
          <Text style={[styles.tabText, tab === 'inbox' && styles.tabTextActive]}>Inbox</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'give' && styles.tabActive]}
          onPress={() => setTab('give')}
        >
          <Text style={[styles.tabText, tab === 'give' && styles.tabTextActive]}>
            Give Feedback {pending.length > 0 ? `(${pending.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : tab === 'inbox' ? (
        <FlatList
          data={inbox}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <FeedbackItem item={item} onReplySubmit={load} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📬</Text>
              <Text style={styles.emptyTitle}>No feedback yet</Text>
              <Text style={styles.emptySub}>Keep swiping — feedback arrives anonymously after patterns emerge.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <GiveFeedbackCard request={item} onSubmit={load} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyTitle}>All caught up</Text>
              <Text style={styles.emptySub}>No pending feedback requests right now.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function GiveFeedbackCard({ request, onSubmit }) {
  const [reason, setReason] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return Alert.alert('Required', 'Feedback reason is required and cannot be skipped.');
    setSubmitting(true);
    try {
      await submitFeedback(request.id, { reason: reason.trim(), suggestion: suggestion.trim() || undefined });
      onSubmit();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.giveCard}>
      <View style={styles.giveHeader}>
        <Text style={styles.giveLabel}>Give anonymous feedback</Text>
        <Text style={styles.giveNote}>This cannot be skipped.</Text>
      </View>
      <Text style={styles.giveSub}>
        You passed on someone. Help them grow by sharing why — anonymously.
      </Text>

      <Text style={styles.fieldLabel}>Why did you swipe left? *</Text>
      <TextInput
        style={styles.input}
        value={reason}
        onChangeText={setReason}
        placeholder="Be honest but kind..."
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={500}
      />

      <Text style={styles.fieldLabel}>Optional: a self-improvement suggestion</Text>
      <TextInput
        style={[styles.input, { minHeight: 60 }]}
        value={suggestion}
        onChangeText={setSuggestion}
        placeholder="e.g. 'More variety in photos would help'"
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={300}
      />

      <TouchableOpacity
        style={[styles.submitBtn, (!reason.trim() || submitting) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!reason.trim() || submitting}
      >
        <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Feedback'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  pendingBadge: {
    backgroundColor: colors.error, borderRadius: radius.full,
    width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
  },
  pendingBadgeText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  emptySub: { color: colors.textSub, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
  giveCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  giveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  giveLabel: { fontSize: 14, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  giveNote: { fontSize: 11, color: colors.error },
  giveSub: { color: colors.textSub, fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  fieldLabel: { color: colors.textSub, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: spacing.md },
  input: {
    backgroundColor: colors.bgInput, borderRadius: radius.md, padding: spacing.md,
    color: colors.text, fontSize: 15, minHeight: 90, borderWidth: 1, borderColor: colors.border,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 14, alignItems: 'center', marginTop: spacing.lg,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
