import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/components/PrimaryButton';
import { MedicationReviewForm } from '@/components/MedicationReviewForm';
import { ReminderControls } from '@/components/ReminderControls';
import { getMedication, updateMedication, deleteMedication } from '@/services/medicationService';
import { cancelMedicationReminders } from '@/services/notificationService';
import { useAuth } from '@/hooks/useAuth';
import { useMedicationReminder } from '@/hooks/useMedicationReminder';
import { validateMedicationDraft } from '@/utils/medication';
import type { Medication } from '@/types';
import type { MedicationDraft, MedicationField } from '@/types/medication';
import { colors } from '@/theme';

export default function MedicationDetailScreen() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'SYSTEM') {
      router.replace('/');
    }
  }, [user]);

  const { id } = useLocalSearchParams<{ id: string }>();
  const [medication, setMedication] = useState<Medication | null>(null);
  const [draft, setDraft] = useState<MedicationDraft | null>(null);
  const [errors, setErrors] = useState<Partial<Record<MedicationField, string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const reminder = useMedicationReminder(medication);

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
      router.replace('/');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadMedication();
  }, [loadMedication]);

  function startEditing(): void {
    setFeedback(null);
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
      setFeedback({ type: 'success', text: 'Medicamento actualizado correctamente.' });
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el medicamento.');
      setFeedback({ type: 'error', text: 'No se pudo actualizar el medicamento.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmDelete(): void {
    setFeedback(null);
    setShowDeleteConfirm(true);
  }

  async function handleToggleReminders(enabled: boolean): Promise<void> {
    setFeedback(null);
    const result = await reminder.toggle(enabled);
    if (result.ok) {
      setFeedback({
        type: 'success',
        text: enabled
          ? 'Recordatorios activados correctamente.'
          : 'Recordatorios desactivados.',
      });
      return;
    }

    if (result.reason === 'permission') {
      const msg = 'Necesitás habilitar las notificaciones para recibir recordatorios de toma.';
      Alert.alert('Permiso requerido', msg);
      setFeedback({ type: 'error', text: msg });
    } else {
      const msg = 'No pudimos interpretar la frecuencia para programar los recordatorios (ej. "cada 8 horas" o "cada 24hs").';
      Alert.alert('Frecuencia no reconocida', msg);
      setFeedback({ type: 'error', text: msg });
    }
  }

  async function handleMarkTaken(): Promise<void> {
    setFeedback(null);
    const succeeded = await reminder.markTaken();
    if (succeeded) {
      setMedication((prev) => (prev ? { ...prev, doseTaken: true } : prev));
      setFeedback({
        type: 'success',
        text: '¡Dosis tomada con éxito! Registrada en tu historial.',
      });
      setTimeout(() => {
        router.replace('/');
      }, 1200);
      return;
    }

    Alert.alert('Error', 'No se pudo registrar la toma.');
    setFeedback({
      type: 'error',
      text: 'No se pudo registrar la toma. Intentá nuevamente.',
    });
  }

  async function handleUndoTaken(): Promise<void> {
    setFeedback(null);
    const succeeded = await reminder.undoTaken();
    if (succeeded) {
      setMedication((prev) => (prev ? { ...prev, doseTaken: false } : prev));
      setFeedback({
        type: 'success',
        text: 'Toma anulada correctamente. La dosis vuelve a estar pendiente.',
      });
      void loadMedication();
      return;
    }

    Alert.alert('Error', 'No se pudo anular la toma.');
    setFeedback({
      type: 'error',
      text: 'No se pudo anular la toma. Intentá nuevamente.',
    });
  }

  async function removeMedication(): Promise<void> {
    if (!id) {
      return;
    }

    setIsSubmitting(true);
    try {
      await cancelMedicationReminders(id).catch(() => undefined);
      await deleteMedication(id);
      setShowDeleteConfirm(false);
      Alert.alert('Éxito', 'Medicamento eliminado.');
      router.replace('/');
    } catch {
      setShowDeleteConfirm(false);
      Alert.alert('Error', 'No se pudo eliminar el medicamento.');
      setFeedback({ type: 'error', text: 'No se pudo eliminar el medicamento.' });
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

      {feedback ? (
        <View
          style={[
            styles.feedbackBanner,
            feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess,
          ]}
        >
          <Ionicons
            name={feedback.type === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline'}
            size={20}
            color={feedback.type === 'error' ? colors.danger : colors.primary}
          />
          <Text style={styles.feedbackText}>{feedback.text}</Text>
        </View>
      ) : null}

      {/* Tarjeta de estado de dosis: ROJO si está pendiente, VERDE si ya fue tomada */}
      <View
        style={[
          styles.doseStatusCard,
          medication.doseTaken ? styles.doseStatusCardTaken : styles.doseStatusCardPending,
        ]}
      >
        <Ionicons
          name={medication.doseTaken ? 'checkmark-circle' : 'time'}
          size={24}
          color={medication.doseTaken ? colors.success : colors.danger}
        />
        <View style={styles.doseStatusInfo}>
          <Text
            style={[
              styles.doseStatusTitle,
              medication.doseTaken ? styles.doseStatusTitleTaken : styles.doseStatusTitlePending,
            ]}
          >
            {medication.doseTaken ? 'Dosis tomada' : 'Dosis pendiente'}
          </Text>
          <Text style={styles.doseStatusSubtitle}>
            {medication.doseTaken
              ? 'Este medicamento se encuentra al día.'
              : `Horario programado: ${medication.nextDose ?? 'Pendiente de toma'}`}
          </Text>
        </View>

        {medication.doseTaken ? (
          <Pressable
            style={styles.undoStatusButton}
            onPress={() => void handleUndoTaken()}
            disabled={reminder.isUndoing}
            accessibilityRole="button"
            accessibilityLabel="Anular toma de este medicamento"
          >
            {reminder.isUndoing ? (
              <ActivityIndicator size="small" color={colors.amber} />
            ) : (
              <>
                <Ionicons name="arrow-undo" size={14} color={colors.amber} />
                <Text style={styles.undoStatusButtonText}>Anular toma</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>

      <View style={styles.detailCard}>
        <DetailRow label="Principio activo" value={medication.activeIngredient ?? ''} />
        <DetailRow label="Dosis indicada" value={medication.dosage} />
        <DetailRow label="Frecuencia de tomas" value={medication.frequency} />
        <DetailRow label="Indicaciones" value={medication.instructions} />
      </View>

      <View style={styles.remindersCard}>
        <ReminderControls
          isEnabled={reminder.isEnabled}
          scheduledHours={reminder.scheduledHours ?? []}
          canSchedule={reminder.canSchedule}
          isToggling={reminder.isToggling}
          onToggle={(enabled) => void handleToggleReminders(enabled)}
        />
      </View>

      <View style={styles.actions}>
        {medication.doseTaken ? (
          <PrimaryButton
            title="Anular toma"
            variant="secondary"
            onPress={() => void handleUndoTaken()}
            isLoading={reminder.isUndoing}
          />
        ) : (
          <PrimaryButton
            title="Marcar como tomada"
            onPress={() => void handleMarkTaken()}
            isLoading={reminder.isMarkingTaken}
          />
        )}
        <PrimaryButton title="Editar" onPress={startEditing} />
        <PrimaryButton
          title="Eliminar"
          variant="danger"
          onPress={confirmDelete}
          isLoading={isSubmitting}
        />
      </View>

      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="trash-outline" size={28} color={colors.danger} />
            </View>
            <Text style={styles.modalTitle}>Eliminar medicamento</Text>
            <Text style={styles.modalMessage}>
              {`¿Estás segura de que querés eliminar "${medication.name}"? Esta acción no se puede deshacer.`}
            </Text>
            <View style={styles.modalButtons}>
              <View style={styles.modalButtonItem}>
                <PrimaryButton
                  title="Cancelar"
                  onPress={() => setShowDeleteConfirm(false)}
                  disabled={isSubmitting}
                />
              </View>
              <View style={styles.modalButtonItem}>
                <PrimaryButton
                  title="Sí, eliminar"
                  variant="danger"
                  onPress={() => void removeMedication()}
                  isLoading={isSubmitting}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function toDraft(medication: Medication): MedicationDraft {
  return {
    name: medication.name,
    activeIngredient: medication.activeIngredient ?? '',
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
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(13, 148, 136, 0.12)',
    borderColor: colors.primary,
  },
  feedbackError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: colors.danger,
  },
  feedbackText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  doseStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  doseStatusCardPending: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: colors.dangerBorder,
  },
  doseStatusCardTaken: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: colors.successBorder,
  },
  doseStatusInfo: {
    flex: 1,
    gap: 2,
  },
  doseStatusTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  doseStatusTitlePending: {
    color: colors.danger,
  },
  doseStatusTitleTaken: {
    color: colors.success,
  },
  doseStatusSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  undoStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  undoStatusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.amber,
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
  remindersCard: {
    marginTop: 24,
  },
  cancelContainer: {
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 13, 23, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButtonItem: {
    flex: 1,
  },
});