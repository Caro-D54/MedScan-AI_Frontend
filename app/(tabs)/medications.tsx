import { useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MedicationListItem } from '@/components/MedicationListItem';
import { useMedications } from '@/hooks/useMedications';
import { filterMedicationsByQuery } from '@/utils/medication';
import { colors } from '@/theme';

export default function MedicationsScreen() {
  const { medications, isLoading, isRefreshing, refresh } = useMedications();
  const [query, setQuery] = useState('');

  const filteredMedications = useMemo(
    () => filterMedicationsByQuery(medications, query),
    [medications, query],
  );

  function openDetail(id: string): void {
    router.push(`/medication/${id}`);
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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