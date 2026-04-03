import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { Colors, getColors } from '../theme/colors';

const ThemeContext = createContext();

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeContextProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('dark'); // default dark like the web app

  // Load persisted theme
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('kyro_theme_mode');
        if (saved) setMode(saved);
      } catch {

      }
    };
    loadTheme();
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem('kyro_theme_mode', next).catch(() => {});
      return next;
    });
  }, []);

  const isDark = mode === 'dark';
  const colors = useMemo(() => getColors(isDark), [isDark]);

  const theme = useMemo(
    () => ({
      isDark,
      mode,
      colors: {
        ...colors,
        primary: Colors.primary,
        primaryLight: Colors.primaryLight,
        primaryDark: Colors.primaryDark,
        success: Colors.success,
        warning: Colors.warning,
        error: Colors.error,
        white: Colors.white,
        black: Colors.black,
      },
    }),
    [isDark, mode, colors],
  );

  return (
    <ThemeContext.Provider value={{ theme, mode, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
