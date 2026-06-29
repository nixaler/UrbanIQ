import React, { useState } from 'react';
import {
  View, Text, Switch, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Alert,
} from 'react-native';
import { updateMe, deleteMe, activateBoost, activatePremium } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius } from '../../theme/colors';

export default function SettingsScreen({ navigation }) {
  const { user, refreshUser, logout } = useAuth();
  const [saving, setSaving] = useState(false);

  const toggle = async (field, value) => {
    setSaving(true);
    try {
      await updateMe({ [field]: value });
      await refreshUser();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete all your data including matches and messages. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever', style: 'destructive',
          onPress: async () => {
            try {
              await deleteMe();
              logout();
            } catch (err) { Alert.alert('Error', err.message); }
          },
        },
      ]
    );
  };

  const handleBoostActivate = async () => {
    try {
      const { boost } = await activateBoost();
      Alert.alert('Boost Active! 🚀', `Your profile is boosted for 30 minutes.`);
      await refreshUser();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handlePremiumActivate = async () => {
    // In a real app this integrates with StoreKit/IAP
    Alert.alert('Premium', 'Purchase flow would open here (StoreKit integration required for production).');
  };

  const isPremium = user?.is_premium && (!user?.premium_expires_at || new Date(user.premium_expires_at) > new Date());

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Subscription */}
        <Section title="Subscription">
          <View style={styles.premiumBanner}>
            <View>
              <Text style={styles.premiumTitle}>{isPremium ? '⭐ Premium Active' : '⭐ Go Premium'}</Text>
              <Text style={styles.premiumSub}>
                {isPremium
                  ? `Expires ${new Date(user.premium_expires_at).toLocaleDateString()}`
                  : 'Unlimited swipes, see who liked you, hide from feedback'}
              </Text>
            </View>
            {!isPremium && (
              <TouchableOpacity style={styles.premiumBtn} onPress={handlePremiumActivate}>
                <Text style={styles.premiumBtnText}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>
        </Section>

        {/* Boosts */}
        <Section title="Boosts">
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Boosts remaining</Text>
            <Text style={styles.rowValue}>{user?.boosts_remaining ?? 0}</Text>
          </View>
          <TouchableOpacity
            style={[styles.btn, !user?.boosts_remaining && styles.btnDisabled]}
            disabled={!user?.boosts_remaining}
            onPress={handleBoostActivate}
          >
            <Text style={styles.btnText}>Activate Boost (30 min)</Text>
          </TouchableOpacity>
        </Section>

        {/* Discovery */}
        <Section title="Discovery">
          <SettingRow
            label="Pause profile"
            description="Hides you from the swipe stack while paused"
            value={user?.profile_paused}
            onValueChange={(v) => toggle('profile_paused', v)}
          />
        </Section>

        {/* WHY Feedback */}
        <Section title="WHY Feedback">
          <SettingRow
            label="Opt out of feedback"
            description="You won't receive any anonymous feedback messages"
            value={user?.feedback_opt_out}
            onValueChange={(v) => toggle('feedback_opt_out', v)}
          />
          {isPremium && (
            <SettingRow
              label="Hide from feedback system"
              description="People who swipe left on you won't be prompted for WHY"
              value={user?.hidden_from_feedback}
              onValueChange={(v) => toggle('hidden_from_feedback', v)}
            />
          )}
        </Section>

        {/* Dealbreaker Filters */}
        <Section title="Dealbreaker Filters">
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Min age</Text>
            <Text style={styles.rowValue}>{user?.filter_min_age}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Max age</Text>
            <Text style={styles.rowValue}>{user?.filter_max_age}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Max distance</Text>
            <Text style={styles.rowValue}>{user?.filter_max_distance} km</Text>
          </View>
          <Text style={styles.filterHint}>
            Edit filters from the Swipe screen (coming soon: in-app filter UI).
          </Text>
        </Section>

        {/* Danger Zone */}
        <Section title="Account">
          <TouchableOpacity style={styles.dangerBtn} onPress={handleDeleteAccount}>
            <Text style={styles.dangerBtnText}>Delete My Account</Text>
          </TouchableOpacity>
          <Text style={styles.dangerHint}>All data will be permanently wiped. This cannot be undone.</Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function SettingRow({ label, description, value, onValueChange }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingText}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDesc}>{description}</Text>}
      </View>
      <Switch
        value={!!value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  back: { color: colors.primary, fontSize: 16 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm,
  },
  sectionBody: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  premiumBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg,
  },
  premiumTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  premiumSub: { fontSize: 13, color: colors.textSub, marginTop: 2 },
  premiumBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 8, paddingHorizontal: 20,
  },
  premiumBtnText: { color: colors.white, fontWeight: '700' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowLabel: { color: colors.text, fontSize: 15 },
  rowValue: { color: colors.textSub, fontSize: 15 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  settingText: { flex: 1, marginRight: spacing.md },
  settingLabel: { color: colors.text, fontSize: 15, fontWeight: '500' },
  settingDesc: { color: colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 16 },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 12, alignItems: 'center', margin: spacing.lg,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  filterHint: { color: colors.textMuted, fontSize: 12, padding: spacing.lg, paddingTop: 0 },
  dangerBtn: {
    borderWidth: 1, borderColor: colors.error, borderRadius: radius.full,
    paddingVertical: 12, alignItems: 'center', margin: spacing.lg,
  },
  dangerBtnText: { color: colors.error, fontWeight: '700', fontSize: 15 },
  dangerHint: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.md },
});
