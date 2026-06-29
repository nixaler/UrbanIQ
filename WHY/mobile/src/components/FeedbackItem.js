import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';
import { replyToFeedback } from '../services/api';

export default function FeedbackItem({ item, onReplySubmit }) {
  const [showReply, setShowReply] = useState(false);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      await replyToFeedback(item.id, reply.trim());
      setReply('');
      setShowReply(false);
      onReplySubmit?.();
      Alert.alert('Sent', 'Your anonymous reply has been sent.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Anonymous Feedback</Text>
        <Text style={styles.date}>{formatDate(item.delivered_at)}</Text>
      </View>

      <Text style={styles.reason}>{item.reason}</Text>

      {item.suggestion && (
        <View style={styles.suggestion}>
          <Text style={styles.suggestionLabel}>Suggestion</Text>
          <Text style={styles.suggestionText}>{item.suggestion}</Text>
        </View>
      )}

      {item.my_reply ? (
        <View style={styles.myReply}>
          <Text style={styles.myReplyLabel}>Your reply</Text>
          <Text style={styles.myReplyText}>{item.my_reply}</Text>
        </View>
      ) : (
        <>
          {showReply ? (
            <View style={styles.replyBox}>
              <TextInput
                style={styles.input}
                placeholder="Reply anonymously..."
                placeholderTextColor={colors.textMuted}
                value={reply}
                onChangeText={setReply}
                multiline
                maxLength={500}
              />
              <View style={styles.replyActions}>
                <TouchableOpacity onPress={() => setShowReply(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleReply}
                  style={[styles.sendBtn, !reply.trim() && styles.sendBtnDisabled]}
                  disabled={!reply.trim() || submitting}
                >
                  <Text style={styles.sendText}>{submitting ? '...' : 'Send'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.replyToggle} onPress={() => setShowReply(true)}>
              <Text style={styles.replyToggleText}>Reply anonymously</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  label: { fontSize: 11, color: colors.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  date: { fontSize: 11, color: colors.textMuted },
  reason: { fontSize: 16, color: colors.text, lineHeight: 24 },
  suggestion: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  suggestionLabel: { fontSize: 11, color: colors.primary, fontWeight: '600', marginBottom: 4 },
  suggestionText: { fontSize: 14, color: colors.textSub },
  myReply: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(37,99,235,0.1)',
    borderRadius: radius.md,
  },
  myReplyLabel: { fontSize: 11, color: colors.primaryLight, fontWeight: '600', marginBottom: 4 },
  myReplyText: { fontSize: 14, color: colors.textSub },
  replyToggle: { marginTop: spacing.md },
  replyToggleText: { color: colors.primaryLight, fontSize: 14 },
  replyBox: { marginTop: spacing.md },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 14,
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
  },
  replyActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  cancelText: { color: colors.textSub, fontSize: 14 },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { color: colors.white, fontWeight: '600', fontSize: 14 },
});
