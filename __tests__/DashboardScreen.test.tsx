import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert } from 'react-native';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { getMedications } from '@/services/medicaments';
import { markDoseTaken } from '@/services/treatmentService';
import type { Medication } from '@/types';

jest.mock('@/services/medicaments', () => ({
  getMedications: jest.fn(),
}));

jest.mock('@/services/treatmentService', () => ({
  markDoseTaken: jest.fn(),
}));

describe('DashboardScreen (TDD)', () => {
  const onOpenDetail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders loading indicator initially then displays medications', async () => {
    const mockMeds: Medication[] = [
      {
        id: '1',
        name: 'Amoxicilina',
        dosage: '500 mg',
        dose: '500 mg',
        frequency: 'cada 8 horas',
        instructions: 'con comida',
        doseId: '101',
        nextDose: '08:00 hs',
        status: 'verified',
      },
    ];

    (getMedications as jest.Mock).mockResolvedValueOnce(mockMeds);

    let component!: ReturnType<typeof renderer.create>;
    await act(async () => {
      component = renderer.create(<DashboardScreen onOpenDetail={onOpenDetail} />);
    });

    const root = component.root;
    expect(root.findByProps({ children: 'Amoxicilina' })).toBeTruthy();
    expect(root.findByProps({ children: '08:00 hs' })).toBeTruthy();
  });

  it('calls markDoseTaken with doseId when "Tomar ahora" is pressed', async () => {
    const mockMeds: Medication[] = [
      {
        id: '1',
        name: 'Ibuprofeno',
        dosage: '400 mg',
        dose: '400 mg',
        frequency: 'cada 6 horas',
        instructions: '',
        doseId: '202',
        nextDose: '12:00 hs',
      },
    ];

    (getMedications as jest.Mock).mockResolvedValue(mockMeds);
    (markDoseTaken as jest.Mock).mockResolvedValueOnce({ id: 202, status: 'TAKEN' });

    let component!: ReturnType<typeof renderer.create>;
    await act(async () => {
      component = renderer.create(<DashboardScreen onOpenDetail={onOpenDetail} />);
    });

    const takeNowButton = component.root.findByProps({ accessibilityLabel: 'Tomar ahora' });

    await act(async () => {
      takeNowButton.props.onPress();
    });

    expect(markDoseTaken).toHaveBeenCalledWith('202');
    expect(Alert.alert).toHaveBeenCalledWith(
      'Toma registrada',
      'Registraste la toma de Ibuprofeno.',
    );
  });
});
