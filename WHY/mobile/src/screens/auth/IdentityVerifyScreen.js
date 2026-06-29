import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image, Alert,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { verifyIdentity } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius } from '../../theme/colors';

export default function IdentityVerifyScreen({ navigation }) {
  const { refreshUser } = useAuth();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickPhoto = (source) => {
    const fn = source === 'camera' ? launchCamera : launchImageLibrary;
    fn({ mediaType: 'photo', quality: 0.8 }, (res) => {
      if (!res.didCancel && res.assets?.[0]) setPhoto(res.assets[0]);
    });
  };

  const handleSubmit = async () => {
    if (!photo) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: photo.uri,
        name: photo.fileName || 'selfie.jpg',
        type: photo.type || 'image/jpeg',
      });
      await verifyIdentity(formData);
      await refreshUser();
      navigation.replace('Main');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Verify your identity</Text>
        <Text style={styles.subtitle}>
          Take a selfie or upload a photo ID to get a verified badge on your profile.
          This helps keep WHY safe and authentic.
        </Text>

        <View style={styles.previewBox}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>📸</Text>
              <Text style={styles.placeholderText}>No photo selected</Text>
            </View>
          )}
        </View>

        <View style={styles.pickerRow}>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => pickPhoto('camera')}>
            <Text style={styles.pickerBtnText}>Take Selfie</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pickerBtn, styles.pickerBtnSecondary]} onPress={() => pickPhoto('library')}>
            <Text style={[styles.pickerBtnText, { color: colors.text }]}>Upload ID</Text>
          </TouchableOpacity>
        </View>

        {photo && (
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Submitting...' : 'Submit for Verification'}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.skip} onPress={() => navigation.replace('Main')}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.xl },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  subtitle: { color: colors.textSub, lineHeight: 22, marginBottom: spacing.xl },
  previewBox: {
    height: 260, borderRadius: radius.xl, overflow: 'hidden',
    backgroundColor: colors.bgCard, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  preview: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  placeholderIcon: { fontSize: 48 },
  placeholderText: { color: colors.textMuted, fontSize: 15 },
  pickerRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  pickerBtn: {
    flex: 1, backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 14, alignItems: 'center',
  },
  pickerBtnSecondary: { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border },
  pickerBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 16, alignItems: 'center', marginBottom: spacing.md,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  skip: { alignItems: 'center', paddingVertical: spacing.md },
  skipText: { color: colors.textMuted, fontSize: 15 },
});
