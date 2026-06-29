import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Logo from '../../components/Logo';
import { colors, spacing, radius } from '../../theme/colors';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Logo size={100} />
          <Text style={styles.appName}>WHY</Text>
          <Text style={styles.tagline}>The dating app where{'\n'}curiosity meets connection.</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.primaryBtnText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryBtnText}>Sign In</Text>
          </TouchableOpacity>

          <Text style={styles.legal}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, justifyContent: 'space-between', padding: spacing.xl },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  appName: {
    fontSize: 52,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 8,
  },
  tagline: {
    fontSize: 18,
    color: colors.textSub,
    textAlign: 'center',
    lineHeight: 26,
  },
  actions: { gap: spacing.md },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: { color: colors.text, fontSize: 17, fontWeight: '600' },
  legal: { color: colors.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
