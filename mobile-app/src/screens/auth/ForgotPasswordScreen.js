import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/colors';

const ForgotPasswordScreen = ({ navigation }) => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Missing Email', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      Alert.alert('Code Sent', res.message || 'A reset code has been sent to your email.');
      navigation.navigate('ResetPassword', { email: email.trim() });
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Icon name="lock-reset" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email to receive a reset code</Text>

        <View style={styles.inputContainer}>
          <Icon name="email-outline" size={20} color="rgba(255,255,255,0.4)" style={{ marginRight: 10 }} />
          <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor="rgba(255,255,255,0.3)" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Send Reset Code</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 16 }}>
          <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 15 }}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 8 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,97,84,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginBottom: 10 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginBottom: 32, fontWeight: '500' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', height: 52, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, marginBottom: 20 },
  input: { flex: 1, fontSize: 15, color: '#FFFFFF', fontWeight: '500' },
  primaryButton: { width: '100%', height: 52, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});

export default ForgotPasswordScreen;
