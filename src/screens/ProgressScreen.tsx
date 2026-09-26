import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing } from "../theme/theme";

/**
 * El backend no registra historial de tomas todavía, así que esta pantalla
 * es demostrativa (datos de ejemplo) hasta que exista ese endpoint —
 * ver MIGRATION_NOTES.md.
 */
const WEEK = [
  { day: "L", pct: 100 },
  { day: "M", pct: 67 },
  { day: "X", pct: 100 },
  { day: "J", pct: 100 },
  { day: "V", pct: 33 },
  { day: "S", pct: 67 },
  { day: "D", pct: 0 },
];

export function ProgressScreen() {
  const overall = Math.round(WEEK.reduce((a, d) => a + d.pct, 0) / WEEK.length);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Mi progreso</Text>
      <Text style={styles.subtitle}>Evolución de tratamientos (datos de ejemplo)</Text>

      <View style={styles.kpiRow}>
        <Kpi value={`${overall}%`} label="Adherencia" color={colors.teal} />
        <Kpi value="18" label="Racha (días)" color={colors.amber} />
        <Kpi value="12/14" label="Dosis semana" color={colors.success} />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Adherencia diaria</Text>
        <View style={styles.barsRow}>
          {WEEK.map((d) => (
            <View key={d.day} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: `${d.pct}%` }]} />
              </View>
              <Text style={styles.barLabel}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function Kpi({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  title: { fontFamily: fonts.display, fontSize: 18, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  kpiRow: { flexDirection: "row", gap: spacing.sm },
  kpiCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, padding: spacing.md, alignItems: "center", gap: 4 },
  kpiValue: { fontFamily: fonts.displaySemiBold, fontSize: 18 },
  kpiLabel: { fontFamily: fonts.body, fontSize: 10, color: colors.textSecondary, textAlign: "center" },
  chartCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, padding: spacing.lg, gap: spacing.md },
  chartTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textPrimary },
  barsRow: { flexDirection: "row", justifyContent: "space-between", height: 120, alignItems: "flex-end" },
  barCol: { alignItems: "center", gap: 6, flex: 1 },
  barTrack: { width: 14, height: 90, borderRadius: 7, backgroundColor: "rgba(255,255,255,0.06)", justifyContent: "flex-end", overflow: "hidden" },
  barFill: { width: "100%", backgroundColor: colors.teal, borderRadius: 7 },
  barLabel: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.textDim },
});
