import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../theme/tokens';
import { AuthAPI, setAuthToken } from '../api/client';

export default function RegisterScreen({ navigation, onAuthed }) {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (password.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await AuthAPI.register({ fullName, phone, password, language: 'en' });
      await setAuthToken(token);
      onAuthed(user);
    } catch (err) {
      Alert.alert('Could not create account', err?.response?.data?.error?.formErrors?.[0] || 'Please check your details.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top + spacing.xl }]} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
      <Text style={styles.title}>Create your account</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Full name</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholderTextColor={colors.muted} />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+20 1xx xxx xxxx" placeholderTextColor={colors.muted} />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={colors.muted} />
      </View>

      <Pressable style={styles.primaryBtn} onPress={handleRegister} disabled={loading}>
        <Text style={styles.primaryBtnText}>{loading ? 'Creating account…' : 'Create account'}</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Login')} style={{ marginTop: spacing.md, marginBottom: spacing.xl }}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { ...typography.h1, color: colors.ink, marginBottom: spacing.lg },
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
