import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3000';

let socket = null;

export async function connectSocket() {
  if (socket?.connected) return socket;
  const token = await AsyncStorage.getItem('token');
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
  });
  socket.on('connect', () => console.log('Socket connected'));
  socket.on('disconnect', () => console.log('Socket disconnected'));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));
  return socket;
}

export function getSocket() { return socket; }

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function joinMatch(matchId) { socket?.emit('join_match', { matchId }); }

export function sendSocketMessage(matchId, content) {
  socket?.emit('send_message', { matchId, content });
}

export function sendTyping(matchId, isTyping) {
  socket?.emit('typing', { matchId, isTyping });
}
