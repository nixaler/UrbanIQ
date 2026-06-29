import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { login as apiLogin } from '../../services/api';
import { colors, spacing, radius } from '../../theme/colors';
import Logo from '../../components/Logo';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isPhone = identifier.startsWith('+');

  const handleLogin = async () => {
    if (!identifier.trim() || !password) return Alert.alert('Error', 'Fill in all fields');
    setLoading(true);
    try {
      const payload = { password };
      if (isPhone) payload.phone = identifier.trim();
      else payload.email = identifier.trim().toLowerCase();
      const { token, user } = await apiLogin(payload);
      await login(token, user);
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <View style={styles.container}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Logo size={60} />
            <Text style={styles.title}>Welcome back</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email or phone number</Text>
            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="you@example.com or +1..."
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.label, { marginTop: spacing.md }]}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.signupLink}>
              <Text style={styles.signupText}>Don't have an account? <Text style={styles.signupTextBold}>Sign up</Text></Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  kav: { flex: 1 },
  container: { flex: 1, padding: spacing.xl },
  back: { marginBottom: spacing.lg },
  backText: { color: colors.primary, fontSize: 16 },
  header: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.xxl },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  form: {},
  label: { color: colors.textSub, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: colors.bgInput, borderRadius: radius.md, padding: spacing.md,
    color: colors.text, fontSize: 16, borderWidth: 1, borderColor: colors.border,
  },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 16, alignItems: 'center', marginTop: spacing.xl,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  signupLink: { alignItems: 'center', marginTop: spacing.xl },
  signupText: { color: colors.textSub, fontSize: 14 },
  signupTextBold: { color: colors.primary, fontWeight: '700' },
});
