import { router } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { colors } from '@/theme';
import type { Medication } from '@/types';


export default function HomeScreen() {
  const { user } = useAuth();

  function handleOpenDetail(med: Medication): void {
    router.push({
      pathname: '/medication/[id]',
      params: { id: med.id },
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <DashboardScreen
        userName={user?.name ?? undefined}
        onOpenDetail={handleOpenDetail}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

