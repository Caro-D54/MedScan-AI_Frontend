import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing } from "../theme/theme";
import { useAuth } from "@/hooks/useAuth";

export function ProfileScreen() {
  const { user, logout } = useAuth();

  const displayName = user?.name || "Usuario";
  const displayEmail = user?.email || "";
  const displayRole = user?.role || "USER";
  const initial = displayName.charAt(0).toUpperCase() || "U";

  return (
    <View style={styles.root}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={styles.name}>{displayName}</Text>
      <Text style={styles.email}>{displayEmail}</Text>

      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>ROL: {displayRole}</Text>
      </View>

      <Pressable onPress={logout} style={styles.logoutButton} accessibilityRole="button" accessibilityLabel="Cerrar sesión">
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.xl },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", backgroundColor: colors.teal, marginBottom: spacing.md },
  avatarText: { fontFamily: fonts.display, fontSize: 26, color: colors.bgPrimary },
  name: { fontFamily: fonts.displaySemiBold, fontSize: 18, color: colors.textPrimary },
  email: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  roleBadge: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.tealMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.teal,
    letterSpacing: 0.5,
  },
  logoutButton: { marginTop: spacing.xl, minHeight: 48, paddingHorizontal: spacing.xl, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderSubtle },
  logoutText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.amber },
});
