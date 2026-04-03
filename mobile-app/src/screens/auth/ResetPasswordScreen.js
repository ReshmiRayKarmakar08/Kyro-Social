import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/colors';

const ResetPasswordScreen = ({ navigation, route }) => {
  const { resetPassword } = useAuth();
  const email = route?.params?.email || '';
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!otp.trim() || !newPassword.trim()) {
      Alert.alert('Missing Fields', 'Please enter the code and your new password.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ email, otp: otp.trim(), newPassword });
      Alert.alert('Success', 'Password reset successfully!', [
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Reset failed. Please try again.');
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
          <Icon name="shield-key-outline" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.title}>New Password</Text>
        <Text style={styles.subtitle}>Complete your account recovery</Text>

        <View style={styles.inputContainer}>
          <Icon name="numeric" size={20} color="rgba(255,255,255,0.4)" style={{ marginRight: 10 }} />
          <TextInput style={styles.input} placeholder="OTP Code" placeholderTextColor="rgba(255,255,255,0.3)" value={otp} onChangeText={setOtp} keyboardType="number-pad" />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="lock-outline" size={20} color="rgba(255,255,255,0.4)" style={{ marginRight: 10 }} />
          <TextInput style={styles.input} placeholder="New Password" placeholderTextColor="rgba(255,255,255,0.3)" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleReset} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Update Password</Text>}
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
  inputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', height: 52, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, marginBottom: 16 },
  input: { flex: 1, fontSize: 15, color: '#FFFFFF', fontWeight: '500' },
  primaryButton: { width: '100%', height: 52, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginTop: 8, elevation: 6 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});

export default ResetPasswordScreen;
