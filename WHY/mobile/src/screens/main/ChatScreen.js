import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Image, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { getMessages } from '../../services/api';
import { getSocket, joinMatch, sendSocketMessage, sendTyping } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius } from '../../theme/colors';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatScreen({ route, navigation }) {
  const { matchId, name } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    navigation.setOptions({ title: name || 'Chat' });
    loadMessages();
    setupSocket();
    return () => cleanup();
  }, []);

  const loadMessages = async () => {
    try {
      const { messages: msgs } = await getMessages(matchId);
      setMessages(msgs);
    } catch {}
    setLoading(false);
  };

  const setupSocket = () => {
    const socket = getSocket();
    if (!socket) return;
    joinMatch(matchId);
    socket.on('new_message', ({ message }) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      flatListRef.current?.scrollToEnd();
    });
    socket.on('user_typing', ({ isTyping: t }) => setIsTyping(t));
  };

  const cleanup = () => {
    const socket = getSocket();
    socket?.off('new_message');
    socket?.off('user_typing');
  };

  const handleSend = () => {
    if (!text.trim()) return;
    sendSocketMessage(matchId, text.trim());
    setText('');
    sendTyping(matchId, false);
  };

  const handleTextChange = (val) => {
    setText(val);
    sendTyping(matchId, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping(matchId, false), 2000);
  };

  const handlePhotoSend = async () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, async (res) => {
      if (res.didCancel || !res.assets?.[0]) return;
      const asset = res.assets[0];
      const formData = new FormData();
      formData.append('photo', { uri: asset.uri, name: asset.fileName || 'photo.jpg', type: asset.type || 'image/jpeg' });
      try {
        const token = await AsyncStorage.getItem('token');
        await axios.post(
          `${process.env.API_URL || 'http://localhost:3000/api'}/messages/${matchId}/photo`,
          formData,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );
        loadMessages();
      } catch {}
    });
  };

  const renderMessage = ({ item }) => {
    const mine = item.sender_id === user?.id;
    return (
      <View style={[styles.msgRow, mine && styles.msgRowMine]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          {item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={styles.msgPhoto} resizeMode="cover" />
          ) : (
            <Text style={[styles.msgText, mine && styles.msgTextMine]}>{item.content}</Text>
          )}
          <Text style={[styles.msgTime, mine && styles.msgTimeMine]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={88}
      >
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            ListFooterComponent={
              isTyping ? (
                <View style={styles.typingRow}>
                  <View style={styles.typingBubble}>
                    <Text style={styles.typingDots}>•••</Text>
                  </View>
                </View>
              ) : null
            }
          />
        )}

        <View style={styles.inputBar}>
          <TouchableOpacity onPress={handlePhotoSend} style={styles.photoBtn}>
            <Text style={styles.photoBtnText}>📷</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={handleTextChange}
            placeholder="Message..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md, paddingBottom: spacing.sm },
  msgRow: { marginBottom: spacing.sm, alignItems: 'flex-start' },
  msgRowMine: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '78%', borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  bubbleTheirs: { backgroundColor: colors.bgCard },
  bubbleMine: { backgroundColor: colors.primary },
  msgText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  msgTextMine: { color: colors.white },
  msgPhoto: { width: 200, height: 200, borderRadius: radius.md, marginBottom: 4 },
  msgTime: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  msgTimeMine: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  typingRow: { alignItems: 'flex-start', marginBottom: spacing.sm },
  typingBubble: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  typingDots: { color: colors.textMuted, fontSize: 18, letterSpacing: 4 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.bg, gap: spacing.sm,
  },
  photoBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  photoBtnText: { fontSize: 22 },
  input: {
    flex: 1, backgroundColor: colors.bgInput, borderRadius: radius.xl,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    color: colors.text, fontSize: 15, maxHeight: 120,
    borderWidth: 1, borderColor: colors.border,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.bgSurface },
  sendIcon: { color: colors.white, fontSize: 20, fontWeight: '700' },
});
