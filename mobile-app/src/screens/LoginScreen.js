import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../theme/tokens';
import { AuthAPI, setAuthToken } from '../api/client';

// ─── TEST CREDENTIALS (remove before production) ─────────────────────────────
const TEST_PHONE    = '01000000000';
const TEST_PASSWORD = 'test123';
const MOCK_USER     = { id: 'test-1', name: 'Test User', phone: TEST_PHONE };
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginScreen({ navigation, onAuthed }) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone]       = useState(TEST_PHONE);
  const [password, setPassword] = useState(TEST_PASSWORD);
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    // Mock bypass: use test credentials without hitting the backend
    if (phone === TEST_PHONE && password === TEST_PASSWORD) {
      await setAuthToken('mock-token-for-testing');
      onAuthed(MOCK_USER);
      return;
    }

    // Real login for any other credentials
    setLoading(true);
    try {
      const { token, user } = await AuthAPI.login({ phone, password });
      await setAuthToken(token);
      onAuthed(user);
    } catch (err) {
      Alert.alert('Sign in failed', err?.response?.data?.error || 'Check your phone and password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={styles.brand}>Delifast</Text>
      <Text style={styles.tagline}>Cairo's kitchens and markets, delivered fast.</Text>

      <View style={styles.testBanner}>
        <Text style={styles.testBannerText}>🧪 Test mode — tap Sign in to enter</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+20 1xx xxx xxxx"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={colors.muted}
        />
      </View>

      <Pressable style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
        <Text style={styles.primaryBtnText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Register')} style={{ marginTop: spacing.md }}>
        <Text style={styles.link}>New to Delifast? Create an account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  brand: { ...typography.display, fontSize: 34, color: colors.primary },
  tagline: { color: colors.muted, marginTop: spacing.xs, marginBottom: spacing.lg },
  testBanner: {
    backgroundColor: '#FFF3CD',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#FFECB3',
  },
  testBannerText: { color: '#856404', fontWeight: '600', fontSize: 13, textAlign: 'center' },
  field: { marginBottom: spacing.md },
  label: { ...typography.label, color: colors.muted, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, color: colors.ink, fontSize: 15,
  },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  link: { color: colors.primary, fontWeight: '600', textAlign: 'center' },
});
