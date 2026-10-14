import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NotificationManager } from '@/components/NotificationManager';

function RootNavigator() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const isAuthenticated = user !== null;

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminRoute = segments[0] === 'admin';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    } else if (isAuthenticated && inAdminRoute && user?.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, segments, user?.role]);

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="admin/index" options={{ headerShown: false }} />
        <Stack.Screen name="medication/[id]" options={{ headerShown: true, title: 'Detalle' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      {Platform.OS !== 'web' ? <NotificationManager /> : null}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </AuthProvider>
  );
}
