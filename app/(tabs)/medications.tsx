import { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, FlatList, TextInput, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MedicationListItem } from '@/components/MedicationListItem';
import { useAuth } from '@/hooks/useAuth';
import { useMedications } from '@/hooks/useMedications';
import { getProfileSync, subscribeProfileChanges } from '@/services/profileService';
import { filterMedicationsByQuery } from '@/utils/medication';
import { colors } from '@/theme';

export default function MedicationsScreen() {
  const { user } = useAuth();
  const { medications, isLoading, isRefreshing, refresh } = useMedications();
  const [query, setQuery] = useState('');
  const [profileSnapshot, setProfileSnapshot] = useState(() => getProfileSync(user));

  useEffect(() => {
    setProfileSnapshot(getProfileSync(user));
    const unsubscribe = subscribeProfileChanges((updated) => {
      setProfileSnapshot(updated);
    });
    return () => {
      unsubscribe();
    };
  }, [user]);

  const filteredMedications = useMemo(
    () => filterMedicationsByQuery(medications, query),
    [medications, query],
  );

  function openDetail(id: string): void {
    router.push(`/medication/${id}`);
  }

  const displayName = user?.name?.trim() || profileSnapshot.name?.trim() || 'Usuario';
  const initial = displayName.charAt(0).toUpperCase() || 'U';
  const resolvedAvatar = user?.avatarUri ?? profileSnapshot.avatarUri;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.topTitle}>Mis Medicamentos</Text>
        <Pressable
          style={styles.profilePill}
          onPress={() => router.push('/profile')}
          accessibilityRole="button"
          accessibilityLabel="Ir a mi perfil"
        >
          {resolvedAvatar ? (
            <Image source={{ uri: resolvedAvatar }} style={styles.headerAvatarImage} />
          ) : (
            <View style={styles.headerAvatarFallback}>
              <Text style={styles.headerAvatarInitial}>{initial}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar medicamento…"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={filteredMedications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MedicationListItem medication={item} onPress={() => openDetail(item.id)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshing={isRefreshing}
        onRefresh={refresh}
        ListEmptyComponent={<EmptyState hasQuery={query.length > 0} />}
      />
    </View>
  );
}

interface EmptyStateProps {
  hasQuery: boolean;
}

function EmptyState({ hasQuery }: EmptyStateProps) {
  const message = hasQuery ? 'No se encontraron medicamentos.' : 'Aún no guardaste medicamentos.';
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="medkit-outline" size={48} color={colors.textSecondary} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  topTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profilePill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  headerAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  headerAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
    color: colors.textPrimary,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});