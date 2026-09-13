import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../theme/tokens';
import { OrdersAPI } from '../api/client';

const STEPS = ['CONFIRMED', 'PREPARING', 'RIDER_PICKED_UP', 'DELIVERED'];
const STEP_LABELS = {
  CONFIRMED: 'Order confirmed',
  PREPARING: 'On the charcoal',
  RIDER_PICKED_UP: 'Rider picked up',
  DELIVERED: 'At your door',
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    OrdersAPI.list().then(setOrders).catch(() => setOrders([]));
  }, []);

  const live = orders.find((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const earlier = orders.filter((o) => o.id !== live?.id);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Orders</Text>

      {live && (
        <View style={styles.liveCard}>
          <Text style={styles.liveLabel}>● LIVE · {live.vendor?.name}</Text>
          <Text style={styles.liveVendor}>Order #{live.code}</Text>
          {STEPS.map((step) => {
            const reached = STEPS.indexOf(step) <= STEPS.indexOf(live.status);
            const entry = live.statusHistory?.find((h) => h.status === step);
            return (
              <View key={step} style={styles.stepRow}>
                <View style={[styles.stepDot, reached && styles.stepDotActive]}>
                  {reached && <Text style={styles.stepCheck}>✓</Text>}
                </View>
                <Text style={[styles.stepLabel, reached && styles.stepLabelActive]}>{STEP_LABELS[step]}</Text>
                <Text style={styles.stepTime}>
                  {entry ? new Date(entry.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <Text style={styles.sectionLabel}>EARLIER</Text>
      <FlatList
        data={earlier}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}
        renderItem={({ item }) => (
          <Pressable style={styles.pastRow}>
            <View>
              <Text style={styles.pastVendor}>{item.vendor?.name}</Text>
              <Text style={styles.pastMeta}>
                {new Date(item.createdAt).toLocaleDateString([], { weekday: 'short' })} ·{' '}
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
                {item.status === 'DELIVERED' ? 'DELIVERED' : item.status}
              </Text>
            </View>
            <Text style={styles.pastTotal}>EGP {item.total}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { ...typography.h1, color: colors.ink, marginHorizontal: spacing.md, marginBottom: spacing.sm },
  liveCard: { backgroundColor: colors.card, borderRadius: radius.lg, margin: spacing.md, padding: spacing.md },
  liveLabel: { color: colors.primary, fontWeight: '700', fontSize: 12, marginBottom: 4 },
  liveVendor: { color: colors.white, ...typography.h2, marginBottom: spacing.sm },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  stepDot: { width: 22, height: 22, borderRadius: radius.pill, backgroundColor: '#3A332A', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: colors.primary },
  stepCheck: { color: colors.white, fontSize: 12, fontWeight: '800' },
  stepLabel: { flex: 1, color: colors.muted },
  stepLabelActive: { color: colors.white, fontWeight: '600' },
  stepTime: { color: colors.muted, fontSize: 12 },
  sectionLabel: { ...typography.label, color: colors.muted, marginHorizontal: spacing.md, marginBottom: spacing.sm },
  pastRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
  },
  pastVendor: { fontWeight: '700', color: colors.ink },
  pastMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  pastTotal: { fontWeight: '800', color: colors.ink },
});
