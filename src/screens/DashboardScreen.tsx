import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing } from "../theme/theme";
import { BellIcon, CheckCircleIcon, ClockIcon, PillIcon } from "../icons/icons";
import { getMedications } from "../services/medicaments";
import type { Medication } from "../services/medicationTypes";

export function DashboardScreen({ onOpenDetail }: { onOpenDetail: (med: Medication) => void }) {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getMedications()
      .then(setMeds)
      .catch(() => setErrorMsg("No se pudo conectar con el backend."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <View>
            <Text style={styles.brand}>MedScan AI</Text>
            <Text style={styles.greeting}>Hola, Alex</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Notificaciones" hitSlop={8}>
          <BellIcon />
        </Pressable>
      </View>

      {errorMsg ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {meds.length === 0 && !errorMsg ? (
        <Text style={styles.emptyText}>Todavía no escaneaste ningún medicamento.</Text>
      ) : null}

      {meds.length > 0 && (
        <Section title="Próxima dosis">
          <View style={styles.nextDoseCard}>
            <View style={styles.nextDoseLeft}>
              <View style={styles.iconCircle}>
                <PillIcon size={16} />
              </View>
              <View>
                <Text style={styles.nextDoseName}>
                  {meds[0].name} {meds[0].dose}
                </Text>
                <View style={styles.nextDoseTimeRow}>
                  <ClockIcon />
                  <Text style={styles.nextDoseTime}>{meds[0].nextDose ?? "Sin horario"}</Text>
                </View>
              </View>
            </View>
            <Pressable style={styles.takeNowButton} accessibilityRole="button" accessibilityLabel="Tomar ahora">
              <CheckCircleIcon size={13} color={colors.teal} />
              <Text style={styles.takeNowText}>Tomar ahora</Text>
            </Pressable>
          </View>
        </Section>
      )}

      <Section title="Medicamentos">
        <View style={styles.list}>
          {meds.map((med) => (
            <MedCard key={med.id} med={med} onPress={() => onOpenDetail(med)} />
          ))}
        </View>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function MedCard({ med, onPress }: { med: Medication; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.medCard, pressed && styles.medCardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalle de ${med.name}`}
    >
      <View style={styles.medCardHeader}>
        <Text style={styles.medCardName}>{med.name}</Text>
        {med.status === "verified" ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Verificado</Text>
          </View>
        ) : null}
      </View>
      {med.description ? <Text style={styles.medCardDesc}>{med.description}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loadingRoot: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.teal,
  },
  avatarText: { fontFamily: fonts.displaySemiBold, fontSize: 14, color: colors.bgPrimary },
  brand: { fontFamily: fonts.displaySemiBold, fontSize: 16, color: colors.textPrimary },
  greeting: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  errorBox: {
    borderRadius: radius.md,
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
    padding: spacing.md,
  },
  errorText: { fontFamily: fonts.body, fontSize: 12, color: colors.amber },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing.xl },
  section: { gap: spacing.sm },
  sectionTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textSecondary },
  nextDoseCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  nextDoseLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md, flexShrink: 1 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.12)",
  },
  nextDoseName: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  nextDoseTimeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  nextDoseTime: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.teal },
  takeNowButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: "rgba(34,211,238,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.2)",
  },
  takeNowText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.teal },
  list: { gap: spacing.sm },
  medCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  medCardPressed: { backgroundColor: colors.bgCardHover },
  medCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  medCardName: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  medCardDesc: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: "rgba(34,211,238,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.2)",
  },
  badgeText: { fontFamily: fonts.bodySemiBold, fontSize: 10, color: colors.teal },
});
