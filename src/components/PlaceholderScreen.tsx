import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme';

interface PlaceholderScreenProps {
  title: string;
  subtitle: string;
  titleSize?: number;
}

export function PlaceholderScreen({ title, subtitle, titleSize = 24 }: PlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontSize: titleSize }]}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
