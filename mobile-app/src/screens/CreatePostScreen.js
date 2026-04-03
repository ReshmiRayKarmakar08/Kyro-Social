import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { Colors } from '../theme/colors';

const CreatePostScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useThemeContext();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [isPromo, setIsPromo] = useState(false);

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        return;
      }
      const asset = response.assets?.[0];
      if (asset) setImage(asset);
    });
  };

  const handlePublish = async () => {
    if (!content.trim() && !image) {
      Alert.alert('Empty Post', 'Write something or add an image.');
      return;
    }

    setPublishing(true);
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      if (isPromo) formData.append('type', 'promo');
      if (image) {
        formData.append('image', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.fileName || 'post-image.jpg',
        });
      }

      await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Published!', 'Your post is now live.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to publish post.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Icon name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Create Post</Text>
        <TouchableOpacity
          style={[styles.publishBtn, { opacity: (content.trim() || image) ? 1 : 0.5 }]}
          onPress={handlePublish}
          disabled={publishing || (!content.trim() && !image)}>
          {publishing ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.publishBtnText}>Publish</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Author */}
          <View style={styles.authorRow}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.authorAvatar} />
            ) : (
              <View style={[styles.authorAvatarFallback, { backgroundColor: Colors.primary }]}>
                <Text style={styles.authorAvatarText}>{(user?.name || 'K')[0].toUpperCase()}</Text>
              </View>
            )}
            <View>
              <Text style={[styles.authorName, { color: theme.colors.text }]}>{user?.name}</Text>
              <Text style={[styles.authorHandle, { color: theme.colors.textSecondary }]}>@{user?.username}</Text>
            </View>
          </View>

          {/* Content */}
          <TextInput
            style={[styles.contentInput, { color: theme.colors.text }]}
            placeholder="What's on your mind?"
            placeholderTextColor={theme.colors.textCaption}
            multiline
            value={content}
            onChangeText={setContent}
            maxLength={2000}
            textAlignVertical="top"
          />

          {/* Image Preview */}
          {image && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: image.uri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeImage} onPress={() => setImage(null)}>
                <Icon name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Bottom Toolbar */}
        <View style={[styles.toolbar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.divider }]}>
          <TouchableOpacity style={styles.toolBtn} onPress={pickImage}>
            <Icon name="image-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.promoToggle, isPromo && { backgroundColor: 'rgba(255,97,84,0.15)' }]}
            onPress={() => setIsPromo(!isPromo)}>
            <Icon name="bullhorn-outline" size={18} color={Colors.primary} />
            <Text style={[styles.promoText, { color: Colors.primary }]}>Promote</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 44, paddingBottom: 12, paddingHorizontal: 12, borderBottomWidth: 0.5 },
  closeBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  publishBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 50, backgroundColor: Colors.primary },
  publishBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  scrollContent: { padding: 16 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  authorAvatar: { width: 44, height: 44, borderRadius: 22 },
  authorAvatarFallback: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  authorAvatarText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  authorName: { fontSize: 16, fontWeight: '700' },
  authorHandle: { fontSize: 13, fontWeight: '500' },
  contentInput: { fontSize: 16, lineHeight: 24, minHeight: 120 },
  imagePreview: { marginTop: 12, borderRadius: 12, overflow: 'hidden' },
  previewImage: { width: '100%', height: 240, borderRadius: 12 },
  removeImage: { position: 'absolute', top: 8, right: 8 },
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 0.5, gap: 12 },
  toolBtn: { padding: 6 },
  promoToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 50 },
  promoText: { fontSize: 13, fontWeight: '600' },
});

export default CreatePostScreen;
