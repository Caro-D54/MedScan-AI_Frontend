import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { colors, fonts, radius, spacing } from "../theme/theme";
import { BackIcon, CheckCircleIcon, ScanIcon } from "../icons/icons";

type Phase = "idle" | "captured" | "detected";

/**
 * La cámara y el permiso son reales (expo-camera). La "detección" del
 * medicamento es un mock (setTimeout) porque el backend todavía no expone
 * un endpoint de OCR/IA — ver MIGRATION_NOTES.md.
 */
export function ScannerScreen({ onBack, onOpenDetail }: { onBack: () => void; onOpenDetail: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>("idle");
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Necesitamos acceso a la cámara para escanear medicamentos.</Text>
        <Pressable onPress={requestPermission} style={styles.permissionButton} accessibilityRole="button" accessibilityLabel="Dar permiso de cámara">
          <Text style={styles.permissionButtonText}>Dar permiso</Text>
        </Pressable>
      </View>
    );
  }

  const handleCapture = async () => {
    setPhase("captured");
    await cameraRef.current?.takePictureAsync({ quality: 0.5 }).catch(() => null);
    setTimeout(() => setPhase("detected"), 1500);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={8} accessibilityRole="button" accessibilityLabel="Volver">
          <BackIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Escanear medicamento</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.frame}>
          {phase !== "detected" ? (
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
          ) : (
            <View style={styles.detectedOverlay}>
              <View style={styles.detectedBadge}>
                <CheckCircleIcon size={28} color={colors.teal} />
              </View>
              <Text style={styles.detectedTitle}>Medicamento detectado</Text>
              <Text style={styles.detectedSubtitle}>Ibuprofeno 800mg</Text>
            </View>
          )}
          {phase === "captured" ? (
            <View style={styles.scanningOverlay}>
              <Text style={styles.scanningText}>Procesando…</Text>
            </View>
          ) : null}
          {[styles.cornerTL, styles.cornerTR, styles.cornerBL, styles.cornerBR].map((cornerStyle, i) => (
            <View key={i} style={[styles.corner, cornerStyle]} />
          ))}
        </View>

        {phase === "detected" ? (
          <View style={{ width: "100%", gap: spacing.sm }}>
            <Pressable onPress={onOpenDetail} style={styles.primaryButton} accessibilityRole="button" accessibilityLabel="Ver detalle">
              <Text style={styles.primaryButtonText}>Ver detalle</Text>
            </Pressable>
            <Pressable onPress={() => setPhase("idle")} style={styles.secondaryButton} accessibilityRole="button" accessibilityLabel="Escanear de nuevo">
              <Text style={styles.secondaryButtonText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handleCapture}
            disabled={phase === "captured"}
            style={[styles.captureButton, phase === "captured" && styles.captureButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Capturar foto"
          >
            <ScanIcon size={26} />
          </Pressable>
        )}

        <Text style={styles.hint}>Reconocimiento de medicamentos con IA</Text>
      </View>
    </View>
  );
}

const CORNER = 32;

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.lg },
  permissionText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: "center" },
  permissionButton: { backgroundColor: colors.teal, borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  permissionButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.bgPrimary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg },
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
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl, gap: spacing.xl },
  frame: {
    width: "100%",
    aspectRatio: 1,
    maxWidth: 320,
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: colors.bgOuter,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.15)",
  },
  corner: { position: "absolute", width: CORNER, height: CORNER, borderColor: colors.teal },
  cornerTL: { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: radius.md },
  cornerTR: { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: radius.md },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: radius.md },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: radius.md },
  scanningOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(7,13,23,0.5)" },
  scanningText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.teal },
  detectedOverlay: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.bgOuter },
  detectedBadge: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(34,211,238,0.15)", borderWidth: 2, borderColor: colors.teal },
  detectedTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.teal },
  detectedSubtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  captureButton: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: colors.tealDim },
  captureButtonDisabled: { opacity: 0.6 },
  primaryButton: { minHeight: 52, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", backgroundColor: colors.teal },
  primaryButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.bgPrimary },
  secondaryButton: { minHeight: 52, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderSubtle },
  secondaryButtonText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textSecondary },
  hint: { fontFamily: fonts.body, fontSize: 11, color: colors.textDim, textAlign: "center" },
});
