import { Pressable, Text, ActivityIndicator, StyleSheet, type PressableProps } from 'react-native';
import { colors } from '@/theme';

interface PrimaryButtonProps extends PressableProps {
  title: string;
  isLoading?: boolean;
  variant?: 'primary' | 'danger';
}

export function PrimaryButton({
  title,
  isLoading = false,
  variant = 'primary',
  disabled,
  ...pressableProps
}: PrimaryButtonProps) {
  const backgroundColor = variant === 'danger' ? colors.danger : colors.primary;
  const isDisabled = isLoading || disabled;

  return (
    <Pressable
      style={({ pressed }) => [styles.button, { backgroundColor }, pressed && !isDisabled ? styles.pressed : null]}
      disabled={isDisabled}
      {...pressableProps}
    >
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
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
