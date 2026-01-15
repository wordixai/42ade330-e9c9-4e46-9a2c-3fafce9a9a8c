export interface CheckIn {
  id: string;
  userId: string;
  timestamp: number;
  checkedInAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  email: string;
}

export type CheckInStatus = 'safe' | 'warning' | 'danger';
