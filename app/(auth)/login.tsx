import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { FormTextInput } from '@/components/FormTextInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/hooks/useAuth';
import { validateLoginForm } from '@/utils/validation';
import { colors } from '@/theme';
import type { LoginErrors } from '@/types/auth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(): void {
    const nextErrors = validateLoginForm({ email, password });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    void performLogin();
  }

  async function performLogin(): Promise<void> {
    setIsSubmitting(true);
    try {
      await signIn({ email, password });
      router.replace('/');
    } catch {
      Alert.alert('Error', 'No se pudo iniciar sesión. Verificá tus credenciales.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Iniciar Sesión</Text>

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

        <PrimaryButton title="Ingresar" onPress={handleSubmit} isLoading={isSubmitting} />

        <Text style={styles.footer}>
          ¿No tenés cuenta? <Link href="/register">Registrate</Link>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: colors.textPrimary,
  },
  footer: {
    marginTop: 16,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
