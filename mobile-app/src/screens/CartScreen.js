import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../theme/tokens';
import { useCart } from '../state/CartContext';
import { OrdersAPI } from '../api/client';

const DELIVERY_FEE = 25; // fallback display value; server recomputes the authoritative total

export default function CartScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const [payment, setPayment] = useState('CASH_ON_DELIVERY');
  const [placing, setPlacing] = useState(false);

  const total = cart.subtotal + (cart.items.length ? DELIVERY_FEE : 0);

  async function placeOrder() {
    setPlacing(true);
    try {
      const order = await OrdersAPI.place({
        vendorId: cart.vendorId,
        items: cart.items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        paymentMethod: payment,
        addressId: 'default', // wire up to the user's selected Address in a real checkout flow
      });
      cart.dispatch({ type: 'CLEAR' });
      navigation.navigate('Orders', { justPlacedOrderId: order.id });
    } catch (err) {
      Alert.alert('Order failed', err?.response?.data?.error || 'Please try again.');
    } finally {
      setPlacing(false);
    }
  }

  if (cart.items.length === 0) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Your Basket</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nothing on the grill yet</Text>
          <Text style={styles.emptySub}>Pick a kitchen and add a few plates.</Text>
          <Pressable style={styles.browseBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.browseBtnText}>Browse kitchens</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Your Basket</Text>
      <Text style={styles.vendorLabel}>{cart.vendorName?.toUpperCase()}</Text>

      <FlatList
        data={cart.items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: spacing.md }}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemEach}>EGP {item.price} each</Text>
            </View>
            <View style={styles.qtyControl}>
              <Pressable onPress={() => cart.dispatch({ type: 'SET_QTY', payload: { id: item.id, quantity: item.quantity - 1 } })}>
                <Text style={styles.qtyBtn}>−</Text>
              </Pressable>
              <Text style={styles.qtyValue}>{item.quantity}</Text>
              <Pressable onPress={() => cart.dispatch({ type: 'SET_QTY', payload: { id: item.id, quantity: item.quantity + 1 } })}>
                <Text style={styles.qtyBtn}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.itemTotal}>EGP {item.price * item.quantity}</Text>
          </View>
        )}
      />

      <Text style={styles.sectionLabel}>PAYMENT</Text>
      <View style={styles.paymentRow}>
        {[
          { key: 'CASH_ON_DELIVERY', label: 'Cash on delivery' },
          { key: 'CARD_ON_DELIVERY', label: 'Card on delivery' },
        ].map((opt) => (
          <Pressable
            key={opt.key}
            style={[styles.paymentChip, payment === opt.key && styles.paymentChipActive]}
            onPress={() => setPayment(opt.key)}
          >
            <Text style={[styles.paymentChipText, payment === opt.key && styles.paymentChipTextActive]}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.summaryCard}>
        <Row label="Subtotal" value={`EGP ${cart.subtotal}`} />
        <Row label="Delivery" value={`EGP ${DELIVERY_FEE}`} />
        <View style={styles.divider} />
        <Row label="TOTAL" value={`EGP ${total}`} bold />
      </View>

      <Pressable style={styles.placeOrderBtn} onPress={placeOrder} disabled={placing}>
        <Text style={styles.placeOrderText}>{placing ? 'Placing order…' : 'Place order'}</Text>
        <Text style={styles.placeOrderTotal}>EGP {total} →</Text>
      </Pressable>
    </View>
  );
}

function Row({ label, value, bold }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.summaryLabelBold]}>{label}</Text>
      <Text style={[styles.summaryValue, bold && styles.summaryLabelBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { ...typography.h1, color: colors.ink, marginHorizontal: spacing.md },
  vendorLabel: { ...typography.label, color: colors.muted, marginHorizontal: spacing.md, marginBottom: spacing.sm },
  emptyCard: { margin: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.xl, alignItems: 'center' },
  emptyTitle: { ...typography.h2, color: colors.ink },
  emptySub: { color: colors.muted, marginTop: spacing.xs, marginBottom: spacing.md },
  browseBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  browseBtnText: { color: colors.white, fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  itemName: { ...typography.h2, fontSize: 15, color: colors.ink },
  itemEach: { color: colors.muted, fontSize: 12 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  qtyBtn: { fontSize: 18, color: colors.primary, fontWeight: '800', width: 20, textAlign: 'center' },
  qtyValue: { fontWeight: '700', color: colors.ink },
  itemTotal: { fontWeight: '800', color: colors.ink, minWidth: 70, textAlign: 'right' },
  sectionLabel: { ...typography.label, color: colors.muted, marginHorizontal: spacing.md, marginTop: spacing.md },
  paymentRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.sm },
  paymentChip: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center' },
  paymentChipActive: { backgroundColor: colors.card },
  paymentChipText: { color: colors.ink, fontWeight: '600' },
  paymentChipTextActive: { color: colors.white },
  summaryCard: { backgroundColor: colors.surface, borderRadius: radius.md, margin: spacing.md, padding: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { color: colors.muted },
  summaryValue: { color: colors.ink, fontWeight: '600' },
  summaryLabelBold: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.muted, marginVertical: spacing.xs },
  placeOrderBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.primary, marginHorizontal: spacing.md, marginBottom: spacing.md,
    borderRadius: radius.md, padding: spacing.md,
  },
  placeOrderText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  placeOrderTotal: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
