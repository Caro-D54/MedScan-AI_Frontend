import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/components/PrimaryButton';
import { MedicationReviewForm } from '@/components/MedicationReviewForm';
import { getMedication, updateMedication, deleteMedication } from '@/services/medicationService';
import { validateMedicationDraft } from '@/utils/medication';
import type { Medication } from '@/types';
import type { MedicationDraft, MedicationField } from '@/types/medication';
import { colors } from '@/theme';

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [medication, setMedication] = useState<Medication | null>(null);
  const [draft, setDraft] = useState<MedicationDraft | null>(null);
  const [errors, setErrors] = useState<Partial<Record<MedicationField, string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMedication = useCallback(async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await getMedication(id);
      setMedication(data);
      setDraft(toDraft(data));
    } catch {
      Alert.alert('Error', 'No se pudo cargar el medicamento.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadMedication();
  }, [loadMedication]);

  function startEditing(): void {
    setIsEditing(true);
  }

  function cancelEditing(): void {
    setDraft(medication ? toDraft(medication) : null);
    setErrors({});
    setIsEditing(false);
  }

  function updateDraft(field: MedicationField, value: string): void {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  function handleUpdate(): void {
    if (!draft) {
      return;
    }

    const nextErrors = validateMedicationDraft(draft);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    void submitUpdate();
  }

  async function submitUpdate(): Promise<void> {
    if (!id || !draft) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateMedication(id, draft);
      Alert.alert('Éxito', 'Medicamento actualizado.');
      await loadMedication();
      setIsEditing(false);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el medicamento.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmDelete(): void {
    Alert.alert('Eliminar medicamento', '¿Estás segura de que querés eliminarlo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void removeMedication() },
    ]);
  }

  async function removeMedication(): Promise<void> {
    if (!id) {
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteMedication(id);
      Alert.alert('Éxito', 'Medicamento eliminado.');
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo eliminar el medicamento.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || !medication) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isEditing) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {draft ? (
          <MedicationReviewForm
            draft={draft}
            errors={errors}
            isSubmitting={isSubmitting}
            onChange={updateDraft}
            onSubmit={handleUpdate}
            title="Editar Medicamento"
            subtitle="Actualizá los datos y guardá los cambios."
            submitLabel="Guardar Cambios"
          />
        ) : null}

        <View style={styles.cancelContainer}>
          <PrimaryButton title="Cancelar" variant="danger" onPress={cancelEditing} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="medical" size={48} color={colors.primary} />
        <Text style={styles.name}>{medication.name}</Text>
      </View>

      <View style={styles.detailCard}>
        <DetailRow label="Dosis" value={medication.dosage} />
        <DetailRow label="Frecuencia" value={medication.frequency} />
        <DetailRow label="Indicaciones" value={medication.instructions} />
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="Editar" onPress={startEditing} />
        <PrimaryButton title="Eliminar" variant="danger" onPress={confirmDelete} />
      </View>
    </ScrollView>
  );
}

function toDraft(medication: Medication): MedicationDraft {
  return {
    name: medication.name,
    dosage: medication.dosage,
    frequency: medication.frequency,
    instructions: medication.instructions,
  };
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    marginBottom: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  detailCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  cancelContainer: {
    marginTop: 16,
  },
});