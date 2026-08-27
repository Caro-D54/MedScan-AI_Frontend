export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
}

export interface Treatment {
  id: string;
  medication: Medication;
  startDate: string;
  endDate?: string;
  active: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export type RootStackParamList = {
  '(tabs)': undefined;
  '+not-found': undefined;
};

export type TabParamList = {
  index: undefined;
  scan: undefined;
  treatments: undefined;
};
