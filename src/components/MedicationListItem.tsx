import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isMedicationMarkedTaken } from '@/services/medicationEvents';
import type { Medication } from '@/types';
import { colors } from '@/theme';

interface MedicationListItemProps {
  medication: Medication;
  onPress: () => void;
}

export const MedicationListItem = React.memo(function MedicationListItem({
  medication,
  onPress,
}: MedicationListItemProps) {
  const isTaken = Boolean(medication.doseTaken || isMedicationMarkedTaken(medication.id));

  return (
    <Pressable
      style={[styles.item, isTaken && styles.itemTaken]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalle de ${medication.name}`}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name="medical"
          size={24}
          color={isTaken ? colors.success : colors.primary}
        />
      </View>

      <View style={styles.details}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{medication.name}</Text>
          {isTaken ? (
            <View style={styles.takenBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.takenBadgeText}>Dosis tomada</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.meta}>
          {medication.dosage}
          {medication.frequency ? ` · ${medication.frequency}` : ''}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
});

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
  itemTaken: {
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  iconContainer: {
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  takenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  takenBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
});