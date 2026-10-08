import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { router } from 'expo-router';
import HomeScreen from '../app/(tabs)/index';
import { useAuth } from '@/hooks/useAuth';
import { getMedications } from '@/services/medicaments';
import type { Medication } from '@/types';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/services/medicaments', () => ({
  getMedications: jest.fn(),
}));

jest.mock('@/services/treatmentService', () => ({
  markDoseTaken: jest.fn(),
}));

describe('HomeScreen Integration (app/(tabs)/index)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders DashboardScreen displaying user greeting and medications', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', name: 'Carolina Diaz', email: 'caro@example.com' },
      isLoading: false,
    });

    const mockMeds: Medication[] = [
      {
        id: '42',
        name: 'Paracetamol',
        dosage: '500 mg',
        dose: '500 mg',
        frequency: 'cada 8 horas',
        instructions: 'con agua',
        doseId: '10',
        nextDose: '14:00 hs',
      },
    ];
    (getMedications as jest.Mock).mockResolvedValueOnce(mockMeds);

    let component!: ReturnType<typeof renderer.create>;
    await act(async () => {
      component = renderer.create(<HomeScreen />);
    });

    const root = component.root;
    expect(root.findByProps({ children: 'Hola, Carolina Diaz' })).toBeTruthy();
    expect(root.findByProps({ children: 'Paracetamol' })).toBeTruthy();
  });

  it('navigates to /medication/[id] when a medication is tapped', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', name: 'Carolina Diaz', email: 'caro@example.com' },
      isLoading: false,
    });

    const mockMeds: Medication[] = [
      {
        id: '42',
        name: 'Paracetamol',
        dosage: '500 mg',
        dose: '500 mg',
        frequency: 'cada 8 horas',
        instructions: 'con agua',
      },
    ];
    (getMedications as jest.Mock).mockResolvedValueOnce(mockMeds);

    let component!: ReturnType<typeof renderer.create>;
    await act(async () => {
      component = renderer.create(<HomeScreen />);
    });

    const card = component.root.findByProps({ accessibilityLabel: 'Ver detalle de Paracetamol' });
    await act(async () => {
      card.props.onPress();
    });

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/medication/[id]',
      params: { id: '42' },
    });
  });
});
