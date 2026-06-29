import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { getInsights } from '../../services/api';
import { colors, spacing, radius } from '../../theme/colors';

export default function InsightsScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const d = await getInsights();
        setData(d);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  const maxWeekCount = data?.weekly_trend?.reduce((max, w) => Math.max(max, parseInt(w.count)), 1);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Anonymized trends from your feedback — available to everyone.</Text>

        {/* Curiosity Score */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Curiosity Score</Text>
          <Text style={styles.bigNumber}>{data?.curiosity_score ?? 50}</Text>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${data?.curiosity_score ?? 50}%` }]} />
          </View>
          <Text style={styles.cardHint}>
            Rises as you receive more feedback. Shows how others perceive your openness.
          </Text>
        </View>

        {/* Total Feedback */}
        <View style={styles.row}>
          <View style={[styles.card, styles.cardHalf]}>
            <Text style={styles.cardLabel}>Total Received</Text>
            <Text style={styles.bigNumber}>{data?.total_feedback ?? 0}</Text>
            <Text style={styles.cardHint}>Feedback messages</Text>
          </View>
          <View style={[styles.card, styles.cardHalf]}>
            <Text style={styles.cardLabel}>This Month</Text>
            <Text style={styles.bigNumber}>
              {data?.weekly_trend?.slice(-4).reduce((s, w) => s + parseInt(w.count), 0) ?? 0}
            </Text>
            <Text style={styles.cardHint}>Last 4 weeks</Text>
          </View>
        </View>

        {/* Weekly Trend Bar Chart */}
        {data?.weekly_trend?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Feedback Over Time</Text>
            <View style={styles.barChart}>
              {data.weekly_trend.map((w, i) => (
                <View key={i} style={styles.barColumn}>
                  <View style={styles.barOuter}>
                    <View style={[
                      styles.barInner,
                      { height: `${(parseInt(w.count) / maxWeekCount) * 100}%` }
                    ]} />
                  </View>
                  <Text style={styles.barLabel}>
                    {new Date(w.week).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top Words */}
        {data?.top_words?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Common Themes</Text>
            <Text style={styles.cardHint}>Words that appear most in your anonymous feedback</Text>
            <View style={styles.wordCloud}>
              {data.top_words.map((w, i) => (
                <View key={i} style={[styles.wordChip, { opacity: 0.4 + (i / data.top_words.length) * 0.6 }]}>
                  <Text style={styles.wordText}>{w.word}</Text>
                  <Text style={styles.wordCount}>{w.freq}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Feedback Snippets */}
        {data?.recent_feedback?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Recent Feedback</Text>
            {data.recent_feedback.map((f, i) => (
              <View key={i} style={styles.recentItem}>
                <Text style={styles.recentReason} numberOfLines={3}>{f.reason}</Text>
                {f.suggestion && (
                  <Text style={styles.recentSuggestion} numberOfLines={2}>💡 {f.suggestion}</Text>
                )}
                <Text style={styles.recentDate}>
                  {new Date(f.delivered_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  subtitle: { color: colors.textSub, fontSize: 14, lineHeight: 22, marginBottom: spacing.xl },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  cardHalf: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: 0 },
  cardLabel: {
    color: colors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm,
  },
  bigNumber: { fontSize: 40, fontWeight: '900', color: colors.text, marginBottom: spacing.sm },
  bar: { height: 6, backgroundColor: colors.bgSurface, borderRadius: 3, overflow: 'hidden', marginBottom: spacing.sm },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  cardHint: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  barChart: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 120, marginTop: spacing.md,
  },
  barColumn: { flex: 1, alignItems: 'center', gap: 4 },
  barOuter: { flex: 1, width: '100%', backgroundColor: colors.bgSurface, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  barInner: { backgroundColor: colors.primary, borderRadius: 4, minHeight: 4 },
  barLabel: { color: colors.textMuted, fontSize: 9, textAlign: 'center' },
  wordCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  wordChip: {
    backgroundColor: colors.bgSurface, borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', gap: 6, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  wordText: { color: colors.text, fontSize: 13 },
  wordCount: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  recentItem: {
    paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border,
  },
  recentReason: { color: colors.text, fontSize: 14, lineHeight: 20, marginBottom: 4 },
  recentSuggestion: { color: colors.textSub, fontSize: 13, marginBottom: 4 },
  recentDate: { color: colors.textMuted, fontSize: 11 },
});
