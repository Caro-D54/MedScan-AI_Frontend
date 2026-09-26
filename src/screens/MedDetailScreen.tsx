import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing } from "../theme/theme";
import { BackIcon, ClockIcon, FoodIcon, WarningIcon, WaterIcon } from "../icons/icons";
import type { Medication } from "../services/medicationTypes";

export function MedDetailScreen({ med, onBack }: { med: Medication; onBack: () => void }) {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8} accessibilityRole="button" accessibilityLabel="Volver">
            <BackIcon />
          </Pressable>
          <Text style={styles.headerTitle}>MedScan AI</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>{med.name.slice(0, 3).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.medName}>{med.name}</Text>
              <Text style={styles.medType}>{med.type}</Text>
              {med.dose ? (
                <View style={styles.doseBadge}>
                  <Text style={styles.doseBadgeText}>{med.dose}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.metaRow}>
            <MetaItem label="Frecuencia" value={med.frequency} />
            <MetaItem label="Duración" value={med.duration} />
          </View>
        </View>

        {med.interaction ? (
          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <WarningIcon />
              <Text style={styles.warningTitle}>Interacción detectada</Text>
            </View>
            <Text style={styles.warningBody}>{med.interaction}</Text>
            {med.interactionDetail ? (
              <View style={styles.recommendationBox}>
                <Text style={styles.recommendationLabel}>Recomendación</Text>
                <Text style={styles.warningBody}>{med.interactionDetail}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.guideSection}>
          <Text style={styles.guideTitle}>Guía de administración</Text>
          <View style={{ gap: spacing.sm }}>
            {med.withFood ? (
              <GuideItem icon={<FoodIcon />} title="Tomar después de comer" desc="No tomar en ayunas para evitar irritación." />
            ) : null}
            {med.withWater ? (
              <GuideItem icon={<WaterIcon />} title="Vaso lleno de agua" desc="Tragar entero con al menos 200ml de agua." />
            ) : null}
            <GuideItem icon={<ClockIcon size={14} />} title={med.frequency} desc="Configurá un recordatorio para no perder ninguna toma." />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={onBack} style={styles.secondaryButton} accessibilityRole="button" accessibilityLabel="Descartar">
          <Text style={styles.secondaryButtonText}>Descartar</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} accessibilityRole="button" accessibilityLabel="Añadir al horario">
          <Text style={styles.primaryButtonText}>Añadir al horario</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.metaLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function GuideItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <View style={styles.guideItem}>
      <View style={styles.guideIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.guideItemTitle}>{title}</Text>
        <Text style={styles.guideItemDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
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
  headerTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary },
  infoCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, padding: spacing.lg, gap: spacing.lg },
  infoRow: { flexDirection: "row", gap: spacing.md },
  pillBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.15)",
  },
  pillBadgeText: { fontFamily: fonts.bodySemiBold, fontSize: 10, color: colors.teal },
  medName: { fontFamily: fonts.displaySemiBold, fontSize: 17, color: colors.textPrimary },
  medType: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.sm },
  doseBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: "rgba(34,211,238,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.2)",
  },
  doseBadgeText: { fontFamily: fonts.bodySemiBold, fontSize: 10, color: colors.teal },
  metaRow: { flexDirection: "row", gap: spacing.lg },
  metaLabel: { fontFamily: fonts.bodySemiBold, fontSize: 9, letterSpacing: 1, color: colors.textDim, marginBottom: 4 },
  metaValue: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textPrimary },
  warningCard: { backgroundColor: "rgba(245,158,11,0.08)", borderRadius: radius.lg, borderWidth: 1, borderColor: "rgba(245,158,11,0.25)", padding: spacing.lg, gap: spacing.sm },
  warningHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  warningTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.amber },
  warningBody: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: "#d4a843" },
  recommendationBox: { backgroundColor: "rgba(245,158,11,0.08)", borderRadius: radius.md, borderWidth: 1, borderColor: "rgba(245,158,11,0.15)", padding: spacing.md, gap: 4 },
  recommendationLabel: { fontFamily: fonts.bodySemiBold, fontSize: 9, letterSpacing: 1, color: colors.amber, textTransform: "uppercase" },
  guideSection: { gap: spacing.sm },
  guideTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  guideItem: { flexDirection: "row", gap: spacing.md, backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle, padding: spacing.md },
  guideIcon: { width: 32, height: 32, borderRadius: radius.md, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(34,211,238,0.1)" },
  guideItemTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textPrimary },
  guideItemDesc: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  footer: { flexDirection: "row", gap: spacing.md, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  secondaryButton: { flex: 1, minHeight: 48, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderSubtle },
  secondaryButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textSecondary },
  primaryButton: { flex: 1, minHeight: 48, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(34,211,238,0.1)", borderWidth: 1, borderColor: "rgba(34,211,238,0.25)" },
  primaryButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.teal },
});
