import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { Colors } from '../theme/colors';

const SettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useThemeContext();

  const SettingRow = ({ icon, label, rightComponent, onPress, danger }) => (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: theme.colors.divider }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.settingLeft}>
        <Icon name={icon} size={22} color={danger ? Colors.error : theme.colors.textSecondary} />
        <Text style={[styles.settingLabel, { color: danger ? Colors.error : theme.colors.text }]}>{label}</Text>
      </View>
      {rightComponent || (onPress && <Icon name="chevron-right" size={20} color={theme.colors.textCaption} />)}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Appearance</Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingRow
            icon={isDark ? 'weather-night' : 'weather-sunny'}
            label="Dark Mode"
            rightComponent={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#D1D5DB', true: 'rgba(255,97,84,0.4)' }}
                thumbColor={isDark ? Colors.primary : '#F3F4F6'}
              />
            }
          />
        </View>

        {/* Account */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Account</Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingRow icon="account-outline" label={user?.name || 'User'} />
          <SettingRow icon="email-outline" label={user?.email || 'Email not set'} />
          <SettingRow icon="shield-lock-outline" label="Change Password" onPress={() => {}} />
        </View>

        {/* About */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>About</Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingRow icon="information-outline" label="Version 1.0.0" />
          <SettingRow icon="file-document-outline" label="Terms of Service" onPress={() => {}} />
          <SettingRow icon="shield-check-outline" label="Privacy Policy" onPress={() => {}} />
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface, marginTop: 24 }]}>
          <SettingRow icon="logout" label="Sign Out" onPress={logout} danger />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 44, paddingBottom: 12, paddingHorizontal: 8, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginHorizontal: 16, marginTop: 24, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { borderRadius: 12, marginHorizontal: 16, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 15, fontWeight: '600' },
});

export default SettingsScreen;
