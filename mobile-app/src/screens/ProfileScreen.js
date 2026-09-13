import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../theme/tokens';
import { clearAuthToken } from '../api/client';

export default function ProfileScreen({ navigation, user }) {
  const insets = useSafeAreaInsets();

  const rows = [
    { label: 'Addresses', value: user?.addressSummary ?? 'Add an address' },
    { label: 'Payment', value: 'Cash on delivery' },
    { label: 'Phone', value: user?.phone ?? '—' },
    { label: 'Language', value: user?.language === 'ar' ? 'العربية' : 'English' },
  ];

  async function signOut() {
    await clearAuthToken();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Account</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.fullName?.[0] ?? '?'}</Text>
        </View>
        <View>
          <Text style={styles.name}>{user?.fullName ?? 'Guest'}</Text>
          <Text style={styles.sub}>
            {user?.orderCount ?? 0} orders · Member since {user?.memberSince ?? '—'}
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {rows.map((r, idx) => (
          <View key={r.label} style={[styles.row, idx === rows.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Text style={styles.rowValue}>{r.value}</Text>
          </View>
        ))}
        <Pressable style={styles.row}>
          <Text style={styles.rowLabel}>Help & support</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <Pressable style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { ...typography.h1, color: colors.ink, marginHorizontal: spacing.md, marginBottom: spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.lg, margin: spacing.md, padding: spacing.md,
  },
  avatar: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 18 },
  name: { color: colors.white, ...typography.h2 },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  list: { backgroundColor: colors.surface, borderRadius: radius.lg, marginHorizontal: spacing.md },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.muted,
  },
  rowLabel: { color: colors.ink, fontWeight: '600' },
  rowValue: { color: colors.muted },
  chevron: { color: colors.muted, fontSize: 18 },
  signOut: { margin: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  signOutText: { color: colors.primary, fontWeight: '700' },
});
