type Listener = () => void;

const listeners = new Set<Listener>();
const takenMedicationIds = new Set<string>();
const STORAGE_KEY = 'medscan_taken_medications_v1';

function readFromWebStorage(): Set<string> {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          return new Set(parsed.map(String));
        }
      }
    } catch {
      // Ignore storage access errors
    }
  }
  return new Set();
}

function writeToWebStorage(ids: Set<string>): void {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
    } catch {
      // Ignore storage write errors
    }
  }
}

export function markMedicationTakenState(medicationId: string): void {
  if (!medicationId) {
    return;
  }
  const current = readFromWebStorage();
  current.forEach((id) => takenMedicationIds.add(id));
  takenMedicationIds.add(String(medicationId));
  writeToWebStorage(takenMedicationIds);
  notifyMedicationChanged();
}

export function clearMedicationTakenState(medicationId: string): void {
  if (!medicationId) {
    return;
  }
  const current = readFromWebStorage();
  current.forEach((id) => takenMedicationIds.add(id));
  takenMedicationIds.delete(String(medicationId));
  writeToWebStorage(takenMedicationIds);
  notifyMedicationChanged();
}

export function isMedicationMarkedTaken(medicationId: string): boolean {
  if (!medicationId) {
    return false;
  }
  const current = readFromWebStorage();
  return takenMedicationIds.has(String(medicationId)) || current.has(String(medicationId));
}

export function notifyMedicationChanged(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener errors
    }
  });
}

export function subscribeMedicationChanges(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
