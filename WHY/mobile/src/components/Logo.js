import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

// Two question marks forming a heart silhouette
export default function Logo({ size = 80 }) {
  const fontSize = size * 0.55;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.marks}>
        <Text style={[styles.q, styles.left, { fontSize }]}>?</Text>
        <Text style={[styles.q, styles.right, { fontSize }]}>?</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marks: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  q: {
    fontWeight: '900',
    color: colors.primary,
    lineHeight: undefined,
  },
  left: {
    transform: [{ scaleX: -1 }, { rotate: '-15deg' }],
    marginRight: -4,
    color: colors.primaryLight,
  },
  right: {
    transform: [{ rotate: '15deg' }],
    color: colors.primary,
  },
});
