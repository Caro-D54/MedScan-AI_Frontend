import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts, radius, spacing } from "../theme/theme";
import { CheckCircleIcon, SearchIcon } from "../icons/icons";
import { getMedications } from "../services/medicationService";
import type { Medication } from "@/types";

/**
 * Adaptación de diseño (/design-taste-frontend): el original en Figma Make
 * usa un timeline en zigzag (tarjetas alternadas izquierda/derecha). En una
 * pantalla angosta de teléfono eso reduce el ancho útil de cada tarjeta a la
 * mitad — acá se prioriza legibilidad con una lista vertical de una sola
 * columna, manteniendo el mismo lenguaje visual (punto de tiempo + tarjeta).
 *
 * El horario en sí (08:00, 12:00, etc.) es de ejemplo: el backend todavía no
 * tiene un campo de horario real por medicamento.
 */
const DEMO_TIMES = ["08:00", "12:00", "20:00"];

export function TreatmentsScreen() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [takenIds, setTakenIds] = useState<string[]>([]);

  useEffect(() => {
    getMedications()
      .then(setMeds)
      .finally(() => setLoading(false));
  }, []);

  const filtered = meds.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
  const toggle = (id: string) =>
    setTakenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Horario de hoy</Text>

      <View style={styles.searchBox}>
        <SearchIcon />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar medicamento…"
          placeholderTextColor={colors.textDim}
          style={styles.searchInput}
          accessibilityLabel="Buscar medicamento"
        />
      </View>

      <View style={styles.list}>
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>No hay medicamentos que coincidan.</Text>
        ) : (
          filtered.map((med, i) => {
            const taken = takenIds.includes(med.id);
            return (
              <Pressable
                key={med.id}
                onPress={() => toggle(med.id)}
                style={[styles.row, taken && styles.rowTaken]}
                accessibilityRole="button"
                accessibilityLabel={`${med.name}, ${taken ? "tomado" : "pendiente"}`}
              >
                <Text style={styles.rowTime}>{DEMO_TIMES[i % DEMO_TIMES.length]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{med.name}</Text>
                  {med.withFood ? <Text style={styles.rowMeta}>Con comida</Text> : null}
                </View>
                <CheckCircleIcon size={20} color={taken ? colors.teal : colors.textDim} />
              </Pressable>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  title: { fontFamily: fonts.display, fontSize: 18, color: colors.textPrimary },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.textPrimary },
  list: { gap: spacing.sm },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing.xl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    minHeight: 56,
  },
  rowTaken: { backgroundColor: "rgba(34,211,238,0.06)", borderColor: "rgba(34,211,238,0.15)" },
  rowTime: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.teal, width: 44 },
  rowName: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  rowMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.textDim, marginTop: 2 },
});
