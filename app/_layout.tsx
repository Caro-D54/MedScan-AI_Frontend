import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NotificationManager } from '@/components/NotificationManager';

function RootNavigator() {
  const { user, isLoading } = useAuth();
  const isAuthenticated = user !== null;

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="medication/[id]" options={{ headerShown: true, title: 'Detalle' }} />
          </>
        ) : (
          <Stack.Screen name="(auth)" />
        )}
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
