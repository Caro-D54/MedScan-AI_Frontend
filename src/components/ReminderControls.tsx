import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors } from '@/theme';

interface ReminderControlsProps {
  isEnabled: boolean;
  scheduledHours: number[];
  canSchedule: boolean;
  isToggling: boolean;
  onToggle: (enabled: boolean) => void;
}

export function ReminderControls({
  isEnabled,
  scheduledHours,
  canSchedule,
  isToggling,
  onToggle,
}: ReminderControlsProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.summary}>
          <Text style={styles.title}>Recordatorios</Text>
          <Text style={styles.subtitle}>{describeStatus(isEnabled, scheduledHours, canSchedule)}</Text>
        </View>

        <Switch
          value={isEnabled}
          onValueChange={onToggle}
          disabled={isToggling || (!canSchedule && !isEnabled)}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>

      {isEnabled ? <Text style={styles.hours}>{formatReminderHours(scheduledHours)}</Text> : null}
    </View>
  );
}

function describeStatus(isEnabled: boolean, scheduledHours: number[], canSchedule: boolean): string {
  if (isEnabled) {
    return 'Activados. Sonarán todos los días:';
  }

  if (!canSchedule) {
    return 'No se reconoce la frecuencia para programarlos.';
  }

  return 'Desactivados. Activá para recibir avisos de toma.';
}

function formatReminderHours(hours: number[]): string {
  return hours.map((hour) => `${hour}:00`).join(' · ');
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summary: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  hours: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 10,
    fontWeight: '600',
  },
});