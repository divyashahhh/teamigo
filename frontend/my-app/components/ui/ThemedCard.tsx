import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, Radii, Shadow, Spacing } from '@/constants/theme';

export default function ThemedCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
    ...Shadow.light,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.subtitle,
    marginTop: Spacing.sm,
  },
});

