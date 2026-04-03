import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/colors';

const SignupScreen = ({ navigation }) => {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      await signup({ name: name.trim(), username: username.trim().toLowerCase(), email: email.trim(), password });
    } catch (err) {
      Alert.alert('Signup Failed', err?.response?.data?.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={styles.brandSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>K</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Create Account</Text>
            <Text style={styles.formSubtitle}>Join the community of builders</Text>

            <View style={styles.inputContainer}>
              <Icon name="account-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={Colors.light.textCaption} value={name} onChangeText={setName} />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="at" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Username" placeholderTextColor={Colors.light.textCaption} value={username} onChangeText={(t) => setUsername(t.toLowerCase())} autoCapitalize="none" autoCorrect={false} />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="email-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Colors.light.textCaption} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Password" placeholderTextColor={Colors.light.textCaption} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleSignup} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.primaryButtonText}>Create Account</Text>}
            </TouchableOpacity>

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.switchLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  brandSection: { alignItems: 'center', paddingTop: 48, paddingBottom: 24 },
  logoContainer: { width: 56, height: 56, borderRadius: 14, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  logoText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 32, padding: 28, elevation: 12 },
  formTitle: { fontSize: 28, fontWeight: '900', color: '#1A1A2E', textAlign: 'center', letterSpacing: -0.5, marginBottom: 6 },
  formSubtitle: { fontSize: 15, color: Colors.light.textSecondary, textAlign: 'center', fontWeight: '500', marginBottom: 24 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', marginBottom: 14, paddingHorizontal: 14, height: 52 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1A1A2E', fontWeight: '500' },
  primaryButton: { height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary, marginTop: 8, marginBottom: 20, elevation: 6 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText: { fontSize: 14, color: Colors.light.textSecondary, fontWeight: '600' },
  switchLink: { fontSize: 14, color: Colors.primary, fontWeight: '800' },
});

export default SignupScreen;
