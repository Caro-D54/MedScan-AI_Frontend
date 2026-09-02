import { Pressable, Text, ActivityIndicator, StyleSheet, type PressableProps } from 'react-native';
import { colors } from '@/theme';

interface PrimaryButtonProps extends PressableProps {
  title: string;
  isLoading?: boolean;
}

export function PrimaryButton({ title, isLoading = false, ...pressableProps }: PrimaryButtonProps) {
  return (
    <Pressable style={styles.button} disabled={isLoading} {...pressableProps}>
      {isLoading ? (
        <ActivityIndicator color={colors.background} />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
