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
      style={[styles.item, isTaken ? styles.itemTaken : styles.itemPending]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalle de ${medication.name}`}
    >
      <View
        style={[
          styles.iconContainer,
          isTaken ? styles.iconContainerTaken : styles.iconContainerPending,
        ]}
      >
        <Ionicons
          name="medical"
          size={22}
          color={isTaken ? colors.success : colors.danger}
        />
      </View>

      <View style={styles.details}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{medication.name}</Text>
          {isTaken ? (
            <View style={styles.takenBadge}>
              <Ionicons name="checkmark-circle" size={13} color={colors.success} />
              <Text style={styles.takenBadgeText}>Dosis tomada</Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Ionicons name="time" size={12} color={colors.danger} />
              <Text style={styles.pendingBadgeText}>
                {medication.nextDose ? `Pendiente · ${medication.nextDose}` : 'Pendiente'}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.meta}>
          {medication.dosage}
          {medication.frequency ? ` · ${medication.frequency}` : ''}
        </Text>

        {!isTaken && medication.nextDose ? (
          <View style={styles.scheduleRow}>
            <Ionicons name="alarm-outline" size={13} color={colors.danger} />
            <Text style={styles.scheduleText}>
              Horario de toma: {medication.nextDose}
            </Text>
          </View>
        ) : null}
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
    borderWidth: 1.5,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: colors.background,
  },
  // ROJO cuando la dosis aún no se toma
  itemPending: {
    borderColor: colors.dangerBorder,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  // VERDE cuando la dosis ya fue tomada
  itemTaken: {
    borderColor: colors.successBorder,
    backgroundColor: 'rgba(52, 211, 153, 0.06)',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconContainerPending: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
  },
  iconContainerTaken: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  details: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginRight: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.danger,
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
    borderColor: colors.successBorder,
  },
  takenBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  scheduleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
});
