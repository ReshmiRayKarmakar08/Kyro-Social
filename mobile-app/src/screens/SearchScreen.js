import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import EmptyState from '../components/EmptyState';

const SearchScreen = () => {
  const { theme } = useThemeContext();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    setSuggestionsLoading(true);
    try {
      const res = await api.get('/users/suggestions/follow');
      setSuggestions(res.data.suggestions || res.data || []);
    } catch { /* ignore */ } finally { setSuggestionsLoading(false); }
  }, []);

  React.useEffect(() => { fetchSuggestions(); }, []);

  const handleSearch = async (text) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(text.trim())}`);
      setResults(res.data.users || res.data || []);
    } catch {
      setResults([]);
    } finally { setLoading(false); }
  };

  const handleFollow = async (username) => {
    try {
      await api.put(`/users/follow/${username}`);
      setSuggestions((prev) => prev.filter((u) => u.username !== username));
    } catch { /* ignore */ }
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity style={[styles.userRow, { borderBottomColor: theme.colors.divider }]}>
      <View style={styles.userAvatar}>
        {item.profilePicture ? (
          <Image source={{ uri: item.profilePicture }} style={styles.avatarImg} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: Colors.primary }]}>
            <Text style={styles.avatarText}>{(item.name || 'K')[0].toUpperCase()}</Text>
          </View>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: theme.colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.userHandle, { color: theme.colors.textSecondary }]}>@{item.username}</Text>
      </View>
      {item.username !== user?.username && (
        <TouchableOpacity style={styles.followBtn} onPress={() => handleFollow(item.username)}>
          <Text style={styles.followBtnText}>Follow</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.divider }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Explore</Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.colors.inputBg }]}>
        <Icon name="magnify" size={20} color={theme.colors.textCaption} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search users..."
          placeholderTextColor={theme.colors.textCaption}
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
            <Icon name="close-circle" size={18} color={theme.colors.textCaption} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 30 }} />
      ) : searched && results.length === 0 ? (
        <EmptyState icon="account-search-outline" title="No users found" message="Try a different search term" />
      ) : searched ? (
        <FlatList data={results} keyExtractor={(item) => item._id || item.username} renderItem={renderUser} contentContainerStyle={{ paddingBottom: 40 }} />
      ) : (
        <>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Suggested for you</Text>
          {suggestionsLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList data={suggestions} keyExtractor={(item) => item._id || item.username} renderItem={renderUser} contentContainerStyle={{ paddingBottom: 40 }} ListEmptyComponent={<EmptyState icon="account-group-outline" title="No suggestions" message="Check back later for new people to follow" />} />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, borderRadius: 12, paddingHorizontal: 14, height: 44, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginHorizontal: 16, marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', marginRight: 12 },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700' },
  userHandle: { fontSize: 13, fontWeight: '500', marginTop: 1 },
  followBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 50, backgroundColor: Colors.primary },
  followBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});

export default SearchScreen;
