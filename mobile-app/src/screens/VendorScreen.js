import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SectionList, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../theme/tokens';
import { VendorsAPI } from '../api/client';
import { useCart } from '../state/CartContext';

export default function VendorScreen({ route, navigation }) {
  const { vendorId } = route.params;
  const insets = useSafeAreaInsets();
  const [vendor, setVendor] = useState(null);
  const cart = useCart();

  useEffect(() => {
    VendorsAPI.get(vendorId).then(setVendor);
  }, [vendorId]);

  if (!vendor) return <View style={styles.screen} />;

  const sections = vendor.categories.map((c) => ({ title: c.name, data: c.products }));

  return (
    <View style={styles.screen}>
      <View style={styles.coverWrap}>
        <Image source={{ uri: vendor.coverImageUrl }} style={styles.cover} contentFit="cover" />
        <Pressable style={[styles.backBtn, { top: insets.top + spacing.xs }]} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.vendorName}>{vendor.name}</Text>
        <Text style={styles.meta}>
          {vendor.etaMinLabel ?? '20-30 MIN'} · EGP {vendor.deliveryFee} DELIVERY
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 120 }}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title.toUpperCase()}</Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.productRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{item.name}</Text>
              {!!item.description && <Text style={styles.productDesc}>{item.description}</Text>}
              {!!item.attributes && (item.attributes.weightKg || item.attributes.brand) && (
                <Text style={styles.productAttrs}>
                  {[item.attributes.brand, item.attributes.weightKg ? `${item.attributes.weightKg} kg` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
              <Text style={styles.price}>EGP {item.price}</Text>
              <Pressable
                style={styles.addBtn}
                disabled={!item.inStock}
                onPress={() => cart.dispatch({ type: 'ADD', payload: { vendor, product: item } })}
              >
                <Text style={styles.addBtnText}>{item.inStock ? 'Add +' : 'Sold out'}</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      {cart.items.length > 0 && (
        <Pressable style={styles.cartBar} onPress={() => navigation.navigate('Cart')}>
          <View>
            <Text style={styles.cartLabel}>YOUR ORDER</Text>
            <Text style={styles.cartTotal}>EGP {cart.subtotal}</Text>
          </View>
          <View style={styles.viewCartBtn}>
            <Text style={styles.viewCartText}>View Cart</Text>
            <View style={styles.cartCountBubble}>
              <Text style={styles.cartCountText}>{cart.itemCount}</Text>
            </View>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  coverWrap: { height: 220 },
  cover: { width: '100%', height: '100%' },
  backBtn: {
    position: 'absolute', left: spacing.md, width: 40, height: 40, borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 22, color: colors.ink },
  titleBlock: { padding: spacing.md },
  vendorName: { ...typography.h1, color: colors.ink },
  meta: { color: colors.muted, marginTop: spacing.xs, fontSize: 13 },
  sectionHeader: { ...typography.label, color: colors.muted, marginTop: spacing.md, marginBottom: spacing.sm },
  productRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.muted,
  },
  productName: { ...typography.h2, fontSize: 16, color: colors.ink },
  productDesc: { color: colors.muted, fontSize: 13, marginTop: 2 },
  productAttrs: { color: colors.accent, fontSize: 12, marginTop: 2, fontWeight: '600' },
  price: { fontWeight: '800', color: colors.ink },
  addBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  cartBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
  },
  cartLabel: { ...typography.label, color: colors.muted },
  cartTotal: { color: colors.white, fontWeight: '800', fontSize: 16 },
  viewCartBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  viewCartText: { color: colors.white, fontWeight: '700' },
  cartCountBubble: { backgroundColor: colors.white, borderRadius: radius.pill, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  cartCountText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
});
