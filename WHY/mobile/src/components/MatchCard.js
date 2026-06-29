import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

export default function MatchCard({ match, onPress }) {
  const other = match.other_user;
  const unread = parseInt(match.unread_count) || 0;
  const lastMsg = match.last_message;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.avatarWrap}>
        {other?.photo ? (
          <Image source={{ uri: other.photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarLetter}>{other?.name?.[0] ?? '?'}</Text>
          </View>
        )}
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.name}>{other?.name ?? 'Unknown'}</Text>
          {lastMsg && (
            <Text style={styles.time}>
              {formatTime(lastMsg.created_at)}
            </Text>
          )}
        </View>
        <Text style={[styles.preview, unread > 0 && styles.previewUnread]} numberOfLines={1}>
          {lastMsg
            ? lastMsg.photo_url
              ? '📷 Photo'
              : lastMsg.content
            : 'Say hello! 👋'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarWrap: { position: 'relative', marginRight: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: {
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: colors.textSub, fontSize: 22, fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  content: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  time: { fontSize: 12, color: colors.textMuted },
  preview: { fontSize: 14, color: colors.textSub, marginTop: 2 },
  previewUnread: { color: colors.text, fontWeight: '600' },
});
