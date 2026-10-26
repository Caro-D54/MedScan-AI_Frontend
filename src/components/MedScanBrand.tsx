import { View, Text, StyleSheet } from 'react-native';
import { PharmacySymbolIcon } from '@/icons/icons';
import { colors, fonts, spacing } from '@/theme';

interface MedScanBrandProps {
  subtitle?: string;
  size?: 'normal' | 'compact';
}

export function MedScanBrand({ subtitle, size = 'normal' }: MedScanBrandProps) {
  const isCompact = size === 'compact';

  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      <View style={[styles.iconBadge, isCompact && styles.iconBadgeCompact]}>
        <PharmacySymbolIcon size={isCompact ? 30 : 42} color={colors.primary} />
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.brandTitle, isCompact && styles.brandTitleCompact]}>
          MedScan <Text style={styles.brandAi}>AI</Text>
        </Text>
        {subtitle ? <Text style={styles.brandSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  containerCompact: {
    marginBottom: spacing.md,
  },
  iconBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(34, 211, 238, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconBadgeCompact: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: spacing.xs,
  },
  textBlock: {
    alignItems: 'center',
  },
  brandTitle: {
    fontFamily: fonts.display,
    fontSize: 30,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  brandTitleCompact: {
    fontSize: 24,
  },
  brandAi: {
    color: colors.primary,
  },
  brandSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
