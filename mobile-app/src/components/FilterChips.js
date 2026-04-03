import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { useThemeContext } from '../context/ThemeContext';

const FILTERS = [
  { label: '#All Post', filter: 'all', type: 'all' },
  { label: '#For You', filter: 'foryou', type: 'all' },
  { label: '#Most Liked', filter: 'mostliked', type: 'all' },
  { label: '#Most Commented', filter: 'mostcommented', type: 'all' },
  { label: '#Most Shared', filter: 'mostshared', type: 'all' },
  { label: '#Promotions', filter: 'all', type: 'promo' },
];

const FilterChips = ({ activeFilter, activeType, onSelect }) => {
  const { theme } = useThemeContext();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {FILTERS.map((item) => {
          const isActive = activeFilter === item.filter && activeType === item.type;
          return (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.chip,
                isActive
                  ? styles.chipActive
                  : { backgroundColor: 'rgba(255,97,84,0.08)' },
              ]}
              onPress={() => onSelect(item.filter, item.type)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.chipText,
                  { color: isActive ? '#FFFFFF' : Colors.primary },
                ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 10,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default FilterChips;
