import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts, radius, spacing } from "../theme/theme";
import { BackIcon } from "../icons/icons";
import { useAuth } from "../services/AuthContext";

type Step = 1 | 2 | 3;
const CONDITIONS = ["Hipertensión", "Diabetes", "Asma", "Artritis", "Tiroides", "Corazón"];

export function RegisterScreen({ onBack }: { onBack: () => void }) {
  const { register } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    dob: "",
    gender: "",
    conditions: [] as string[],
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toggleCondition = (c: string) =>
    setForm((f) => ({
      ...f,
      conditions: f.conditions.includes(c) ? f.conditions.filter((x) => x !== c) : [...f.conditions, c],
    }));

  const canAdvance =
    (step === 1 && form.name.trim() && form.email.trim() && form.password.length >= 6) ||
    (step === 2 && form.dob.trim() && form.gender) ||
    step === 3;

  const handleNext = async () => {
    if (step < 3) {
      setStep((s) => (s + 1) as Step);
      return;
    }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (step === 1 ? onBack() : setStep((s) => (s - 1) as Step))}
          style={styles.backButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <BackIcon />
        </Pressable>
        <View style={styles.stepDots}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={[styles.dot, s === step && styles.dotActive]} />
          ))}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {step === 1 && (
        <View style={styles.form}>
          <Text style={styles.stepTitle}>Creá tu cuenta</Text>
          <LabeledInput label="Nombre completo" value={form.name} onChangeText={(v) => set("name", v)} placeholder="Alex Chen" />
          <LabeledInput
            label="Correo electrónico"
            value={form.email}
            onChangeText={(v) => set("email", v)}
            placeholder="alex@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <LabeledInput
            label="Contraseña"
            value={form.password}
            onChangeText={(v) => set("password", v)}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
          />
        </View>
      )}

      {step === 2 && (
        <View style={styles.form}>
          <Text style={styles.stepTitle}>Sobre vos</Text>
          <LabeledInput label="Fecha de nacimiento" value={form.dob} onChangeText={(v) => set("dob", v)} placeholder="DD/MM/AAAA" />
          <Text style={styles.fieldLabel}>Género</Text>
          <View style={styles.chipRow}>
            {["Femenino", "Masculino", "Otro"].map((g) => (
              <Pressable
                key={g}
                onPress={() => set("gender", g)}
                style={[styles.chip, form.gender === g && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: form.gender === g }}
              >
                <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>{g}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {step === 3 && (
        <View style={styles.form}>
          <Text style={styles.stepTitle}>Condiciones preexistentes</Text>
          <Text style={styles.stepSubtitle}>Nos ayuda a detectar interacciones relevantes para vos.</Text>
          <View style={styles.chipRow}>
            {CONDITIONS.map((c) => (
              <Pressable
                key={c}
                onPress={() => toggleCondition(c)}
                style={[styles.chip, form.conditions.includes(c) && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: form.conditions.includes(c) }}
              >
                <Text style={[styles.chipText, form.conditions.includes(c) && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <Pressable
        onPress={handleNext}
        disabled={!canAdvance || loading}
        style={[styles.submitButton, (!canAdvance || loading) && styles.submitButtonDisabled]}
        accessibilityRole="button"
        accessibilityLabel={step < 3 ? "Continuar" : "Crear cuenta"}
      >
        {loading ? <ActivityIndicator color={colors.bgPrimary} /> : (
          <Text style={styles.submitText}>{step < 3 ? "Continuar" : "Crear cuenta"}</Text>
        )}
      </Pressable>
    </View>
  );
}

function LabeledInput(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences";
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.textDim}
        secureTextEntry={props.secureTextEntry}
        keyboardType={props.keyboardType}
        autoCapitalize={props.autoCapitalize}
        style={styles.input}
        accessibilityLabel={props.label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xl },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.1)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.2)",
  },
  stepDots: { flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.borderSubtle },
  dotActive: { backgroundColor: colors.teal, width: 18 },
  form: { gap: spacing.md, flex: 1 },
  stepTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.textPrimary, marginBottom: spacing.xs },
  stepSubtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm },
  fieldLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.textDim,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    minHeight: 40,
    justifyContent: "center",
  },
  chipActive: { backgroundColor: "rgba(34,211,238,0.15)", borderColor: "rgba(34,211,238,0.4)" },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.teal },
  submitButton: {
    minHeight: 52,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.teal,
    marginTop: spacing.lg,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.bgPrimary },
});
