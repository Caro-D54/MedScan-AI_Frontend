import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing } from "../theme/theme";
import { BellIcon, CheckCircleIcon, ClockIcon, PillIcon } from "../icons/icons";
import { getMedications, getPendingDoses } from "../services/medicationService";
import {
  markMedicationTakenState,
  clearMedicationTakenState,
  subscribeMedicationChanges,
} from "../services/medicationEvents";
import { getProfileSync, subscribeProfileChanges } from "../services/profileService";
import { getTreatments, markDoseTaken } from "../services/treatmentService";
import { formatDayHeader, isSameCalendarDay, isToday } from "@/utils/date";
import type { Medication, PendingDose } from "@/types";

export interface DashboardScreenProps {
  onOpenDetail?: (med: Medication) => void;
  userName?: string;
  avatarUri?: string | null;
}

export function DashboardScreen({ onOpenDetail, userName, avatarUri }: DashboardScreenProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [meds, setMeds] = useState<Medication[]>([]);
  const [pendingDoses, setPendingDoses] = useState<PendingDose[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [takingIds, setTakingIds] = useState<Set<string>>(() => new Set());
  const [takenIds, setTakenIds] = useState<Set<string>>(() => new Set());
  const [undoingMedIds, setUndoingMedIds] = useState<Set<string>>(() => new Set());
  const [profileSnapshot, setProfileSnapshot] = useState(() => getProfileSync(null));

  const displayName = userName?.trim() || profileSnapshot.name?.trim() || "Usuario";
  const initial = displayName.charAt(0).toUpperCase() || "U";
  const resolvedAvatarUri = avatarUri ?? profileSnapshot.avatarUri ?? null;

  const loadData = useCallback(
    async (isInitial = false, dateToQuery = selectedDate): Promise<void> => {
      if (isInitial) {
        setLoading(true);
      }
      try {
        const [medList, dosesList] = await Promise.all([
          getMedications(dateToQuery),
          getPendingDoses(dateToQuery),
        ]);
        setMeds(medList);
        setPendingDoses(dosesList);
        setErrorMsg(null);
      } catch {
        setErrorMsg("No se pudo conectar con el servidor.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedDate],
  );

  useEffect(() => {
    void loadData(true, selectedDate);

    const unsubscribeMeds = subscribeMedicationChanges(() => {
      void loadData(false, selectedDate);
    });
    const unsubscribeProfile = subscribeProfileChanges((updated) => {
      setProfileSnapshot(updated);
    });

    return () => {
      unsubscribeMeds();
      unsubscribeProfile();
    };
  }, [loadData, selectedDate]);

  const handleRefresh = useCallback((): void => {
    setRefreshing(true);
    void loadData(false, selectedDate);
  }, [loadData, selectedDate]);

  const handleSelectDate = useCallback(
    (newDate: Date): void => {
      setSelectedDate(newDate);
      void loadData(false, newDate);
    },
    [loadData],
  );

  const handleChangeDay = useCallback(
    (offset: number): void => {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + offset);
      handleSelectDate(next);
    },
    [selectedDate, handleSelectDate],
  );

  const handleSelectToday = useCallback((): void => {
    handleSelectDate(new Date());
  }, [handleSelectDate]);

  const handleTakeDose = useCallback(
    async (dose: PendingDose): Promise<void> => {
      if (!dose.id || takingIds.has(dose.id)) {
        return;
      }

      setTakingIds((prev) => new Set(prev).add(dose.id));

      try {
        await markDoseTaken(dose.id);

        setTakingIds((prev) => {
          const next = new Set(prev);
          next.delete(dose.id);
          return next;
        });

        // Cambia la tarjeta inmediatamente a VERDE
        setTakenIds((prev) => new Set(prev).add(dose.id));
        markMedicationTakenState(dose.medicationId);

        // Permanece en VERDE durante 1.2s y luego DESAPARECE de la lista del día
        setTimeout(() => {
          setPendingDoses((prev) => prev.filter((item) => item.id !== dose.id));
          setTakenIds((prev) => {
            const next = new Set(prev);
            next.delete(dose.id);
            return next;
          });
          void loadData(false, selectedDate);
        }, 1200);
      } catch {
        setTakingIds((prev) => {
          const next = new Set(prev);
          next.delete(dose.id);
          return next;
        });
        Alert.alert("Error", "No se pudo registrar la toma. Intenta nuevamente.");
      }
    },
    [takingIds, selectedDate, loadData],
  );

  const handleUndoDose = useCallback(
    async (med: Medication): Promise<void> => {
      if (!med.id || undoingMedIds.has(med.id)) {
        return;
      }

      setUndoingMedIds((prev) => new Set(prev).add(med.id));

      try {
        let targetDoseId = med.lastTakenDoseId || (med.doseTaken ? med.doseId : undefined);

        if (!targetDoseId) {
          const treatments = await getTreatments(true);
          for (const t of treatments) {
            if (String(t.medicationId) === String(med.id)) {
              const takenToday = (t.doses ?? [])
                .filter((d) => d.status === "TAKEN" && isSameCalendarDay(d.scheduledAt, selectedDate))
                .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
              if (takenToday.length > 0) {
                targetDoseId = String(takenToday[0].id);
                break;
              }
            }
          }
        }

        if (targetDoseId) {
          await markDoseTaken(targetDoseId, "PENDING");
        }
        clearMedicationTakenState(med.id);
        void loadData(false, selectedDate);
      } catch {
        Alert.alert("Error", "No se pudo anular la toma.");
      } finally {
        setUndoingMedIds((prev) => {
          const next = new Set(prev);
          next.delete(med.id);
          return next;
        });
      }
    },
    [undoingMedIds, selectedDate, loadData],
  );

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const isCurrentDayToday = isToday(selectedDate);

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            {resolvedAvatarUri ? (
              <Image source={{ uri: resolvedAvatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
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

      {/* Sección: Dosis pendientes por día */}
      <View style={styles.section}>
        <View style={styles.daySelectorHeader}>
          <View style={styles.dayTitleBlock}>
            <Text style={styles.sectionTitle}>Dosis del día</Text>
            <Text style={styles.selectedDaySubtitle}>{formatDayHeader(selectedDate)}</Text>
          </View>

          <View style={styles.dayNavControls}>
            <Pressable
              style={styles.dayNavButton}
              onPress={() => handleChangeDay(-1)}
              accessibilityRole="button"
              accessibilityLabel="Día anterior"
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
            </Pressable>

            {!isCurrentDayToday ? (
              <Pressable
                style={styles.backToTodayButton}
                onPress={handleSelectToday}
                accessibilityRole="button"
                accessibilityLabel="Volver a hoy"
              >
                <Text style={styles.backToTodayText}>Hoy</Text>
              </Pressable>
            ) : null}

            <Pressable
              style={styles.dayNavButton}
              onPress={() => handleChangeDay(1)}
              accessibilityRole="button"
              accessibilityLabel="Día siguiente"
              hitSlop={8}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {pendingDoses.length > 0 ? (
          <View style={styles.dosesList}>
            {pendingDoses.map((dose) => {
              const isTaken = takenIds.has(dose.id);
              const isTaking = takingIds.has(dose.id);

              return (
                <View
                  key={dose.id}
                  style={[
                    styles.doseCard,
                    isTaken ? styles.doseCardTaken : styles.doseCardPending,
                  ]}
                >
                  <View style={styles.doseCardLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        isTaken ? styles.iconCircleTaken : styles.iconCirclePending,
                      ]}
                    >
                      {isTaken ? (
                        <CheckCircleIcon size={20} color={colors.success} />
                      ) : (
                        <PillIcon size={18} color={colors.danger} />
                      )}
                    </View>

                    <View style={styles.doseInfo}>
                      <Text style={styles.doseName}>
                        {dose.medicationName} {dose.dosage ? `· ${dose.dosage}` : ""}
                      </Text>

                      <View style={styles.doseTimeRow}>
                        <ClockIcon
                          size={13}
                          color={isTaken ? colors.success : colors.danger}
                        />
                        <Text
                          style={[
                            styles.doseTimeText,
                            isTaken ? styles.doseTimeTextTaken : styles.doseTimeTextPending,
                          ]}
                        >
                          {isTaken
                            ? `¡Dosis tomada! (${dose.scheduledTime})`
                            : `Horario: ${dose.scheduledTime}`}
                        </Text>
                      </View>

                      {!isTaken ? (
                        <View style={styles.pendingBadge}>
                          <Text style={styles.pendingBadgeText}>● Pendiente de tomar</Text>
                        </View>
                      ) : (
                        <View style={styles.takenBadge}>
                          <Text style={styles.takenBadgeText}>✓ Registrada correctamente</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Pressable
                    style={[
                      styles.takeActionButton,
                      isTaken ? styles.takeActionButtonTaken : styles.takeActionButtonPending,
                      isTaking && styles.takeActionButtonDisabled,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Tomar dosis de ${dose.medicationName}`}
                    onPress={() => void handleTakeDose(dose)}
                    disabled={isTaking || isTaken}
                  >
                    {isTaking ? (
                      <ActivityIndicator size="small" color={colors.danger} />
                    ) : isTaken ? (
                      <>
                        <CheckCircleIcon size={14} color={colors.success} />
                        <Text style={styles.takeActionTextTaken}>Tomada</Text>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon size={14} color={colors.danger} />
                        <Text style={styles.takeActionTextPending}>Tomar ahora</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.allDoneCard}>
            <View style={styles.allDoneIconCircle}>
              <CheckCircleIcon size={24} color={colors.success} />
            </View>
            <View style={styles.allDoneInfo}>
              <Text style={styles.allDoneTitle}>
                {isCurrentDayToday
                  ? "¡Todas las dosis de hoy tomadas!"
                  : "Sin dosis pendientes"}
              </Text>
              <Text style={styles.allDoneSubtitle}>
                {isCurrentDayToday
                  ? "No quedan tomas pendientes para hoy. La lista está al día."
                  : `No hay tomas pendientes programadas para ${formatDayHeader(selectedDate).toLowerCase()}.`}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Sección: Lista de Medicamentos */}
      <Section title="Mis medicamentos">
        {meds.length === 0 ? (
          <Text style={styles.emptyText}>Todavía no escaneaste ningún medicamento.</Text>
        ) : (
          <View style={styles.list}>
            {meds.map((med) => (
              <MedCard
                key={med.id}
                med={med}
                onPress={() => onOpenDetail?.(med)}
                onUndo={handleUndoDose}
                isUndoing={undoingMedIds.has(med.id)}
              />
            ))}
          </View>
        )}
      </Section>
    </ScrollView>
  );
}

const Section = React.memo(function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
});

interface MedCardProps {
  med: Medication;
  onPress: () => void;
  onUndo?: (med: Medication) => void;
  isUndoing?: boolean;
}

const MedCard = React.memo(function MedCard({
  med,
  onPress,
  onUndo,
  isUndoing,
}: MedCardProps) {
  const isTaken = Boolean(med.doseTaken);

  return (
    <View
      style={[
        styles.medCard,
        isTaken ? styles.medCardTaken : styles.medCardPending,
      ]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.medCardMainPressable,
          pressed && styles.medCardPressed,
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalle de ${med.name}`}
      >
        <View style={styles.medCardHeader}>
          <View style={styles.medCardTitleRow}>
            <Text style={styles.medCardName}>{med.name}</Text>
            {med.dosage ? <Text style={styles.medCardDosage}>{med.dosage}</Text> : null}
          </View>

          {isTaken ? (
            <View style={styles.takenBadgeSmall}>
              <CheckCircleIcon size={12} color={colors.success} />
              <Text style={styles.takenBadgeSmallText}>Al día</Text>
            </View>
          ) : (
            <View style={styles.pendingBadgeSmall}>
              <ClockIcon size={11} color={colors.danger} />
              <Text style={styles.pendingBadgeSmallText}>
                {med.nextDose ? `Pendiente · ${med.nextDose}` : "Pendiente"}
              </Text>
            </View>
          )}
        </View>

        {med.frequency ? (
          <Text style={styles.medCardFrequency}>Frecuencia: {med.frequency}</Text>
        ) : null}

        {med.instructions ? (
          <Text style={styles.medCardDesc} numberOfLines={2}>
            {med.instructions}
          </Text>
        ) : null}
      </Pressable>

      {/* Botón de anular toma: SOLO si está marcado como tomada (verde), oculto si está pendiente (rojo) */}
      {isTaken ? (
        <View style={styles.medCardFooter}>
          <Pressable
            style={styles.undoPillButton}
            onPress={() => onUndo?.(med)}
            disabled={isUndoing}
            accessibilityRole="button"
            accessibilityLabel={`Anular toma de ${med.name}`}
            hitSlop={6}
          >
            {isUndoing ? (
              <ActivityIndicator size="small" color={colors.amber} />
            ) : (
              <>
                <Ionicons name="arrow-undo" size={12} color={colors.amber} />
                <Text style={styles.undoPillText}>Anular toma</Text>
              </>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  loadingRoot: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxxl },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    overflow: "hidden",
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: { fontFamily: fonts.displaySemiBold, fontSize: 16, color: colors.bgPrimary },
  brand: { fontFamily: fonts.displaySemiBold, fontSize: 17, color: colors.textPrimary },
  greeting: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  errorBox: {
    borderRadius: radius.md,
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
    padding: spacing.md,
  },
  errorText: { fontFamily: fonts.body, fontSize: 12, color: colors.amber },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },

  /* Encabezado con selector de día */
  daySelectorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  dayTitleBlock: {
    gap: 2,
  },
  selectedDaySubtitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  dayNavControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dayNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  backToTodayButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "rgba(34, 211, 238, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.35)",
  },
  backToTodayText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.primary,
  },

  /* Lista de Dosis */
  dosesList: { gap: spacing.md },
  doseCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  // ROJO cuando aún no toma la dosis
  doseCardPending: {
    borderColor: colors.dangerBorder,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  // VERDE cuando la marca como tomada
  doseCardTaken: {
    borderColor: colors.successBorder,
    backgroundColor: "rgba(52, 211, 153, 0.12)",
  },
  doseCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCirclePending: {
    backgroundColor: "rgba(239, 68, 68, 0.18)",
  },
  iconCircleTaken: {
    backgroundColor: "rgba(52, 211, 153, 0.22)",
  },
  doseInfo: {
    flex: 1,
    gap: 3,
  },
  doseName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  doseTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  doseTimeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
  },
  doseTimeTextPending: {
    color: colors.danger,
  },
  doseTimeTextTaken: {
    color: colors.success,
  },
  pendingBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    marginTop: 2,
  },
  pendingBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.danger,
  },
  takenBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: "rgba(52, 211, 153, 0.18)",
    marginTop: 2,
  },
  takenBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.success,
  },

  /* Botones de acción */
  takeActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  takeActionButtonPending: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: colors.dangerBorder,
  },
  takeActionButtonTaken: {
    backgroundColor: "rgba(52, 211, 153, 0.2)",
    borderColor: colors.successBorder,
  },
  takeActionButtonDisabled: {
    opacity: 0.6,
  },
  takeActionTextPending: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.danger,
  },
  takeActionTextTaken: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.success,
  },

  /* Tarjeta de todas las dosis al día */
  allDoneCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "rgba(52, 211, 153, 0.08)",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
    padding: spacing.lg,
  },
  allDoneIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52, 211, 153, 0.16)",
  },
  allDoneInfo: { flex: 1, gap: 2 },
  allDoneTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.success,
  },
  allDoneSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },

  /* Lista de Medicamentos */
  list: { gap: spacing.sm },
  medCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    overflow: "hidden",
  },
  medCardPending: {
    borderColor: colors.dangerBorder,
  },
  medCardTaken: {
    borderColor: colors.successBorder,
  },
  medCardMainPressable: {
    padding: spacing.md,
  },
  medCardPressed: { backgroundColor: colors.bgCardHover },
  medCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  medCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexShrink: 1,
  },
  medCardName: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary },
  medCardDosage: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  medCardFrequency: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  medCardDesc: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 4 },

  medCardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(52, 211, 153, 0.15)",
  },

  undoPillButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: "rgba(245, 158, 11, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  undoPillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.amber,
  },

  pendingBadgeSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  pendingBadgeSmallText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.danger,
  },
  takenBadgeSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  takenBadgeSmallText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.success,
  },
});
