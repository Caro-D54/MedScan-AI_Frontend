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

interface AdminUsersScreenProps {
  showBackButton?: boolean;
}

export function AdminUsersScreen({ showBackButton = false }: AdminUsersScreenProps) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [usersResponse, setUsersResponse] = useState<PagedUsersResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'logged_in'>('all');
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

  const loadData = useCallback(async (search?: string, filterLoggedIn?: boolean) => {
    try {
      const [metricsData, usersData] = await Promise.all([
        getAdminMetrics(),
        getAdminUsers(0, 50, search, filterLoggedIn),
      ]);
      setMetrics(metricsData);
      setUsersResponse(usersData);
    } catch (error) {
      console.error('Error al cargar panel de administración:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar los datos de usuarios. Verifique su conexión y permisos.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData(searchQuery, activeTab === 'logged_in');
  }, [loadData, activeTab]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void loadData(searchQuery, activeTab === 'logged_in');
  }, [loadData, searchQuery, activeTab]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    void loadData(text, activeTab === 'logged_in');
  };

  const handleTabChange = (tab: 'all' | 'logged_in') => {
    setActiveTab(tab);
    setIsLoading(true);
    void loadData(searchQuery, tab === 'logged_in');
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
        await loadData(searchQuery, activeTab === 'logged_in');
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
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando panel de usuarios...</Text>
      </View>
    );
  }

  const loggedInCount = metrics?.loggedInUsers ?? usersResponse?.content.filter((u) => u.isLoggedIn).length ?? 0;
  const totalUsersCount = metrics?.totalUsers ?? usersResponse?.totalElements ?? usersResponse?.content.length ?? 0;

  return (
    <View style={styles.screenContainer}>
      {/* Header */}
      <View style={styles.header}>
        {showBackButton ? (
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
        ) : null}
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Panel de Usuarios</Text>
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
        {/* Sección 1: Tarjetas de Métricas de Usuarios y Sesiones */}
        <Text style={styles.sectionHeading}>Métricas de Usuarios</Text>
        <View style={styles.metricsGrid}>
          {/* Card Usuarios Registrados */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: 'rgba(34, 211, 238, 0.15)' }]}>
                <Ionicons name="people" size={20} color={colors.primary} />
              </View>
              <Text style={styles.metricLabel}>Total Registrados</Text>
            </View>
            <Text style={styles.metricValue}>{totalUsersCount}</Text>
            <View style={styles.metricSubRow}>
              <Text style={styles.metricSubText}>
                Pacientes: <Text style={styles.metricSubBold}>{metrics?.regularUsers ?? 0}</Text>
              </Text>
              <Text style={styles.metricSubText}>
                Admins: <Text style={styles.metricSubBold}>{metrics?.adminUsers ?? 0}</Text>
              </Text>
            </View>
          </View>

          {/* Card Usuarios Logeados / Activos */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                <Ionicons name="radio" size={20} color={colors.success} />
              </View>
              <Text style={styles.metricLabel}>Usuarios Logeados</Text>
            </View>
            <View style={styles.onlineCountRow}>
              <View style={styles.pulseDot} />
              <Text style={[styles.metricValue, { color: colors.success }]}>{loggedInCount}</Text>
            </View>
            <Text style={styles.metricSubText}>Con sesión activa en la app</Text>
          </View>

          {/* Card Nuevas Altas */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
                <Ionicons name="person-add" size={20} color={colors.purple} />
              </View>
              <Text style={styles.metricLabel}>Nuevas Altas</Text>
            </View>
            <Text style={styles.metricValue}>{metrics?.newUsersLast7Days ?? '0'}</Text>
            <View style={styles.metricSubRow}>
              <Text style={styles.metricSubText}>Últimos 7 días: {metrics?.newUsersLast7Days ?? 0}</Text>
            </View>
          </View>

          {/* Card Servidor / Uptime */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardHeader}>
              <View style={[styles.metricIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="server" size={20} color={colors.amber} />
              </View>
              <Text style={styles.metricLabel}>Uptime Servidor</Text>
            </View>
            <Text style={[styles.metricValue, { fontSize: 20, marginTop: 4 }]}>
              {formatUptime(metrics?.uptimeSeconds)}
            </Text>
            <Text style={styles.metricSubText}>Backend Spring Boot activo</Text>
          </View>
        </View>

        {/* Sección 2: Gestión y Listado de Usuarios */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Usuarios del Sistema</Text>
          <Text style={styles.badgeCount}>
            {usersResponse?.totalElements ?? usersResponse?.content?.length ?? 0}
          </Text>
        </View>

        {/* Filtros por pestaña: Todos vs Logeados */}
        <View style={styles.tabButtonsContainer}>
          <Pressable
            style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
            onPress={() => handleTabChange('all')}
          >
            <Ionicons
              name="people-outline"
              size={16}
              color={activeTab === 'all' ? '#000' : colors.textSecondary}
            />
            <Text style={[styles.tabButtonText, activeTab === 'all' && styles.tabButtonTextActive]}>
              Todos los registrados
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'logged_in' && styles.tabButtonActive]}
            onPress={() => handleTabChange('logged_in')}
          >
            <View style={styles.onlineIndicatorSmall} />
            <Text style={[styles.tabButtonText, activeTab === 'logged_in' && styles.tabButtonTextActive]}>
              Usuarios logeados
            </Text>
          </Pressable>
        </View>

        {/* Barra de Búsqueda */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textDim} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o correo..."
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
              const isUserLoggedIn = Boolean(u.isLoggedIn);
              const userInitial = (u.name?.trim() || u.email || 'U').charAt(0).toUpperCase();

              return (
                <View key={u.id} style={styles.userCard}>
                  {/* Avatar con indicador de conexión */}
                  <View style={styles.avatarContainer}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>{userInitial}</Text>
                    </View>
                    {isUserLoggedIn ? <View style={styles.onlineBadgeDot} /> : null}
                  </View>

                  <View style={styles.userInfoCol}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userNameText} numberOfLines={1}>
                        {u.name || 'Sin nombre'}
                      </Text>
                      {isCurrentUser ? (
                        <Text style={styles.youBadgeText}>(Tú)</Text>
                      ) : null}
                    </View>

                    <Text style={styles.userEmailText} numberOfLines={1}>
                      {u.email}
                    </Text>

                    <View style={styles.userMetaRow}>
                      {/* Badge de Rol */}
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
                          {isAdmin ? 'ADMIN' : 'PACIENTE'}
                        </Text>
                      </View>

                      {/* Estado de Sesión */}
                      <View
                        style={[
                          styles.sessionStatusPill,
                          isUserLoggedIn ? styles.sessionStatusPillOnline : styles.sessionStatusPillOffline,
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: isUserLoggedIn ? colors.success : colors.textDim },
                          ]}
                        />
                        <Text
                          style={[
                            styles.sessionStatusText,
                            { color: isUserLoggedIn ? colors.success : colors.textSecondary },
                          ]}
                        >
                          {isUserLoggedIn ? 'Logeado' : 'Desconectado'}
                        </Text>
                      </View>
                    </View>
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
                      <Ionicons name="shield" size={14} color={colors.primary} />
                      <Text style={styles.protectedText}>Actual</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textDim} />
            <Text style={styles.emptyTitle}>No hay usuarios coincidentes</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'logged_in'
                ? 'Ningún usuario tiene sesión activa en este momento.'
                : 'No se encontraron usuarios registrados con el término de búsqueda.'}
            </Text>
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
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 80,
  },
  sectionHeading: {
    fontFamily: fonts.display,
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  badgeCount: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.primary,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  metricValue: {
    fontFamily: fonts.display,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginVertical: 4,
  },
  onlineCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  metricSubRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 2,
  },
  metricSubText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textDim,
  },
  metricSubBold: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  tabButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  onlineIndicatorSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  clearSearchBtn: {
    padding: spacing.xs,
  },
  userList: {
    gap: spacing.sm,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  userAvatarText: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  onlineBadgeDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.bgCard,
  },
  userInfoCol: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  userNameText: {
    fontFamily: fonts.display,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  youBadgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.primary,
  },
  userEmailText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 6,
  },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  roleBadgeAdmin: {
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  roleBadgeUser: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  roleBadgeTextAdmin: {
    color: colors.primary,
  },
  roleBadgeTextUser: {
    color: colors.textDim,
  },
  sessionStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  sessionStatusPillOnline: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
  },
  sessionStatusPillOffline: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sessionStatusText: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '500',
  },
  deleteButton: {
    padding: spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
    borderRadius: radius.sm,
  },
  protectedText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
