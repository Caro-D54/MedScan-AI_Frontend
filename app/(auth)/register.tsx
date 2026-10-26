import { useState } from 'react';
import { Text, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { FormTextInput } from '@/components/FormTextInput';
import { MedScanBrand } from '@/components/MedScanBrand';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/hooks/useAuth';
import { validateRegisterForm } from '@/utils/validation';
import { colors } from '@/theme';
import type { RegisterErrors } from '@/types/auth';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(): void {
    const nextErrors = validateRegisterForm({ name, email, password, confirmPassword });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    void performRegister();
  }

  async function performRegister(): Promise<void> {
    setIsSubmitting(true);
    try {
      await signUp({ name, email, password, confirmPassword });
      router.replace('/');
    } catch (err: unknown) {
      const axiosError = err as { response?: unknown; message?: string };
      if (!axiosError.response) {
        Alert.alert(
          'Error de conexión',
          'No se pudo conectar con el servidor. Verificá que el backend esté encendido y que la IP en .env coincida con la de tu PC en la red Wi-Fi.',
        );
      } else {
        Alert.alert('Error', 'No se pudo crear la cuenta. Intentá nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <MedScanBrand subtitle="Creá tu cuenta para gestionar tus medicamentos" size="compact" />
        <Text style={styles.title}>Crear Cuenta</Text>

        <FormTextInput
          label="Nombre"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />

        <FormTextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          error={errors.email}
        />

        <FormTextInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
        />

        <FormTextInput
          label="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          error={errors.confirmPassword}
        />

        <PrimaryButton title="Registrate" onPress={handleSubmit} isLoading={isSubmitting} />

        <Text style={styles.footer}>
          ¿Ya tenés cuenta? <Link href="/login">Iniciar sesión</Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.textPrimary,
  },
  footer: {
    marginTop: 16,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
