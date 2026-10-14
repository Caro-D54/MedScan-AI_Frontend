import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/components/PrimaryButton';
import { FormTextInput } from '@/components/FormTextInput';
import { useAuth } from '@/hooks/useAuth';
import { pickImageFromLibrary, requestMediaLibraryPermission } from '@/utils/media';
import {
  createDefaultProfile,
  loadUserProfile,
  saveUserProfile,
  toPersistentAvatarUri,
  type UserProfileData,
} from '@/services/profileService';
import { colors } from '@/theme';

export default function ProfileScreen() {
  const { user, signOut, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileData>(() => createDefaultProfile(user));
  const [draft, setDraft] = useState<UserProfileData>(() => createDefaultProfile(user));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProfile = useCallback(async () => {
    const loaded = await loadUserProfile(user);
    setProfile(loaded);
    setDraft(loaded);
    if (
      (loaded.name && loaded.name !== user?.name) ||
      loaded.avatarUri !== user?.avatarUri
    ) {
      updateUser?.({
        name: loaded.name || user?.name,
        email: loaded.email || user?.email,
        avatarUri: loaded.avatarUri,
      });
    }
  }, [user, updateUser]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  async function handlePickAvatar(): Promise<void> {
    setFeedback(null);
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para elegir una foto de perfil.');
      setFeedback({
        type: 'error',
        text: 'Necesitamos acceso a tu galería para elegir una foto de perfil.',
      });
      return;
    }

    const pickedUri = await pickImageFromLibrary();
    if (!pickedUri) {
      return;
    }

    const persistentUri = await toPersistentAvatarUri(pickedUri);
    const updatedDraft = { ...(isEditing ? draft : profile), avatarUri: persistentUri };
    setDraft(updatedDraft);
    const saved = await saveUserProfile(user?.id, { ...profile, avatarUri: persistentUri });
    setProfile(saved);
    updateUser?.({ avatarUri: persistentUri });
    setFeedback({ type: 'success', text: '¡Imagen de perfil actualizada en toda la aplicación!' });
  }

  function handleRemoveAvatar(): void {
    const updatedDraft = { ...(isEditing ? draft : profile), avatarUri: null };
    setDraft(updatedDraft);
    void saveUserProfile(user?.id, { ...profile, avatarUri: null }).then((saved) => {
      setProfile(saved);
      updateUser?.({ avatarUri: null });
      setFeedback({ type: 'success', text: 'Imagen de perfil eliminada.' });
    });
  }

  function startEditing(): void {
    setFeedback(null);
    setErrors({});
    setDraft({ ...profile });
    setIsEditing(true);
  }

  function cancelEditing(): void {
    setErrors({});
    setDraft({ ...profile });
    setIsEditing(false);
  }

  function updateField<K extends keyof UserProfileData>(field: K, value: UserProfileData[K]): void {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleSave(): Promise<void> {
    const nextErrors: { name?: string; email?: string } = {};
    if (!draft.name.trim()) {
      nextErrors.name = 'Ingresá tu nombre de usuario.';
    }
    if (!draft.email.trim() || !draft.email.includes('@')) {
      nextErrors.email = 'Ingresá un correo electrónico válido.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      const saved = await saveUserProfile(user?.id, draft);
      setProfile(saved);
      setDraft(saved);
      updateUser?.({ name: saved.name, email: saved.email, avatarUri: saved.avatarUri });
      setIsEditing(false);
      setFeedback({ type: 'success', text: '¡Datos de perfil actualizados correctamente!' });
    } catch {
      setFeedback({ type: 'error', text: 'No se pudieron guardar los cambios. Intentá nuevamente.' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut(): Promise<void> {
    await signOut();
    router.replace('/login');
  }

  const activeAvatar = isEditing ? draft.avatarUri : profile.avatarUri;
  const displayName = (isEditing ? draft.name : profile.name) || user?.name || 'Usuario';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'U';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Mi Perfil</Text>

      <View style={styles.avatarSection}>
        <Pressable
          style={styles.avatarWrapper}
          onPress={() => void handlePickAvatar()}
          accessibilityRole="button"
          accessibilityLabel="Cambiar imagen de perfil"
        >
          {activeAvatar ? (
            <Image source={{ uri: activeAvatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={16} color={colors.background} />
          </View>
        </Pressable>

        <Text style={styles.headerName}>{displayName}</Text>
        <Text style={styles.headerEmail}>{(isEditing ? draft.email : profile.email) || user?.email}</Text>
        {user?.role === 'ADMIN' ? (
          <View style={styles.adminRolePill}>
            <Ionicons name="shield-checkmark" size={12} color="#000" />
            <Text style={styles.adminRolePillText}>ADMINISTRADOR</Text>
          </View>
        ) : null}

        <View style={styles.avatarButtonsRow}>
          <Pressable
            style={styles.changePhotoButton}
            onPress={() => void handlePickAvatar()}
            accessibilityRole="button"
            accessibilityLabel="Seleccionar foto de perfil"
          >
            <Ionicons name="image-outline" size={16} color={colors.primary} />
            <Text style={styles.changePhotoText}>
              {activeAvatar ? 'Cambiar foto de perfil' : 'Agregar foto de perfil'}
            </Text>
          </Pressable>

          {activeAvatar ? (
            <Pressable
              style={styles.removePhotoButton}
              onPress={handleRemoveAvatar}
              accessibilityRole="button"
              accessibilityLabel="Quitar foto de perfil"
            >
              <Ionicons name="trash-outline" size={15} color={colors.danger} />
              <Text style={styles.removePhotoText}>Quitar</Text>
            </Pressable>
          ) : null}
        </View>
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
            color={feedback.type === 'error' ? colors.danger : colors.success}
          />
          <Text style={styles.feedbackText}>{feedback.text}</Text>
        </View>
      ) : null}

      {isEditing ? (
        <View style={styles.formContainer}>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Editar Datos Personales</Text>
            </View>

            <FormTextInput
              label="Nombre de usuario"
              placeholder="Ej. Carolina Díaz"
              value={draft.name}
              onChangeText={(value) => updateField('name', value)}
              error={errors.name}
            />

            <FormTextInput
              label="Mail"
              placeholder="Ej. carolina@ejemplo.com"
              value={draft.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <FormTextInput
              label="Edad"
              placeholder="Ej. 32"
              value={draft.age}
              onChangeText={(value) => updateField('age', value)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="medkit-outline" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Editar Datos Médicos</Text>
            </View>

            <FormTextInput
              label="Grupo sanguíneo"
              placeholder="Ej. O+, A+, B-"
              value={draft.bloodType}
              onChangeText={(value) => updateField('bloodType', value)}
            />

            <FormTextInput
              label="Alergias"
              placeholder="Ej. Penicilina, Ibuprofeno, Ninguna"
              value={draft.allergies}
              onChangeText={(value) => updateField('allergies', value)}
            />

            <FormTextInput
              label="Datos médicos / Antecedentes"
              placeholder="Ej. Hipertensión, Hipotiroidismo, Diabetes..."
              value={draft.medicalConditions}
              onChangeText={(value) => updateField('medicalConditions', value)}
              multiline
              numberOfLines={3}
              style={styles.multilineInput}
            />

            <FormTextInput
              label="Médico de cabecera / Contacto de emergencia"
              placeholder="Ej. Dra. Gómez - 11 4444-5555"
              value={draft.emergencyContact}
              onChangeText={(value) => updateField('emergencyContact', value)}
            />
          </View>

          <View style={styles.actionsContainer}>
            <PrimaryButton
              title="Guardar Cambios"
              onPress={() => void handleSave()}
              isLoading={isSaving}
            />
            <PrimaryButton
              title="Cancelar"
              variant="danger"
              onPress={cancelEditing}
              disabled={isSaving}
            />
          </View>
        </View>
      ) : (
        <View style={styles.viewContainer}>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Datos Personales</Text>
            </View>

            <ProfileInfoRow label="Nombre de usuario" value={profile.name || user?.name || '—'} />
            <ProfileInfoRow label="Mail" value={profile.email || user?.email || '—'} />
            <ProfileInfoRow
              label="Edad"
              value={profile.age ? `${profile.age.replace(/\s*años$/i, '')} años` : 'Sin especificar'}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="medkit-outline" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Datos Médicos</Text>
            </View>

            <ProfileInfoRow
              label="Grupo sanguíneo"
              value={profile.bloodType || 'Sin especificar'}
            />
            <ProfileInfoRow
              label="Alergias"
              value={profile.allergies || 'Sin especificar'}
            />
            <ProfileInfoRow
              label="Condiciones médicas / Antecedentes"
              value={profile.medicalConditions || 'Sin especificar'}
            />
            <ProfileInfoRow
              label="Médico / Contacto de emergencia"
              value={profile.emergencyContact || 'Sin especificar'}
              isLast
            />
          </View>

          <View style={styles.actionsContainer}>
            {user?.role === 'ADMIN' ? (
              <Pressable
                style={styles.adminPanelButton}
                onPress={() => router.push('/admin')}
                accessibilityRole="button"
                accessibilityLabel="Abrir panel de administración"
              >
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
                <Text style={styles.adminPanelButtonText}>Panel de Administrador</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </Pressable>
            ) : null}
            <PrimaryButton title="Editar" onPress={startEditing} />
            <PrimaryButton
              title="Cerrar Sesión"
              variant="danger"
              onPress={() => void handleSignOut()}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

interface ProfileInfoRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

function ProfileInfoRow({ label, value, isLast = false }: ProfileInfoRowProps) {
  return (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
    paddingBottom: 44,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 104,
    height: 104,
    borderRadius: 52,
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(34, 211, 238, 0.16)',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: 'bold',
    color: colors.primary,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  headerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  avatarButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  removePhotoText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
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
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: colors.success,
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
  viewContainer: {
    gap: 16,
  },
  formContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 18,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoRow: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  infoRowLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  actionsContainer: {
    marginTop: 8,
    gap: 12,
  },
  adminRolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 6,
  },
  adminRolePillText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  adminPanelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  adminPanelButtonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});
