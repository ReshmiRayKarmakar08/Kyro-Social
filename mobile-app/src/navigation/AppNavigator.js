import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { Colors, Fonts } from '../theme/colors';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// Main Screens
import FeedScreen from '../screens/FeedScreen';
import SearchScreen from '../screens/SearchScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SavedScreen from '../screens/SavedScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import ChatScreen from '../screens/ChatScreen';

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

/* ------------------------------------------------------------------ */
/* Custom Drawer Content                                               */
/* ------------------------------------------------------------------ */
const CustomDrawerContent = (props) => {
  const { user, logout, unreadNotifications } = useAuth();
  const { theme, toggleTheme, isDark } = useThemeContext();

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: theme.colors.surface }}
      contentContainerStyle={{ flex: 1 }}>
      {/* User Info Header */}
      <View style={[styles.drawerHeader, { borderBottomColor: theme.colors.divider }]}>
        <View style={styles.drawerAvatar}>
          {user?.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.drawerAvatarImage} />
          ) : (
            <View style={[styles.drawerAvatarFallback, { backgroundColor: Colors.primary }]}>
              <Text style={styles.drawerAvatarText}>
                {(user?.name || 'K')[0].toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.drawerName, { color: theme.colors.text }]}>
          {user?.name || 'Kyro User'}
        </Text>
        <Text style={[styles.drawerUsername, { color: theme.colors.textSecondary }]}>
          @{user?.username || 'user'}
        </Text>
      </View>

      {/* Menu Items */}
      <View style={{ flex: 1, paddingTop: 8 }}>
        <DrawerItem
          label="Profile"
          labelStyle={[styles.drawerLabel, { color: theme.colors.text }]}
          icon={({ size }) => <Icon name="account-outline" size={size} color={theme.colors.textSecondary} />}
          onPress={() => props.navigation.navigate('MainTabs', {
            screen: 'ProfileTab',
            params: { screen: 'Profile', params: { username: user?.username } },
          })}
        />
        <DrawerItem
          label="Notifications"
          labelStyle={[styles.drawerLabel, { color: theme.colors.text }]}
          icon={({ size }) => (
            <View>
              <Icon name="bell-outline" size={size} color={theme.colors.textSecondary} />
              {unreadNotifications > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </View>
          )}
          onPress={() => props.navigation.navigate('Notifications')}
        />
        <DrawerItem
          label="Saved Posts"
          labelStyle={[styles.drawerLabel, { color: theme.colors.text }]}
          icon={({ size }) => <Icon name="bookmark-outline" size={size} color={theme.colors.textSecondary} />}
          onPress={() => props.navigation.navigate('Saved')}
        />
        <DrawerItem
          label="Settings"
          labelStyle={[styles.drawerLabel, { color: theme.colors.text }]}
          icon={({ size }) => <Icon name="cog-outline" size={size} color={theme.colors.textSecondary} />}
          onPress={() => props.navigation.navigate('Settings')}
        />

        {/* Theme Toggle */}
        <DrawerItem
          label={isDark ? 'Light Mode' : 'Dark Mode'}
          labelStyle={[styles.drawerLabel, { color: theme.colors.text }]}
          icon={({ size }) => (
            <Icon
              name={isDark ? 'weather-sunny' : 'moon-waning-crescent'}
              size={size}
              color={Colors.primary}
            />
          )}
          onPress={toggleTheme}
        />
      </View>

      {/* Sign Out */}
      <View style={[styles.drawerFooter, { borderTopColor: theme.colors.divider }]}>
        <DrawerItem
          label="Sign Out"
          labelStyle={[styles.drawerLabel, { color: Colors.error }]}
          icon={({ size }) => <Icon name="logout" size={size} color={Colors.error} />}
          onPress={() => {
            logout();
          }}
        />
      </View>
    </DrawerContentScrollView>
  );
};

/* ------------------------------------------------------------------ */
/* Bottom Tabs                                                         */
/* ------------------------------------------------------------------ */
const BottomTabs = () => {
  const { theme } = useThemeContext();
  const { unreadNotifications } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.divider,
          borderTopWidth: 0.5,
          height: 60,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case 'HomeTab':
              iconName = 'home-outline';
              break;
            case 'ExploreTab':
              iconName = 'magnify';
              break;
            case 'MessagesTab':
              iconName = 'message-outline';
              break;
            case 'ProfileTab':
              iconName = 'account-outline';
              break;
            default:
              iconName = 'circle';
          }
          return <Icon name={iconName} size={24} color={color} />;
        },
      })}>
      <Tab.Screen
        name="HomeTab"
        component={FeedScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={SearchScreen}
        options={{ tabBarLabel: 'Explore' }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesScreen}
        options={{ tabBarLabel: 'Messages' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

/* ------------------------------------------------------------------ */
/* Main Drawer (wraps tabs + standalone screens)                       */
/* ------------------------------------------------------------------ */
const MainDrawer = () => {
  const { theme } = useThemeContext();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: 280,
        },
      }}>
      <Drawer.Screen name="MainTabs" component={BottomTabs} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} />
      <Drawer.Screen name="Saved" component={SavedScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
};

/* ------------------------------------------------------------------ */
/* Auth Navigator                                                      */
/* ------------------------------------------------------------------ */
const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
    <AuthStack.Screen name="OTP" component={OTPScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </AuthStack.Navigator>
);

/* ------------------------------------------------------------------ */
/* Root Navigator                                                      */
/* ------------------------------------------------------------------ */
const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();
  const { theme } = useThemeContext();

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loaderLogo}>
          <Text style={styles.loaderText}>K</Text>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: theme.isDark,
        colors: {
          primary: Colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.divider,
          notification: Colors.primary,
        },
      }}>
      <MainStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <MainStack.Screen name="Main" component={MainDrawer} />
            <MainStack.Screen
              name="OtherProfile"
              component={ProfileScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <MainStack.Screen
              name="CreatePost"
              component={CreatePostScreen}
              options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
            />
            <MainStack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        ) : (
          <MainStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </MainStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderLogo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  drawerHeader: {
    padding: 20,
    paddingTop: 12,
    borderBottomWidth: 1,
  },
  drawerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 12,
    overflow: 'hidden',
  },
  drawerAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  drawerAvatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerAvatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  drawerName: {
    fontSize: 18,
    fontWeight: '800',
  },
  drawerUsername: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  drawerLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: -16,
  },
  drawerFooter: {
    borderTopWidth: 1,
    paddingTop: 4,
    paddingBottom: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});

export default AppNavigator;
