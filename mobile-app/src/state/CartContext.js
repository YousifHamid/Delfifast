import React, { createContext, useContext, useMemo, useReducer } from 'react';

const CartContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { vendor, product } = action.payload;
      // Starting a basket from a different vendor replaces the old one —
      // matches how the reference app scopes "Your Basket" to one kitchen.
      if (state.vendorId && state.vendorId !== vendor.id) {
        return { vendorId: vendor.id, vendorName: vendor.name, items: [{ ...product, quantity: 1 }] };
      }
      const existing = state.items.find((i) => i.id === product.id);
      const items = existing
        ? state.items.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...state.items, { ...product, quantity: 1 }];
      return { vendorId: vendor.id, vendorName: vendor.name, items };
    }
    case 'SET_QTY': {
      const items = state.items
        .map((i) => (i.id === action.payload.id ? { ...i, quantity: action.payload.quantity } : i))
        .filter((i) => i.quantity > 0);
      return { ...state, items, vendorId: items.length ? state.vendorId : null };
    }
    case 'CLEAR':
      return { vendorId: null, vendorName: null, items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { vendorId: null, vendorName: null, items: [] });

  const subtotal = useMemo(
    () => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [state.items]
  );
  const itemCount = useMemo(() => state.items.reduce((sum, i) => sum + i.quantity, 0), [state.items]);

  const value = { ...state, subtotal, itemCount, dispatch };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
