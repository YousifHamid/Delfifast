import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CartProvider } from './src/state/CartContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <CartProvider>
        <AppNavigator user={user} onAuthed={setUser} />
      </CartProvider>
    </SafeAreaProvider>
  );
}
