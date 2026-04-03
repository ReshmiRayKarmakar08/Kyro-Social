// Minimal test app to confirm the native build works
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const App = () => (
  <View style={styles.container}>
    <Text style={styles.title}>🎉 Kyro Social</Text>
    <Text style={styles.subtitle}>Native build is working!</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FF6154',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
  },
});

export default App;
