import { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraCapture } from '@/components/CameraCapture';
import { PrimaryButton } from '@/components/PrimaryButton';
import { MedicationReviewForm } from '@/components/MedicationReviewForm';
import { pickImageFromLibrary, requestMediaLibraryPermission } from '@/utils/media';
import { uploadScanImage } from '@/services/scanService';
import { saveMedicationFromScan } from '@/services/medicationService';
import { toMedicationDraft, validateMedicationDraft } from '@/utils/medication';
import type { MedicationDraft, MedicationField } from '@/types/medication';
import { colors } from '@/theme';

type ScreenState = 'idle' | 'capturing' | 'preview' | 'review' | 'processing';

const EMPTY_DRAFT: MedicationDraft = {
  name: '',
  activeIngredient: '',
  dosage: '',
  frequency: '',
  instructions: '',
};

export default function ScanScreen() {
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [draft, setDraft] = useState<MedicationDraft | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<MedicationField, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function startCapturing(): void {
    setDraft(null);
    setIsManualMode(false);
    setNoticeMessage(null);
    setScreenState('capturing');
  }

  function startManualEntry(keepPhoto = false): void {
    if (!keepPhoto) {
      setPhotoUri(null);
    }
    setErrors({});
    setIsManualMode(true);
    setNoticeMessage(null);
    setDraft({ ...EMPTY_DRAFT });
    setScreenState('review');
  }

  function handleCaptured(uri: string): void {
    setPhotoUri(uri);
    setNoticeMessage(null);
    setScreenState('preview');
  }

  function retake(): void {
    setPhotoUri(null);
    setDraft(null);
    setNoticeMessage(null);
    setScreenState('capturing');
  }

  async function chooseFromLibrary(): Promise<void> {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para seleccionar una imagen.');
      return;
    }

    const uri = await pickImageFromLibrary();
    if (uri) {
      handleCaptured(uri);
    }
  }

  async function processImage(): Promise<void> {
    if (!photoUri) {
      return;
    }

    setScreenState('processing');
    setNoticeMessage(null);

    try {
      const result = await uploadScanImage(photoUri);
      setIsManualMode(false);
      setDraft({
        ...toMedicationDraft(result),
        activeIngredient: result.activeIngredient ?? '',
      });
      setScreenState('review');
    } catch {
      Alert.alert(
        'Ingreso manual habilitado',
        'No se pudo analizar la imagen con IA. Podés completar los datos del medicamento manualmente.',
      );
      setIsManualMode(true);
      setNoticeMessage(
        'No se pudo analizar la imagen con IA automáticamente. Completá los datos del medicamento manualmente a continuación.',
      );
      setDraft({ ...EMPTY_DRAFT });
      setScreenState('review');
    }
  }

  function updateDraft(field: MedicationField, value: string): void {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  function handleSubmit(): void {
    if (!draft) {
      return;
    }

    const nextErrors = validateMedicationDraft(draft);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    void saveMedication();
  }

  async function saveMedication(): Promise<void> {
    if (!draft) {
      return;
    }

    setIsSubmitting(true);
    try {
      await saveMedicationFromScan(draft, photoUri);
      Alert.alert('Éxito', 'Medicamento guardado correctamente.');
      reset();
      router.replace('/');
    } catch {
      Alert.alert('Error', 'No se pudo guardar el medicamento. Intentá nuevamente.');
      setNoticeMessage('No se pudo guardar el medicamento. Verificá tu conexión e intentá nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function reset(): void {
    setPhotoUri(null);
    setDraft(null);
    setIsManualMode(false);
    setNoticeMessage(null);
    setErrors({});
    setIsSubmitting(false);
    setScreenState('idle');
  }

  if (screenState === 'capturing') {
    return <CameraCapture onCapture={handleCaptured} onCancel={reset} />;
  }

  if (screenState === 'processing') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Procesando imagen…</Text>
      </View>
    );
  }

  if (screenState === 'preview' && photoUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="contain" />

        <View style={styles.previewFooter}>
          <View style={styles.previewActions}>
            <Pressable
              style={styles.retakeButton}
              onPress={retake}
              accessibilityRole="button"
              accessibilityLabel="Reintentar foto"
            >
              <Ionicons name="refresh" size={20} color={colors.background} />
              <Text style={styles.retakeText}>Reintentar</Text>
            </Pressable>

            <View style={styles.processButtonWrapper}>
              <PrimaryButton title="Procesar con IA" onPress={() => void processImage()} />
            </View>
          </View>

          <Pressable
            style={styles.manualPreviewButton}
            onPress={() => startManualEntry(true)}
            accessibilityRole="button"
            accessibilityLabel="Completar datos manualmente"
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={styles.galleryText}>Completar datos manualmente</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (screenState === 'review' && draft) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.reviewContent}>
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.reviewThumbnail} /> : null}

        {noticeMessage ? (
          <View style={styles.noticeBanner}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.noticeText}>{noticeMessage}</Text>
          </View>
        ) : null}

        <MedicationReviewForm
          draft={draft}
          errors={errors}
          isSubmitting={isSubmitting}
          onChange={updateDraft}
          onSubmit={handleSubmit}
          title={isManualMode ? 'Agregar Medicamento' : 'Revisar Medicamento'}
          subtitle={
            isManualMode
              ? 'Completá los datos del medicamento para guardarlo y programar tus tomas.'
              : 'Corregí los datos detectados por la IA antes de guardar.'
          }
        />

        <Pressable
          style={styles.cancelReviewButton}
          onPress={reset}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Cancelar y volver"
        >
          <Text style={styles.cancelReviewText}>Cancelar y volver</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.idleContent}>
        <Ionicons name="scan" size={64} color={colors.primary} />
        <Text style={styles.title}>Agregar Medicamento</Text>
        <Text style={styles.subtitle}>
          Capturá una foto del envase, elegí una de tu galería o ingresá los datos manualmente.
        </Text>

        <View style={styles.primaryAction}>
          <PrimaryButton title="Tomar Foto" onPress={startCapturing} />
        </View>

        <Pressable
          style={styles.galleryButton}
          onPress={() => void chooseFromLibrary()}
          accessibilityRole="button"
          accessibilityLabel="Elegir de Galería"
        >
          <Ionicons name="images" size={20} color={colors.primary} />
          <Text style={styles.galleryText}>Elegir de Galería</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o también podés</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={styles.manualCardButton}
          onPress={() => startManualEntry(false)}
          accessibilityRole="button"
          accessibilityLabel="Ingresar medicamento manualmente"
        >
          <Ionicons name="create-outline" size={22} color={colors.primary} />
          <Text style={styles.manualCardText}>Ingresar medicamento a mano</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  idleContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  reviewContent: {
    padding: 24,
    paddingBottom: 40,
  },
  reviewThumbnail: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
    borderRadius: 8,
    marginBottom: 20,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  primaryAction: {
    alignSelf: 'stretch',
    marginTop: 32,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  galleryText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  manualCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  manualCardText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  preview: {
    flex: 1,
    width: '100%',
  },
  previewFooter: {
    padding: 16,
    gap: 12,
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  manualPreviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.textSecondary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  retakeText: {
    marginLeft: 8,
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  processButtonWrapper: {
    flex: 1,
  },
  cancelReviewButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelReviewText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
});

