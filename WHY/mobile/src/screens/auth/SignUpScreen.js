import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { register } from '../../services/api';
import { colors, spacing, radius } from '../../theme/colors';

const GENDERS = ['man', 'woman', 'nonbinary', 'other'];
const SEEKING = ['man', 'woman', 'nonbinary', 'other'];

export default function SignUpScreen({ navigation }) {
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    date_of_birth: '',
    gender: '',
    seeking: [],
    usePhone: false,
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleSeeking = (g) => {
    set('seeking', form.seeking.includes(g)
      ? form.seeking.filter((x) => x !== g)
      : [...form.seeking, g]
    );
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return Alert.alert('Error', 'Name is required');
    if (!form.date_of_birth.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return Alert.alert('Error', 'Date of birth must be YYYY-MM-DD');
    }
    if (!form.gender) return Alert.alert('Error', 'Gender is required');
    if (!form.seeking.length) return Alert.alert('Error', 'Select who you\'re looking for');
    if (form.password.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters');

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        password: form.password,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        seeking: form.seeking,
      };
      if (form.usePhone) payload.phone = form.phone;
      else payload.email = form.email;

      const { token, user } = await register(payload);
      await login(token, user);

      if (form.usePhone) navigation.replace('PhoneVerify');
      else navigation.replace('IdentityVerify');
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create your profile</Text>

          <Field label="Your name" value={form.name} onChangeText={(v) => set('name', v)} placeholder="First name" />

          {/* Toggle phone vs email */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggle, !form.usePhone && styles.toggleActive]}
              onPress={() => set('usePhone', false)}
            >
              <Text style={[styles.toggleText, !form.usePhone && styles.toggleTextActive]}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggle, form.usePhone && styles.toggleActive]}
              onPress={() => set('usePhone', true)}
            >
              <Text style={[styles.toggleText, form.usePhone && styles.toggleTextActive]}>Phone</Text>
            </TouchableOpacity>
          </View>

          {form.usePhone ? (
            <Field label="Phone number" value={form.phone} onChangeText={(v) => set('phone', v)}
              placeholder="+1 555 000 0000" keyboardType="phone-pad" />
          ) : (
            <Field label="Email" value={form.email} onChangeText={(v) => set('email', v)}
              placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          )}

          <Field label="Password" value={form.password} onChangeText={(v) => set('password', v)}
            placeholder="Min. 8 characters" secureTextEntry />

          <Field label="Date of birth (YYYY-MM-DD)" value={form.date_of_birth}
            onChangeText={(v) => set('date_of_birth', v)} placeholder="1995-04-20" />

          <Text style={styles.sectionLabel}>I am a...</Text>
          <View style={styles.chips}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, form.gender === g && styles.chipActive]}
                onPress={() => set('gender', g)}
              >
                <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>
                  {capitalize(g)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Looking for...</Text>
          <View style={styles.chips}>
            {SEEKING.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, form.seeking.includes(g) && styles.chipActive]}
                onPress={() => toggleSeeking(g)}
              >
                <Text style={[styles.chipText, form.seeking.includes(g) && styles.chipTextActive]}>
                  {capitalize(g)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Creating...' : 'Continue'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={colors.textMuted} {...props} />
    </View>
  );
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, paddingBottom: 60 },
  back: { marginBottom: spacing.lg },
  backText: { color: colors.primary, fontSize: 16 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: spacing.xl },
  toggleRow: { flexDirection: 'row', backgroundColor: colors.bgSurface, borderRadius: radius.full, padding: 4, marginBottom: spacing.md },
  toggle: { flex: 1, paddingVertical: 8, borderRadius: radius.full, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { color: colors.textSub, fontWeight: '600' },
  toggleTextActive: { color: colors.white },
  field: { marginBottom: spacing.md },
  label: { color: colors.textSub, fontSize: 13, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: colors.bgInput, borderRadius: radius.md, padding: spacing.md,
    color: colors.text, fontSize: 16, borderWidth: 1, borderColor: colors.border,
  },
  sectionLabel: { color: colors.textSub, fontSize: 13, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.bgSurface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSub, fontSize: 14 },
  chipTextActive: { color: colors.white, fontWeight: '600' },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 16, alignItems: 'center', marginTop: spacing.lg,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: colors.white, fontSize: 17, fontWeight: '700' },
});
