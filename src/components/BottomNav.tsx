import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, spacing } from "../theme/theme";
import { CalendarIcon, ChartIcon, HomeIcon, ScanIcon, UserIcon } from "../icons/icons";

export type MainTab = "dashboard" | "treatments" | "progress" | "profile";

export function BottomNav({
  active,
  onNavigate,
  onScan,
}: {
  active: MainTab;
  onNavigate: (tab: MainTab) => void;
  onScan: () => void;
}) {
  return (
    <View style={styles.nav}>
      <NavBtn icon={<HomeIcon />} label="Inicio" active={active === "dashboard"} onPress={() => onNavigate("dashboard")} />
      <NavBtn icon={<CalendarIcon />} label="Horario" active={active === "treatments"} onPress={() => onNavigate("treatments")} />
      <ScanBtn onPress={onScan} />
      <NavBtn icon={<ChartIcon />} label="Progreso" active={active === "progress"} onPress={() => onNavigate("progress")} />
      <NavBtn icon={<UserIcon />} label="Perfil" active={active === "profile"} onPress={() => onNavigate("profile")} />
    </View>
  );
}

function NavBtn({ icon, label, active, onPress }: { icon: React.ReactNode; label: string; active: boolean; onPress: () => void }) {
  const color = active ? colors.teal : colors.textDim;
  return (
    <Pressable
      onPress={onPress}
      style={styles.navBtn}
      hitSlop={8}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <View style={{ opacity: active ? 1 : 0.9 }}>{icon}</View>
      <Text style={[styles.navLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

function ScanBtn({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.scanBtn}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Escanear medicamento"
    >
      <ScanIcon size={22} color="white" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "#0f1a28",
    borderTopWidth: 1,
    borderTopColor: "rgba(34,211,238,0.08)",
  },
  navBtn: { alignItems: "center", gap: 4, minWidth: 44, minHeight: 44, justifyContent: "center" },
  navLabel: { fontFamily: fonts.bodyMedium, fontSize: 10 },
  scanBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginTop: -24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.tealDim,
    shadowColor: colors.teal,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
});
