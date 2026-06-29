import React, { useRef, useState } from 'react';
import {
  View, Text, Image, StyleSheet, Dimensions, PanResponder, Animated,
} from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

const { width: W, height: H } = Dimensions.get('window');
const SWIPE_THRESHOLD = W * 0.35;
const ROTATION_ANGLE = 12;

export default function SwipeCard({ card, onSwipeLeft, onSwipeRight, isTop }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [photoIndex, setPhotoIndex] = useState(0);
  const age = card.age || Math.floor((Date.now() - new Date(card.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  const rotate = pan.x.interpolate({
    inputRange: [-W / 2, 0, W / 2],
    outputRange: [`-${ROTATION_ANGLE}deg`, '0deg', `${ROTATION_ANGLE}deg`],
    extrapolate: 'clamp',
  });

  const likeOpacity = pan.x.interpolate({
    inputRange: [20, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const passOpacity = pan.x.interpolate({
    inputRange: [-80, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTop,
      onMoveShouldSetPanResponder: () => isTop,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, { dx, vx }) => {
        if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(vx) > 0.8) {
          const dir = dx > 0 ? 1 : -1;
          Animated.timing(pan, {
            toValue: { x: dir * W * 1.5, y: 0 },
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            pan.setValue({ x: 0, y: 0 });
            if (dir > 0) onSwipeRight(card);
            else onSwipeLeft(card);
          });
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const cardStyle = isTop
    ? { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] }
    : { transform: [{ scale: 0.95 }], opacity: 0.8 };

  return (
    <Animated.View style={[styles.card, cardStyle]} {...(isTop ? panResponder.panHandlers : {})}>
      {/* Photo */}
      <View style={styles.photoContainer}>
        {card.photos && card.photos.length > 0 ? (
          <Image source={{ uri: card.photos[photoIndex] }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.photo, styles.noPhoto]}>
            <Text style={styles.noPhotoText}>{card.name?.[0]}</Text>
          </View>
        )}

        {/* Photo tap zones */}
        {card.photos?.length > 1 && (
          <View style={styles.photoTaps}>
            <View
              style={styles.tapLeft}
              onTouchEnd={() => setPhotoIndex(Math.max(0, photoIndex - 1))}
            />
            <View
              style={styles.tapRight}
              onTouchEnd={() => setPhotoIndex(Math.min(card.photos.length - 1, photoIndex + 1))}
            />
          </View>
        )}

        {/* Photo dots */}
        {card.photos?.length > 1 && (
          <View style={styles.dots}>
            {card.photos.map((_, i) => (
              <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
            ))}
          </View>
        )}

        {/* LIKE / PASS stamps */}
        {isTop && (
          <>
            <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
              <Text style={styles.stampText}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.passStamp, { opacity: passOpacity }]}>
              <Text style={styles.stampText}>PASS</Text>
            </Animated.View>
          </>
        )}

        {/* Gradient overlay */}
        <View style={styles.gradient} />

        {/* Info overlay */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{card.name}, {age}</Text>
            {card.identity_verified && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>✓</Text>
              </View>
            )}
            {card.recently_active && <View style={styles.activeDot} />}
          </View>
          {card.location_city && <Text style={styles.location}>{card.location_city}</Text>}
          {card.bio && <Text style={styles.bio} numberOfLines={2}>{card.bio}</Text>}
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Curiosity Score</Text>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreFill, { width: `${card.curiosity_score || 50}%` }]} />
            </View>
            <Text style={styles.scoreNum}>{card.curiosity_score || 50}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const CARD_H = H * 0.72;

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: W - spacing.lg * 2,
    height: CARD_H,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  photoContainer: { flex: 1 },
  photo: { width: '100%', height: '100%' },
  noPhoto: {
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotoText: { fontSize: 80, color: colors.textSub, fontWeight: '700' },
  photoTaps: { ...StyleSheet.absoluteFillObject, flexDirection: 'row' },
  tapLeft: { flex: 1 },
  tapRight: { flex: 1 },
  dots: {
    position: 'absolute',
    top: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: { backgroundColor: colors.white },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    background: 'transparent',
    // Simulate gradient with a dark overlay at bottom
    top: '40%',
    backgroundColor: 'transparent',
    // In RN we use a bottom-to-transparent overlay
  },
  // Actually using a simpler dark bottom layer
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  name: { fontSize: 24, fontWeight: '700', color: colors.white },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  location: { color: colors.textSub, fontSize: 14, marginBottom: 6 },
  bio: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 20, marginBottom: 10 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreLabel: { color: colors.textMuted, fontSize: 11 },
  scoreBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    backgroundColor: colors.primaryLight,
    borderRadius: 2,
  },
  scoreNum: { color: colors.textSub, fontSize: 11, width: 24, textAlign: 'right' },
  stamp: {
    position: 'absolute',
    top: 60,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 3,
  },
  likeStamp: {
    left: 20,
    borderColor: colors.like,
    transform: [{ rotate: '-15deg' }],
  },
  passStamp: {
    right: 20,
    borderColor: colors.pass,
    transform: [{ rotate: '15deg' }],
  },
  stampText: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 2,
  },
});
