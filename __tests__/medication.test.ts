import { toMedicationDraft, validateMedicationDraft, filterMedicationsByQuery } from '../src/utils/medication';
import type { ScanResult } from '../src/services/scanService';
import type { MedicationField } from '../src/types/medication';
import type { Medication } from '../src/types';

const medications: Medication[] = [
  { id: '1', name: 'Paracetamol', dosage: '500 mg', frequency: 'Cada 8 horas', instructions: 'Con agua' },
  { id: '2', name: 'Ibuprofeno', dosage: '200 mg', frequency: 'Cada 6 horas', instructions: 'Tras comer' },
  { id: '3', name: 'Amoxicilina', dosage: '875 mg', frequency: 'Cada 12 horas', instructions: 'Con comida' },
];

describe('filterMedicationsByQuery', () => {
  it('returns all medications for an empty query', () => {
    expect(filterMedicationsByQuery(medications, '')).toEqual(medications);
  });

  it('filters by name case-insensitively', () => {
    expect(filterMedicationsByQuery(medications, 'PARACETAMOL')).toEqual([medications[0]]);
  });

  it('matches partial names', () => {
    expect(filterMedicationsByQuery(medications, 'ibu')).toEqual([medications[1]]);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterMedicationsByQuery(medications, 'vitamina')).toEqual([]);
  });

  it('does not mutate the original list', () => {
    filterMedicationsByQuery(medications, 'amoxi');
    expect(medications).toHaveLength(3);
  });
});

describe('toMedicationDraft', () => {
  it('maps all detected fields to the draft', () => {
    const scanResult: ScanResult = {
      medication: 'Paracetamol',
      dosage: '500 mg',
      frequency: 'Cada 8 horas',
      instructions: 'Tomar con agua',
    };

    expect(toMedicationDraft(scanResult)).toEqual({
      name: 'Paracetamol',
      dosage: '500 mg',
      frequency: 'Cada 8 horas',
      instructions: 'Tomar con agua',
    });
  });

  it('uses empty strings for missing optional fields', () => {
    expect(toMedicationDraft({ medication: 'Ibuprofeno' })).toEqual({
      name: 'Ibuprofeno',
      dosage: '',
      frequency: '',
      instructions: '',
    });
  });
});

describe('validateMedicationDraft', () => {
  it('returns no errors for a valid draft', () => {
    const draft = { name: 'Paracetamol', dosage: '500 mg', frequency: 'Cada 8 h', instructions: 'Con agua' };
    expect(validateMedicationDraft(draft)).toEqual({});
  });

  it('returns a name error when name is empty', () => {
    const result = validateMedicationDraft({ name: '', dosage: '', frequency: '', instructions: '' });
    expect(result.name).toBeTruthy();
  });

  it('returns a name error when name is only spaces', () => {
    const result = validateMedicationDraft({ name: '   ', dosage: '', frequency: '', instructions: '' });
    expect(result.name).toBeTruthy();
  });

  it('only marks the name field as invalid', () => {
    const result = validateMedicationDraft({ name: '', dosage: '', frequency: '', instructions: '' });
    const invalidFields = (Object.keys(result) as MedicationField[]).filter(
      (field) => result[field],
    );
    expect(invalidFields).toEqual(['name']);
  });
});
