import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing } from "../theme/theme";
import { useAuth } from "../services/AuthContext";

/**
 * El backend no tiene modelo de Usuario todavía (no hay /me ni datos de
 * perfil reales) — ver MIGRATION_NOTES.md. Placeholder funcional con logout.
 */
export function ProfileScreen() {
  const { logout } = useAuth();

  return (
    <View style={styles.root}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>A</Text>
      </View>
      <Text style={styles.name}>Alex Chen</Text>
      <Text style={styles.email}>alex@example.com</Text>

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
  logoutButton: { marginTop: spacing.xl, minHeight: 48, paddingHorizontal: spacing.xl, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderSubtle },
  logoutText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.amber },
});
