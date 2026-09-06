import { toMedicationDraft, validateMedicationDraft } from '../src/utils/medication';
import type { ScanResult } from '../src/services/scanService';
import type { MedicationField } from '../src/types/medication';

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
