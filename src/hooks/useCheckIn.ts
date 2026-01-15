import { useState, useEffect, useCallback } from 'react';

export interface CheckInRecord {
  id: string;
  date: string;
  timestamp: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  email: string;
}

const STORAGE_KEYS = {
  CHECK_INS: 'deadyet_checkins',
  CONTACTS: 'deadyet_contacts',
};

export function useCheckIn() {
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const savedCheckIns = localStorage.getItem(STORAGE_KEYS.CHECK_INS);
    const savedContacts = localStorage.getItem(STORAGE_KEYS.CONTACTS);

    if (savedCheckIns) {
      setCheckIns(JSON.parse(savedCheckIns));
    }
    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    }
    setIsLoaded(true);
  }, []);

  // Save check-ins to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(checkIns));
    }
  }, [checkIns, isLoaded]);

  // Save contacts to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
    }
  }, [contacts, isLoaded]);

  const checkIn = useCallback(() => {
    const now = new Date();
    const newRecord: CheckInRecord = {
      id: crypto.randomUUID(),
      date: now.toISOString().split('T')[0],
      timestamp: now.getTime(),
    };
    setCheckIns(prev => [newRecord, ...prev]);
    return newRecord;
  }, []);

  const addContact = useCallback((name: string, email: string) => {
    const newContact: EmergencyContact = {
      id: crypto.randomUUID(),
      name,
      email,
    };
    setContacts(prev => [...prev, newContact]);
    return newContact;
  }, []);

  const removeContact = useCallback((id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  }, []);

  const getLastCheckIn = useCallback(() => {
    if (checkIns.length === 0) return null;
    return checkIns[0];
  }, [checkIns]);

  const getDaysSinceLastCheckIn = useCallback(() => {
    const lastCheckIn = getLastCheckIn();
    if (!lastCheckIn) return Infinity;

    const now = new Date();
    const lastDate = new Date(lastCheckIn.timestamp);
    const diffTime = now.getTime() - lastDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays;
  }, [getLastCheckIn]);

  const getStatus = useCallback((): 'safe' | 'warning' | 'danger' => {
    const days = getDaysSinceLastCheckIn();
    if (days < 1) return 'safe';
    if (days < 2) return 'warning';
    return 'danger';
  }, [getDaysSinceLastCheckIn]);

  const hasCheckedInToday = useCallback(() => {
    const lastCheckIn = getLastCheckIn();
    if (!lastCheckIn) return false;

    const today = new Date().toISOString().split('T')[0];
    return lastCheckIn.date === today;
  }, [getLastCheckIn]);

  return {
    checkIns,
    contacts,
    isLoaded,
    checkIn,
    addContact,
    removeContact,
    getLastCheckIn,
    getDaysSinceLastCheckIn,
    getStatus,
    hasCheckedInToday,
  };
}
