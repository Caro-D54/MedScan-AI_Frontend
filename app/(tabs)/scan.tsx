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

export default function ScanScreen() {
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [draft, setDraft] = useState<MedicationDraft | null>(null);
  const [errors, setErrors] = useState<Partial<Record<MedicationField, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function startCapturing(): void {
    setDraft(null);
    setScreenState('capturing');
  }

  function handleCaptured(uri: string): void {
    setPhotoUri(uri);
    setScreenState('preview');
  }

  function retake(): void {
    setPhotoUri(null);
    setDraft(null);
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

    try {
      const result = await uploadScanImage(photoUri);
      setDraft(toMedicationDraft(result));
      setScreenState('review');
    } catch {
      Alert.alert('Error', 'No se pudo procesar la imagen. Intentá nuevamente.');
      setScreenState('preview');
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
    } catch {
      Alert.alert('Error', 'No se pudo guardar el medicamento. Intentá nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function reset(): void {
    setPhotoUri(null);
    setDraft(null);
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

        <View style={styles.previewActions}>
          <Pressable style={styles.retakeButton} onPress={retake}>
            <Ionicons name="refresh" size={20} color={colors.background} />
            <Text style={styles.retakeText}>Reintentar</Text>
          </Pressable>

          <View style={styles.processButtonWrapper}>
            <PrimaryButton title="Procesar" onPress={() => void processImage()} />
          </View>
        </View>
      </View>
    );
  }

  if (screenState === 'review' && draft) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.reviewContent}>
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.reviewThumbnail} /> : null}

        <MedicationReviewForm
          draft={draft}
          errors={errors}
          isSubmitting={isSubmitting}
          onChange={updateDraft}
          onSubmit={handleSubmit}
        />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.idleContent}>
        <Ionicons name="scan" size={64} color={colors.primary} />
        <Text style={styles.title}>Escanear Medicamento</Text>
        <Text style={styles.subtitle}>
          Capturá una foto del medicamento o elegí una desde tu galería.
        </Text>

        <View style={styles.primaryAction}>
          <PrimaryButton title="Tomar Foto" onPress={startCapturing} />
        </View>

        <Pressable style={styles.galleryButton} onPress={() => void chooseFromLibrary()}>
          <Ionicons name="images" size={20} color={colors.primary} />
          <Text style={styles.galleryText}>Elegir de Galería</Text>
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
  },
  reviewThumbnail: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
    borderRadius: 8,
    marginBottom: 20,
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
  preview: {
    flex: 1,
    width: '100%',
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
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

