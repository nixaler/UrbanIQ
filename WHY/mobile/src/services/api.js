import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r.data,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const verifyPhone = (code) => api.post('/auth/verify-phone', { code });
export const resendCode = () => api.post('/auth/resend-code');
export const verifyIdentity = (formData) =>
  api.post('/auth/verify-identity', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const savePushToken = (token) => api.post('/auth/push-token', { token });

// Users
export const getMe = () => api.get('/users/me');
export const updateMe = (data) => api.patch('/users/me', data);
export const deleteMe = () => api.delete('/users/me');
export const getPresetPrompts = () => api.get('/users/presets');
export const uploadPhoto = (formData) =>
  api.post('/users/me/photos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deletePhoto = (id) => api.delete(`/users/me/photos/${id}`);
export const reorderPhotos = (order) => api.put('/users/me/photos/order', { order });
export const savePrompts = (prompts) => api.post('/users/me/prompts', { prompts });
export const getUserProfile = (id) => api.get(`/users/${id}`);
export const blockUser = (id) => api.post(`/users/${id}/block`);

// Swipes
export const getSwipeStack = (limit = 20) => api.get(`/swipes/stack?limit=${limit}`);
export const recordSwipe = (targetId, direction) => api.post('/swipes', { target_id: targetId, direction });
export const undoSwipe = () => api.post('/swipes/undo');
export const getSwipesRemaining = () => api.get('/swipes/remaining');

// Matches
export const getMatches = () => api.get('/matches');
export const getLikes = () => api.get('/matches/likes');
export const unmatch = (matchId) => api.delete(`/matches/${matchId}`);

// Messages
export const getMessages = (matchId) => api.get(`/messages/${matchId}`);
export const sendMessage = (matchId, content) => api.post(`/messages/${matchId}`, { content });
export const sendPhotoMessage = (matchId, formData) =>
  api.post(`/messages/${matchId}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Feedback
export const getPendingFeedback = () => api.get('/feedback/pending');
export const submitFeedback = (requestId, data) => api.post(`/feedback/${requestId}`, data);
export const getFeedbackInbox = () => api.get('/feedback/inbox');
export const replyToFeedback = (feedbackId, content) => api.post(`/feedback/${feedbackId}/reply`, { content });

// Insights
export const getInsights = () => api.get('/insights');

// Boosts
export const getBoostStatus = () => api.get('/boosts/status');
export const activateBoost = () => api.post('/boosts/activate');
export const purchaseBoosts = (quantity, receiptData) =>
  api.post('/boosts/purchase', { quantity, receipt_data: receiptData });
export const activatePremium = (receiptData) =>
  api.post('/boosts/premium', { receipt_data: receiptData });
