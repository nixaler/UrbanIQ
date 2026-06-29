import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, StyleSheet,
  SafeAreaView, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { getMe, updateMe, uploadPhoto, deletePhoto, getPresetPrompts, savePrompts } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius } from '../../theme/colors';
import { launchImageLibrary } from 'react-native-image-picker';

export default function ProfileScreen({ navigation }) {
  const { user, refreshUser, logout } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [presets, setPresets] = useState([]);
  const [bio, setBio] = useState(user?.bio || '');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [meData, presetsData] = await Promise.all([getMe(), getPresetPrompts()]);
      setPhotos(meData.photos || []);
      setPrompts(meData.prompts || []);
      setBio(meData.user.bio || '');
      setPresets(presetsData.prompts || []);
    } catch {}
    setLoading(false);
  };

  const handleAddPhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async (res) => {
      if (res.didCancel || !res.assets?.[0]) return;
      const asset = res.assets[0];
      const formData = new FormData();
      formData.append('photo', { uri: asset.uri, name: asset.fileName || 'photo.jpg', type: asset.type || 'image/jpeg' });
      try {
        const { photo } = await uploadPhoto(formData);
        setPhotos((prev) => [...prev, photo]);
      } catch (err) {
        Alert.alert('Error', err.message);
      }
    });
  };

  const handleDeletePhoto = async (id) => {
    Alert.alert('Delete Photo', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deletePhoto(id);
            setPhotos((prev) => prev.filter((p) => p.id !== id));
          } catch (err) { Alert.alert('Error', err.message); }
        },
      },
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMe({ bio: bio.trim() });
      await savePrompts(prompts.map((p, i) => ({ ...p, sort_order: i })));
      await refreshUser();
      setEditing(false);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const age = user?.date_of_birth
    ? Math.floor((Date.now() - new Date(user.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : '';

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Name + Age */}
        <View style={styles.nameRow}>
          <Text style={styles.name}>{user?.name}, {age}</Text>
          {user?.identity_verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified</Text>
            </View>
          )}
        </View>

        {/* Curiosity Score */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Curiosity Score</Text>
          <View style={styles.scoreBarWrap}>
            <View style={[styles.scoreBarFill, { width: `${user?.curiosity_score || 50}%` }]} />
          </View>
          <Text style={styles.scoreValue}>{user?.curiosity_score || 50} / 100</Text>
          <Text style={styles.scoreHint}>Based on anonymous feedback you've received</Text>
        </View>

        {/* Photos */}
        <Text style={styles.sectionTitle}>Photos</Text>
        <View style={styles.photoGrid}>
          {photos.map((p) => (
            <TouchableOpacity key={p.id} style={styles.photoCell} onLongPress={() => handleDeletePhoto(p.id)}>
              <Image source={{ uri: p.url }} style={styles.gridPhoto} />
            </TouchableOpacity>
          ))}
          {photos.length < 9 && (
            <TouchableOpacity style={[styles.photoCell, styles.addPhoto]} onPress={handleAddPhoto}>
              <Text style={styles.addPhotoText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.photoHint}>Hold to delete. First photo is your profile photo.</Text>

        {/* Bio */}
        <Text style={styles.sectionTitle}>About me</Text>
        {editing ? (
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="Write something about yourself..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={300}
          />
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)} style={styles.bioDisplay}>
            <Text style={bio ? styles.bioText : styles.bioPlaceholder}>
              {bio || 'Tap to add a bio...'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Prompts */}
        <Text style={styles.sectionTitle}>Prompts</Text>
        {prompts.map((p, i) => (
          <View key={i} style={styles.promptCard}>
            <Text style={styles.promptQuestion}>{p.prompt_text}</Text>
            {editing ? (
              <TextInput
                style={styles.promptInput}
                value={p.answer}
                onChangeText={(v) => {
                  const updated = [...prompts];
                  updated[i] = { ...updated[i], answer: v };
                  setPrompts(updated);
                }}
                multiline
                placeholder="Your answer..."
                placeholderTextColor={colors.textMuted}
              />
            ) : (
              <Text style={styles.promptAnswer}>{p.answer}</Text>
            )}
          </View>
        ))}

        {editing && prompts.length < 3 && (
          <TouchableOpacity
            style={styles.addPromptBtn}
            onPress={() => setPrompts((prev) => [...prev, {
              prompt_text: presets[Math.floor(Math.random() * presets.length)]?.text || 'My best quality is...',
              answer: '',
            }])}
          >
            <Text style={styles.addPromptText}>+ Add Prompt</Text>
          </TouchableOpacity>
        )}

        {/* Save / Edit toggle */}
        {editing ? (
          <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  settingsIcon: { fontSize: 24 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  verifiedBadge: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  verifiedText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  scoreCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border,
  },
  scoreLabel: { color: colors.textSub, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  scoreBarWrap: { height: 6, backgroundColor: colors.bgSurface, borderRadius: 3, overflow: 'hidden', marginBottom: spacing.sm },
  scoreBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  scoreValue: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  scoreHint: { color: colors.textMuted, fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textSub, marginBottom: spacing.md, marginTop: spacing.md },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  photoCell: { width: '31%', aspectRatio: 0.75, borderRadius: radius.md, overflow: 'hidden' },
  gridPhoto: { width: '100%', height: '100%' },
  addPhoto: { backgroundColor: colors.bgCard, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addPhotoText: { color: colors.primary, fontWeight: '700' },
  photoHint: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.lg },
  bioDisplay: {
    backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md,
    minHeight: 80, borderWidth: 1, borderColor: colors.border,
  },
  bioText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  bioPlaceholder: { color: colors.textMuted, fontSize: 15 },
  bioInput: {
    backgroundColor: colors.bgInput, borderRadius: radius.md, padding: spacing.md,
    color: colors.text, fontSize: 15, lineHeight: 22, minHeight: 80,
    borderWidth: 1, borderColor: colors.primary,
  },
  promptCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  promptQuestion: { color: colors.primary, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  promptAnswer: { color: colors.text, fontSize: 15, lineHeight: 22 },
  promptInput: {
    color: colors.text, fontSize: 15, marginTop: 4,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 8,
  },
  addPromptBtn: { alignItems: 'center', paddingVertical: spacing.md, marginBottom: spacing.md },
  addPromptText: { color: colors.primary, fontWeight: '600' },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 16, alignItems: 'center', marginTop: spacing.lg,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  editBtn: {
    backgroundColor: colors.bgSurface, borderRadius: radius.full,
    paddingVertical: 16, alignItems: 'center', marginTop: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  editBtnText: { color: colors.text, fontSize: 17, fontWeight: '600' },
  logoutBtn: { alignItems: 'center', paddingVertical: spacing.xl, marginTop: spacing.sm },
  logoutText: { color: colors.error, fontSize: 16 },
});
