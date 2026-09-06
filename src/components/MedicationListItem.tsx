import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Medication } from '@/types';
import { colors } from '@/theme';

interface MedicationListItemProps {
  medication: Medication;
  onPress: () => void;
}

export function MedicationListItem({ medication, onPress }: MedicationListItemProps) {
  return (
    <Pressable style={styles.item} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name="medical" size={24} color={colors.primary} />
      </View>

      <View style={styles.details}>
        <Text style={styles.name}>{medication.name}</Text>
        <Text style={styles.meta}>
          {medication.dosage}
          {medication.frequency ? ` · ${medication.frequency}` : ''}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: colors.background,
  },
  iconContainer: {
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
});