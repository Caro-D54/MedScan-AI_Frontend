import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { User } from '@/types';

export interface UserProfileData {
  name: string;
  email: string;
  age: string;
  bloodType: string;
  allergies: string;
  medicalConditions: string;
  emergencyContact: string;
  avatarUri: string | null;
}

type ProfileListener = (profile: UserProfileData) => void;

const STORAGE_PREFIX = 'medscan_user_profile_v1_';
const CURRENT_KEY = `${STORAGE_PREFIX}current`;
const memoryProfiles = new Map<string, UserProfileData>();
const listeners = new Set<ProfileListener>();

function isWebStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function getStorageKey(userId?: string | null): string {
  const safeId = (userId || 'current').replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${STORAGE_PREFIX}${safeId}`;
}

export function createDefaultProfile(user?: User | null): UserProfileData {
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    age: '',
    bloodType: '',
    allergies: '',
    medicalConditions: '',
    emergencyContact: '',
    avatarUri: user?.avatarUri ?? null,
  };
}

function mergeProfile(parsed: Partial<UserProfileData>, base: UserProfileData): UserProfileData {
  return {
    name: parsed.name?.trim() ? parsed.name : base.name,
    email: parsed.email?.trim() ? parsed.email : base.email,
    age: parsed.age ?? '',
    bloodType: parsed.bloodType ?? '',
    allergies: parsed.allergies ?? '',
    medicalConditions: parsed.medicalConditions ?? '',
    emergencyContact: parsed.emergencyContact ?? '',
    avatarUri: parsed.avatarUri ?? base.avatarUri ?? null,
  };
}

/**
 * Obtiene de forma síncrona el perfil en memoria o localStorage para renderizado inmediato en toda la app.
 */
export function getProfileSync(user?: User | null): UserProfileData {
  const key = getStorageKey(user?.id);
  const base = createDefaultProfile(user);

  const cached = memoryProfiles.get(key) ?? memoryProfiles.get(CURRENT_KEY);
  if (cached) {
    return mergeProfile(cached, base);
  }

  if (isWebStorageAvailable()) {
    try {
      const raw = window.localStorage.getItem(key) ?? window.localStorage.getItem(CURRENT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserProfileData>;
        const merged = mergeProfile(parsed, base);
        memoryProfiles.set(key, merged);
        memoryProfiles.set(CURRENT_KEY, merged);
        return merged;
      }
    } catch {
      // Ignore storage access errors
    }
  }

  return base;
}

export async function loadUserProfile(user?: User | null): Promise<UserProfileData> {
  const key = getStorageKey(user?.id);
  const base = createDefaultProfile(user);

  try {
    let raw: string | null = null;
    if (isWebStorageAvailable()) {
      raw = window.localStorage.getItem(key) ?? window.localStorage.getItem(CURRENT_KEY);
    } else if (Platform.OS !== 'web') {
      raw = (await SecureStore.getItemAsync(key)) ?? (await SecureStore.getItemAsync(CURRENT_KEY));
    }

    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserProfileData>;
      const merged = mergeProfile(parsed, base);
      memoryProfiles.set(key, merged);
      memoryProfiles.set(CURRENT_KEY, merged);
      return merged;
    }
  } catch {
    // Fallback to memory or default profile
  }

  return getProfileSync(user);
}

export async function saveUserProfile(
  userId: string | undefined | null,
  profile: UserProfileData,
): Promise<UserProfileData> {
  const key = getStorageKey(userId);
  const normalized: UserProfileData = {
    name: profile.name.trim(),
    email: profile.email.trim(),
    age: profile.age.trim(),
    bloodType: profile.bloodType.trim(),
    allergies: profile.allergies.trim(),
    medicalConditions: profile.medicalConditions.trim(),
    emergencyContact: profile.emergencyContact.trim(),
    avatarUri: profile.avatarUri ?? null,
  };

  memoryProfiles.set(key, normalized);
  memoryProfiles.set(CURRENT_KEY, normalized);

  try {
    const serialized = JSON.stringify(normalized);
    if (isWebStorageAvailable()) {
      window.localStorage.setItem(key, serialized);
      window.localStorage.setItem(CURRENT_KEY, serialized);
    } else if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(key, serialized);
      await SecureStore.setItemAsync(CURRENT_KEY, serialized);
    }
  } catch {
    // Keep in-memory copy if storage quota is exceeded
  }

  notifyProfileChanged(normalized);
  return normalized;
}

/**
 * Convierte una imagen (como blob: en navegador) a Data URL compacta para que persista al recargar la página.
 */
export function toPersistentAvatarUri(uri: string): Promise<string> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(uri);
  }

  return new Promise((resolve) => {
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const maxSize = 256;
          let width = img.naturalWidth || img.width || maxSize;
          let height = img.naturalHeight || img.height || maxSize;
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(uri);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch {
          resolve(uri);
        }
      };
      img.onerror = () => resolve(uri);
      img.src = uri;
    } catch {
      resolve(uri);
    }
  });
}

export function notifyProfileChanged(profile?: UserProfileData): void {
  const snapshot = profile ?? getProfileSync(null);
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
      // Ignore listener errors
    }
  });
}

export function subscribeProfileChanges(listener: ProfileListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
