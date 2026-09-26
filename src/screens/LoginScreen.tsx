import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, radius, spacing } from "../theme/theme";
import { EyeIcon, EyeOffIcon, MailIcon, LockIcon, PillIcon } from "../icons/icons";
import { useAuth } from "../services/AuthContext";

export function LoginScreen({ onNavigateRegister }: { onNavigateRegister: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch {
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.logoBlock}>
        <View style={styles.logoBadge}>
          <PillIcon size={32} color={colors.teal} />
        </View>
        <Text style={styles.title}>MedScan AI</Text>
        <Text style={styles.subtitle}>Tu asistente de medicación inteligente</Text>
      </View>

      <View style={styles.form}>
        <Field
          label="Correo electrónico"
          icon={<MailIcon />}
          value={email}
          onChangeText={setEmail}
          placeholder="alex@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="Contraseña"
          icon={<LockIcon />}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry={!showPass}
          rightAction={
            <Pressable
              onPress={() => setShowPass((v) => !v)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPass ? <EyeOffIcon /> : <EyeIcon />}
            </Pressable>
          }
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          onPress={handleLogin}
          disabled={loading || !email || !password}
          style={({ pressed }) => [
            styles.submitButton,
            (loading || !email || !password) && styles.submitButtonDisabled,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión"
        >
          {loading ? (
            <ActivityIndicator color={colors.teal} />
          ) : (
            <Text style={styles.submitText}>Iniciar Sesión</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿No tienes cuenta? </Text>
        <Pressable onPress={onNavigateRegister} hitSlop={8}>
          <Text style={styles.footerLink}>Regístrate</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Field(props: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences";
  rightAction?: React.ReactNode;
}) {
  const active = props.value.length > 0;
  return (
    <View>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <View style={[styles.fieldBox, active && styles.fieldBoxActive]}>
        {props.icon}
        <TextInput
          value={props.value}
          onChangeText={props.onChangeText}
          placeholder={props.placeholder}
          placeholderTextColor={colors.textDim}
          secureTextEntry={props.secureTextEntry}
          keyboardType={props.keyboardType}
          autoCapitalize={props.autoCapitalize}
          style={styles.fieldInput}
          accessibilityLabel={props.label}
        />
        {props.rightAction}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxxl, paddingBottom: spacing.xl },
  logoBlock: { alignItems: "center", marginBottom: spacing.xxxl },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    backgroundColor: "rgba(34,211,238,0.15)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.25)",
  },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  form: { gap: spacing.md },
  fieldLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.textDim,
    marginBottom: 6,
  },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  fieldBoxActive: { borderColor: "rgba(34,211,238,0.3)" },
  fieldInput: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.textPrimary },
  errorText: { fontFamily: fonts.body, fontSize: 12, color: colors.amber },
  submitButton: {
    marginTop: spacing.xs,
    minHeight: 52,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.teal,
  },
  submitButtonDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  submitText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.bgPrimary },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: "auto", paddingTop: spacing.xl },
  footerText: { fontFamily: fonts.body, fontSize: 14, color: colors.textDim },
  footerLink: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.teal },
});
