import { useCallback } from 'react';
import { router } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { AdminUsersScreen } from '@/screens/AdminUsersScreen';
import { colors } from '@/theme';
import type { Medication } from '@/types';

export default function HomeScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SYSTEM';

  const handleOpenDetail = useCallback((med: Medication): void => {
    router.push({
      pathname: '/medication/[id]',
      params: { id: med.id },
    });
  }, []);

  if (isAdmin) {
    return <AdminUsersScreen showBackButton={false} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <DashboardScreen
        userName={user?.name ?? undefined}
        avatarUri={user?.avatarUri}
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
