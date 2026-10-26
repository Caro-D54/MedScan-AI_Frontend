import { useEffect, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { getProfileSync, loadUserProfile, subscribeProfileChanges } from '@/services/profileService';
import { colors } from '@/theme';

export default function TabLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SYSTEM';

  const [avatarUri, setAvatarUri] = useState<string | null>(
    () => user?.avatarUri ?? getProfileSync(user).avatarUri,
  );

  useEffect(() => {
    void loadUserProfile(user).then((loaded) => {
      setAvatarUri(loaded.avatarUri);
    });
    const unsubscribe = subscribeProfileChanges((updated) => {
      setAvatarUri(updated.avatarUri);
    });
    return () => {
      unsubscribe();
    };
  }, [user]);

  const resolvedAvatar = user?.avatarUri ?? avatarUri;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isAdmin ? 'Usuarios' : 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={isAdmin ? 'people' : 'home'} size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          href: isAdmin ? null : '/medications',
          title: 'Medicamentos',
          tabBarIcon: ({ color, size }) => <Ionicons name="medical" size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          href: isAdmin ? null : '/scan',
          title: 'Escáner',
          tabBarIcon: ({ color, size }) => <Ionicons name="camera" size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) =>
            resolvedAvatar ? (
              <Image
                source={{ uri: resolvedAvatar }}
                style={[
                  styles.tabAvatar,
                  {
                    width: size + 2,
                    height: size + 2,
                    borderRadius: (size + 2) / 2,
                    borderColor: String(color),
                  },
                ]}
              />
            ) : (
              <Ionicons name="person" size={size} color={String(color)} />
            ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabAvatar: {
    borderWidth: 1.5,
  },
});
