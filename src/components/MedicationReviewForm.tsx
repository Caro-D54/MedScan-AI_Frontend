import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormTextInput } from '@/components/FormTextInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/theme';
import type { MedicationDraft, MedicationField } from '@/types/medication';

interface MedicationReviewFormProps {
  draft: MedicationDraft;
  errors: Partial<Record<MedicationField, string>>;
  isSubmitting: boolean;
  onChange: (field: MedicationField, value: string) => void;
  onSubmit: () => void;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  isAiAssisted?: boolean;
}

export function MedicationReviewForm({
  draft,
  errors,
  isSubmitting,
  onChange,
  onSubmit,
  title = 'Revisar Medicamento',
  subtitle = 'Corregí los datos detectados por la IA antes de guardar.',
  submitLabel = 'Guardar Medicamento',
  isAiAssisted = false,
}: MedicationReviewFormProps) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {isAiAssisted ? (
        <View style={styles.sectionBadgeAi}>
          <Ionicons name="sparkles" size={16} color={colors.primary} />
          <Text style={styles.sectionBadgeAiText}>Datos leídos por IA de la imagen</Text>
        </View>
      ) : null}

      <FormTextInput
        label="Nombre comercial"
        placeholder="Ej. Ibupirac / Tafirol"
        value={draft.name}
        onChangeText={(value) => onChange('name', value)}
        error={errors.name}
      />

      <FormTextInput
        label="Nombre del principio activo"
        placeholder="Ej. Ibuprofeno / Paracetamol"
        value={draft.activeIngredient ?? ''}
        onChangeText={(value) => onChange('activeIngredient', value)}
        error={errors.activeIngredient}
      />

      {isAiAssisted ? (
        <View style={styles.sectionBadgeManual}>
          <Ionicons name="medkit-outline" size={16} color={colors.success} />
          <Text style={styles.sectionBadgeManualText}>
            Ingresar manualmente según lo indicado por el médico
          </Text>
        </View>
      ) : null}

      <FormTextInput
        label="Dosis indicada"
        placeholder="Ej. 400 mg / 1 comprimido"
        value={draft.dosage}
        onChangeText={(value) => onChange('dosage', value)}
        error={errors.dosage}
      />

      <FormTextInput
        label="Frecuencia de tomas"
        placeholder="Ej. cada 8 horas"
        value={draft.frequency}
        onChangeText={(value) => onChange('frequency', value)}
        error={errors.frequency}
      />

      <FormTextInput
        label="Indicaciones"
        placeholder="Ej. Tomar con comida o abundante agua"
        value={draft.instructions}
        onChangeText={(value) => onChange('instructions', value)}
        error={errors.instructions}
        multiline
        numberOfLines={4}
        style={styles.instructionsInput}
      />

      <PrimaryButton title={submitLabel} onPress={onSubmit} isLoading={isSubmitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 6,
    marginBottom: 20,
    color: colors.textSecondary,
  },
  sectionBadgeAi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  sectionBadgeAiText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionBadgeManual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 14,
  },
  sectionBadgeManualText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  instructionsInput: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
});
