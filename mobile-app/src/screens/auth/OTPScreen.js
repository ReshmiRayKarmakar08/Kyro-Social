import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/colors';

const OTPScreen = ({ navigation, route }) => {
  const { verifyOTP, resendOTP } = useAuth();
  const email = route?.params?.email || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      await verifyOTP({ email, otp });
      Alert.alert('Success', 'Email verified successfully!');
    } catch (err) {
      Alert.alert('Verification Failed', err?.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOTP(email);
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
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
          <Icon name="email-check-outline" size={40} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Verify Email</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={{ color: Colors.primary, fontWeight: '700' }}>{email}</Text>
        </Text>

        <TextInput
          style={styles.otpInput}
          value={otp}
          onChangeText={(t) => setOtp(t.replace(/\D/g, ''))}
          maxLength={6}
          keyboardType="number-pad"
          placeholder="000000"
          placeholderTextColor="rgba(255,255,255,0.2)"
          textAlign="center"
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleVerify} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Verify Email</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={resending} style={styles.resendButton}>
          <Text style={styles.resendText}>
            {resending ? 'Sending...' : 'Resend Code'}
          </Text>
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
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 22, marginBottom: 32, fontWeight: '500' },
  otpInput: { width: '80%', height: 60, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#FFFFFF', fontSize: 28, fontWeight: '800', letterSpacing: 12, marginBottom: 28 },
  primaryButton: { width: '100%', height: 52, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 6 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  resendButton: { padding: 8 },
  resendText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
});

export default OTPScreen;
