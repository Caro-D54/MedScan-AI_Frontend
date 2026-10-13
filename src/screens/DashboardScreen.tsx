import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, fonts, radius, spacing } from "../theme/theme";
import { BellIcon, CheckCircleIcon, ClockIcon, PillIcon } from "../icons/icons";
import { getMedications } from "../services/medicationService";
import { markMedicationTakenState, subscribeMedicationChanges } from "../services/medicationEvents";
import { markDoseTaken } from "../services/treatmentService";
import type { Medication } from "@/types";

export interface DashboardScreenProps {
  onOpenDetail?: (med: Medication) => void;
  userName?: string;
}

export function DashboardScreen({ onOpenDetail, userName }: DashboardScreenProps) {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTakingDose, setIsTakingDose] = useState(false);

  const displayName = userName?.trim() || "Alex";
  const initial = displayName.charAt(0).toUpperCase() || "A";

  const loadMedications = useCallback(async (): Promise<void> => {
    try {
      const data = await getMedications();
      setMeds(data);
      setErrorMsg(null);
    } catch {
      setErrorMsg("No se pudo conectar con el backend.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadMedications();
    const unsubscribe = subscribeMedicationChanges(() => {
      void loadMedications();
    });
    return () => {
      unsubscribe();
    };
  }, [loadMedications]);

  const handleRefresh = useCallback((): void => {
    setRefreshing(true);
    void loadMedications();
  }, [loadMedications]);

  const handleTakeNow = useCallback(async (): Promise<void> => {
    const med = meds[0];
    if (!med) {
      return;
    }
    if (!med.doseId) {
      Alert.alert("Sin dosis pendiente", "No hay una toma programada para este medicamento.");
      return;
    }
    setIsTakingDose(true);
    try {
      await markDoseTaken(med.doseId);
      markMedicationTakenState(med.id);
      Alert.alert("Toma registrada", `Registraste la toma de ${med.name}.`);
      void getMedications().then(setMeds);
    } catch {
      Alert.alert("Error", "No se pudo registrar la toma.");
    } finally {
      setIsTakingDose(false);
    }
  }, [meds]);

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.teal}
          colors={[colors.teal]}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View>
            <Text style={styles.brand}>MedScan AI</Text>
            <Text style={styles.greeting}>{`Hola, ${displayName}`}</Text>
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
          <View style={[styles.nextDoseCard, meds[0].doseTaken && styles.nextDoseCardTaken]}>
            <View style={styles.nextDoseLeft}>
              <View style={[styles.iconCircle, meds[0].doseTaken && styles.iconCircleTaken]}>
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
            <Pressable
              style={[
                styles.takeNowButton,
                meds[0].doseTaken && styles.takeNowButtonTaken,
                (!meds[0].doseId || isTakingDose) && !meds[0].doseTaken && styles.takeNowButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Tomar ahora"
              onPress={() => void handleTakeNow()}
              disabled={isTakingDose || !meds[0].doseId}
            >
              {isTakingDose ? (
                <ActivityIndicator size="small" color={colors.teal} />
              ) : meds[0].doseTaken ? (
                <>
                  <CheckCircleIcon size={13} color={colors.success} />
                  <Text style={styles.takeNowTextTaken}>Dosis tomada</Text>
                </>
              ) : (
                <>
                  <CheckCircleIcon size={13} color={colors.teal} />
                  <Text style={styles.takeNowText}>Tomar ahora</Text>
                </>
              )}
            </Pressable>
          </View>
        </Section>
      )}

      <Section title="Medicamentos">
        <View style={styles.list}>
          {meds.map((med) => (
            <MedCard key={med.id} med={med} onPress={() => onOpenDetail?.(med)} />
          ))}
        </View>
      </Section>
    </ScrollView>
  );
}

const Section = React.memo(function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
});

const MedCard = React.memo(function MedCard({ med, onPress }: { med: Medication; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.medCard,
        med.doseTaken && styles.medCardTaken,
        pressed && styles.medCardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalle de ${med.name}`}
    >
      <View style={styles.medCardHeader}>
        <Text style={styles.medCardName}>{med.name}</Text>
        {med.doseTaken ? (
          <View style={styles.takenBadge}>
            <CheckCircleIcon size={12} color={colors.success} />
            <Text style={styles.takenBadgeText}>Dosis tomada</Text>
          </View>
        ) : med.status === "verified" ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Verificado</Text>
          </View>
        ) : null}
      </View>
      {med.description ? <Text style={styles.medCardDesc}>{med.description}</Text> : null}
    </Pressable>
  );
});

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
  nextDoseCardTaken: {
    borderColor: "rgba(52, 211, 153, 0.35)",
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
  iconCircleTaken: {
    backgroundColor: "rgba(52, 211, 153, 0.15)",
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
  takeNowButtonTaken: {
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    borderColor: "rgba(52, 211, 153, 0.4)",
  },
  takeNowButtonDisabled: {
    opacity: 0.4,
  },
  takeNowText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.teal },
  takeNowTextTaken: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.success },
  list: { gap: spacing.sm },
  medCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  medCardTaken: {
    borderColor: "rgba(52, 211, 153, 0.35)",
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
  takenBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.4)",
  },
  takenBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.success,
  },
});
