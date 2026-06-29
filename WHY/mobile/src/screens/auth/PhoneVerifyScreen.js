import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { verifyPhone, resendCode } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius } from '../../theme/colors';

export default function PhoneVerifyScreen({ navigation }) {
  const { user } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  const handleChange = (val, idx) => {
    const next = [...code];
    next[idx] = val.slice(-1);
    setCode(next);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
    if (next.every(Boolean)) handleSubmit(next.join(''));
  };

  const handleSubmit = async (codeStr) => {
    setLoading(true);
    try {
      await verifyPhone(codeStr || code.join(''));
      navigation.replace('IdentityVerify');
    } catch (err) {
      Alert.alert('Error', err.message);
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Verify your phone</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to {user?.phone || 'your phone'}
        </Text>

        <View style={styles.codeRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => (inputs.current[i] = r)}
              style={[styles.codeInput, digit && styles.codeInputFilled]}
              value={digit}
              onChangeText={(v) => handleChange(v, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, (loading || !code.every(Boolean)) && styles.btnDisabled]}
          onPress={() => handleSubmit()}
          disabled={loading || !code.every(Boolean)}
        >
          <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resend}
          onPress={async () => {
            try { await resendCode(); Alert.alert('Sent', 'Code resent!'); }
            catch (e) { Alert.alert('Error', e.message); }
          }}
        >
          <Text style={styles.resendText}>Didn't get it? Resend code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.xl, alignItems: 'center', paddingTop: 80 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  subtitle: { color: colors.textSub, textAlign: 'center', marginBottom: spacing.xxl, lineHeight: 22 },
  codeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  codeInput: {
    width: 48, height: 56, borderRadius: radius.md,
    backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border,
    fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center',
  },
  codeInputFilled: { borderColor: colors.primary },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 16, paddingHorizontal: 60, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  resend: { marginTop: spacing.xl },
  resendText: { color: colors.primary, fontSize: 15 },
});
