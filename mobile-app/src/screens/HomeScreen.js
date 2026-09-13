import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, I18nManager } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../theme/tokens';
import { VendorsAPI } from '../api/client';

const BASE_FILTERS = [{ key: 'All', label: 'All', type: null }, { key: 'Restaurants', label: 'Restaurants', type: 'RESTAURANT' }];
const SUPERMARKET_FILTER = { key: 'Supermarket', label: 'Supermarket', type: 'SUPERMARKET' };

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [vendors, setVendors] = useState([]);
  const [filterKey, setFilterKey] = useState('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [supermarketEnabled, setSupermarketEnabled] = useState(false);

  useEffect(() => {
    VendorsAPI.publicFeatureFlags()
      .then((flags) => setSupermarketEnabled(!!flags.supermarket_vertical_enabled))
      .catch(() => setSupermarketEnabled(false));
  }, []);

  const filters = supermarketEnabled ? [...BASE_FILTERS, SUPERMARKET_FILTER] : BASE_FILTERS;
  const activeFilter = filters.find((f) => f.key === filterKey) ?? filters[0];

  useEffect(() => {
    setLoading(true);
    VendorsAPI.list({ city: 'Cairo', ...(activeFilter.type ? { type: activeFilter.type } : {}) })
      .then(setVendors)
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  }, [activeFilter.type]);

  const filtered = vendors.filter((v) => v.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>D</Text>
          </View>
          <View>
            <Text style={styles.brand}>DELIFAST</Text>
            <Text style={styles.city}>CAIRO</Text>
          </View>
        </View>
        <Pressable style={styles.deliverTo}>
          <Text style={styles.deliverToText}>DELIVER TO Nasr City ▾</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>NOW OPENING · MIDAN</Text>
        <Text style={styles.heroTitle}>Kofta{'\n'}Night</Text>
        <Text style={styles.heroSub}>CHARCOAL · HALAL — FROM EGP 120</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search shawarma, falafel, baklava..."
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
        textAlign={I18nManager.isRTL ? 'right' : 'left'}
      />

      <FlatList
        horizontal
        data={filters}
        keyExtractor={(f) => f.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setFilterKey(item.key)}
            style={[styles.chip, filterKey === item.key && styles.chipActive]}
          >
            <Text style={[styles.chipText, filterKey === item.key && styles.chipTextActive]}>{item.label}</Text>
          </Pressable>
        )}
        style={{ flexGrow: 0, marginBottom: spacing.md }}
      />

      <Text style={styles.sectionTitle}>
        {activeFilter.type === 'SUPERMARKET' ? 'Markets near you' : 'Near Midan El Tahrir'}
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={(v) => v.id}
        refreshing={loading}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.vendorRow}
            onPress={() => navigation.navigate('Vendor', { vendorId: item.id, vendorName: item.name })}
          >
            <Image source={{ uri: item.coverImageUrl }} style={styles.vendorThumb} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.vendorName}>{item.name}</Text>
              <Text style={styles.vendorMeta}>
                {item.type === 'SUPERMARKET' ? 'Supermarket' : 'Kitchen'} · {item.district}
              </Text>
            </View>
            <View style={styles.ratingPill}>
              <Text style={styles.ratingText}>★ {item.rating?.toFixed(1) ?? '—'}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: {
    width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontWeight: '900', fontSize: 18 },
  brand: { ...typography.h2, color: colors.ink },
  city: { ...typography.label, color: colors.muted },
  deliverTo: { backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  deliverToText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  hero: {
    margin: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.lg, minHeight: 220, justifyContent: 'flex-end',
  },
  heroLabel: { color: colors.accent, ...typography.label },
  heroTitle: { color: colors.white, ...typography.display, marginVertical: spacing.sm },
  heroSub: { color: colors.white, opacity: 0.8, fontSize: 12, letterSpacing: 0.5 },
  search: {
    marginHorizontal: spacing.md, backgroundColor: colors.surface, borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.md, color: colors.ink,
  },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.ink, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: colors.white },
  sectionTitle: { ...typography.h1, color: colors.ink, marginHorizontal: spacing.md, marginBottom: spacing.sm },
  vendorRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm,
  },
  vendorThumb: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.muted },
  vendorName: { ...typography.h2, color: colors.ink },
  vendorMeta: { color: colors.muted, fontSize: 13 },
  ratingPill: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  ratingText: { fontWeight: '700', fontSize: 12, color: colors.ink },
});
