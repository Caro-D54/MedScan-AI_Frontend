import { View, Text, StyleSheet } from 'react-native';
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
}: MedicationReviewFormProps) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <FormTextInput
        label="Nombre"
        value={draft.name}
        onChangeText={(value) => onChange('name', value)}
        error={errors.name}
      />

      <FormTextInput
        label="Dosis"
        value={draft.dosage}
        onChangeText={(value) => onChange('dosage', value)}
      />

      <FormTextInput
        label="Frecuencia"
        value={draft.frequency}
        onChangeText={(value) => onChange('frequency', value)}
      />

      <FormTextInput
        label="Indicaciones"
        value={draft.instructions}
        onChangeText={(value) => onChange('instructions', value)}
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
  instructionsInput: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
});
