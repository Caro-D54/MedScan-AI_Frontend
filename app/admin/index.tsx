import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import {
  getAdminMetrics,
  getAdminUsers,
  deleteAdminUser,
  type AdminMetrics,
  type PagedUsersResponse,
} from '@/services/adminService';
import type { User } from '@/types';
import { colors, fonts, radius, spacing } from '@/theme';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [usersResponse, setUsersResponse] = useState<PagedUsersResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | number | null>(null);

  // Redirección si el usuario no es ADMIN
  useEffect(() => {
    if (user && user.role !== 'SYSTEM') {
      Alert.alert('Acceso Denegado', 'Esta sección requiere permisos de Administrador.');
      router.replace('/');
    }
  }, [user]);

  const loadData = useCallback(async (search?: string) => {
    try {
      const [metricsData, usersData] = await Promise.all([
        getAdminMetrics(),
        getAdminUsers(0, 50, search),
      ]);
      setMetrics(metricsData);
      setUsersResponse(usersData);
    } catch (error) {
      console.error('Error al cargar panel de administración:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar los datos del panel de administración. Verifique su conexión y permisos.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void loadData(searchQuery);
  }, [loadData, searchQuery]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    void loadData(text);
  };

  const handleDeleteUser = (targetUser: User) => {
    const currentAdminId = user?.id ? String(user.id) : null;
    const targetId = String(targetUser.id);

    if (currentAdminId && currentAdminId === targetId) {
      Alert.alert('Operación no permitida', 'No puedes eliminar tu propia cuenta de administrador.');
      return;
    }

    const confirmAction = async () => {
      setDeletingUserId(targetUser.id);
      try {
        await deleteAdminUser(targetUser.id);
        Alert.alert('Éxito', `Usuario ${targetUser.email} eliminado correctamente.`);
        await loadData(searchQuery);
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Ocurrió un error al intentar eliminar el usuario.';
        Alert.alert('Error al eliminar', errorMsg);
      } finally {
        setDeletingUserId(null);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a "${targetUser.name || targetUser.email}"?`)) {
        void confirmAction();
      }
    } else {
      Alert.alert(
        'Confirmar eliminación',
        `¿Estás seguro de que deseas eliminar permanentemente a "${targetUser.name || targetUser.email}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => void confirmAction() },
        ]
      );
    }
  };

  const formatUptime = (seconds?: number): string => {
    if (!seconds && seconds !== 0) return '—';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando panel de administración...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Panel de Administrador</Text>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#000" />
            <Text style={styles.adminBadgeText}>SYSTEM</Text>
          </View>
        </View>
        <Pressable
          onPress={handleRefresh}
          style={styles.refreshButton}
          accessibilityRole="button"
          accessibilityLabel="Recargar datos"
        >
          <Ionicons name="reload" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Sección 1: Tarjetas de Métricas Clave */}
        <Text style={styles.sectionHeading}>Métricas del Sistema</Text>
        <View style={styles.metricsGrid}>
          {/* Card Usuarios */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: 'rgba(34, 211, 238, 0.15)' }]}>
                <Ionicons name="people" size={20} color={colors.primary} />
              </View>
              <Text style={styles.metricLabel}>Total Usuarios</Text>
            </View>
            <Text style={styles.metricValue}>{metrics?.totalUsers ?? '0'}</Text>
            <View style={styles.metricSubRow}>
              <Text style={styles.metricSubText}>
                Pacientes: <Text style={styles.metricSubBold}>{metrics?.regularUsers ?? 0}</Text>
              </Text>
              <Text style={styles.metricSubText}>
                Admins: <Text style={styles.metricSubBold}>{metrics?.adminUsers ?? 0}</Text>
              </Text>
            </View>
          </View>

          {/* Card Altas Recientes */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                <Ionicons name="person-add" size={20} color={colors.success} />
              </View>
              <Text style={styles.metricLabel}>Nuevas Altas</Text>
            </View>
            <Text style={styles.metricValue}>{metrics?.newUsersLast7Days ?? '0'}</Text>
            <View style={styles.metricSubRow}>
              <Text style={styles.metricSubText}>Últimos 7 días: {metrics?.newUsersLast7Days ?? 0}</Text>
              <Text style={styles.metricSubText}>Últimos 30 días: {metrics?.newUsersLast30Days ?? 0}</Text>
            </View>
          </View>

          {/* Card Actividad Clínica */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
                <Ionicons name="medkit" size={20} color={colors.purple} />
              </View>
              <Text style={styles.metricLabel}>Tratamientos & Dosis</Text>
            </View>
            <Text style={styles.metricValue}>{metrics?.totalTreatments ?? '0'}</Text>
            <View style={styles.metricSubRow}>
              <Text style={styles.metricSubText}>Medicamentos: {metrics?.totalMedications ?? 0}</Text>
              <Text style={styles.metricSubText}>Dosis: {metrics?.totalDoses ?? 0}</Text>
            </View>
          </View>

          {/* Card Servidor / Uptime */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="server" size={20} color={colors.amber} />
              </View>
              <Text style={styles.metricLabel}>Uptime del Servidor</Text>
            </View>
            <Text style={[styles.metricValue, { fontSize: 20, marginTop: 4 }]}>
              {formatUptime(metrics?.uptimeSeconds)}
            </Text>
            <Text style={styles.metricSubText}>Instancia activa Spring Boot 3</Text>
          </View>
        </View>

        {/* Sección 2: Gestión de Usuarios */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Gestión de Usuarios</Text>
          <Text style={styles.badgeCount}>
            {usersResponse?.totalElements ?? usersResponse?.content?.length ?? 0} registrados
          </Text>
        </View>

        {/* Barra de Búsqueda */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textDim} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar usuario por nombre o email..."
            placeholderTextColor={colors.textDim}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => handleSearch('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={18} color={colors.textDim} />
            </Pressable>
          ) : null}
        </View>

        {/* Listado de Usuarios */}
        {usersResponse?.content && usersResponse.content.length > 0 ? (
          <View style={styles.userList}>
            {usersResponse.content.map((u) => {
              const isCurrentUser = String(user?.id) === String(u.id);
              const isAdmin = u.role === 'SYSTEM';

              return (
                <View key={u.id} style={styles.userCard}>
                  <View style={styles.userInfoCol}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userNameText}>{u.name || 'Sin nombre'}</Text>
                      <View
                        style={[
                          styles.roleBadge,
                          isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeUser,
                        ]}
                      >
                        <Text
                          style={[
                            styles.roleBadgeText,
                            isAdmin ? styles.roleBadgeTextAdmin : styles.roleBadgeTextUser,
                          ]}
                        >
                          {isAdmin ? 'SYSTEM' : 'USUARIO'}
                        </Text>
                      </View>
                      {isCurrentUser ? (
                        <Text style={styles.youBadgeText}>(Tú)</Text>
                      ) : null}
                    </View>
                    <Text style={styles.userEmailText}>{u.email}</Text>
                    <Text style={styles.userIdText}>ID: #{u.id}</Text>
                  </View>

                  {/* Botón de eliminar (exclusivo para usuarios que no sean la propia cuenta) */}
                  {!isCurrentUser ? (
                    <Pressable
                      style={({ pressed }) => [
                        styles.deleteButton,
                        pressed && styles.deleteButtonPressed,
                        deletingUserId === u.id && styles.deleteButtonDisabled,
                      ]}
                      onPress={() => handleDeleteUser(u)}
                      disabled={deletingUserId === u.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar usuario ${u.email}`}
                    >
                      {deletingUserId === u.id ? (
                        <ActivityIndicator size="small" color={colors.danger} />
                      ) : (
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                      )}
                    </Pressable>
                  ) : (
                    <View style={styles.protectedBadge}>
                      <Ionicons name="lock-closed" size={14} color={colors.textDim} />
                      <Text style={styles.protectedText}>Protegido</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={44} color={colors.textDim} />
            <Text style={styles.emptyText}>No se encontraron usuarios coincidentes</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  adminBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  badgeCount: {
    fontSize: 13,
    color: colors.textSecondary,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  metricSubRow: {
    marginTop: 6,
    gap: 2,
  },
  metricSubText: {
    fontSize: 11,
    color: colors.textDim,
  },
  metricSubBold: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  clearSearchBtn: {
    padding: 4,
  },
  userList: {
    gap: spacing.sm,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userInfoCol: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  roleBadgeAdmin: {
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  roleBadgeUser: {
    backgroundColor: colors.bgElevated,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  roleBadgeTextAdmin: {
    color: colors.primary,
  },
  roleBadgeTextUser: {
    color: colors.textSecondary,
  },
  youBadgeText: {
    fontSize: 11,
    color: colors.primary,
    fontStyle: 'italic',
  },
  userEmailText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  userIdText: {
    fontSize: 10,
    color: colors.textDim,
    marginTop: 2,
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  deleteButtonPressed: {
    opacity: 0.6,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  protectedText: {
    fontSize: 11,
    color: colors.textDim,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
