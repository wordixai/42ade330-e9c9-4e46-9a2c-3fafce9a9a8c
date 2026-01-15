import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
  USER_ID: 'deadyet_user_id',
};

// 生成设备 ID
function generateDeviceId(): string {
  return 'user_' + Math.random().toString(36).substring(2, 15);
}

// 获取或创建设备 ID
function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(STORAGE_KEYS.USER_ID, deviceId);
  }
  return deviceId;
}

export function useCheckIn() {
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);

  // Load data from localStorage or Supabase
  useEffect(() => {
    async function initialize() {
      const deviceId = getOrCreateDeviceId();

      if (isSupabaseConfigured() && supabase) {
        try {
          // 获取或创建用户
          let { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('device_id', deviceId)
            .single();

          if (!user) {
            const { data: newUser, error } = await supabase
              .from('users')
              .insert({ device_id: deviceId })
              .select('id')
              .single();

            if (error) throw error;
            user = newUser;
          }

          if (user) {
            setSupabaseUserId(user.id);

            // 加载签到记录
            const { data: checkInsData } = await supabase
              .from('check_ins')
              .select('*')
              .eq('user_id', user.id)
              .order('checked_in_at', { ascending: false });

            if (checkInsData) {
              setCheckIns(checkInsData.map(c => ({
                id: c.id,
                date: new Date(c.checked_in_at).toISOString().split('T')[0],
                timestamp: new Date(c.checked_in_at).getTime(),
              })));
            }

            // 加载紧急联系人
            const { data: contactsData } = await supabase
              .from('emergency_contacts')
              .select('*')
              .eq('user_id', user.id);

            if (contactsData) {
              setContacts(contactsData.map(c => ({
                id: c.id,
                name: c.name,
                email: c.email,
              })));
            }
          }
        } catch (error) {
          console.error('Supabase error, falling back to local storage:', error);
          loadFromLocalStorage();
        }
      } else {
        loadFromLocalStorage();
      }

      setIsLoaded(true);
    }

    function loadFromLocalStorage() {
      const savedCheckIns = localStorage.getItem(STORAGE_KEYS.CHECK_INS);
      const savedContacts = localStorage.getItem(STORAGE_KEYS.CONTACTS);

      if (savedCheckIns) {
        setCheckIns(JSON.parse(savedCheckIns));
      }
      if (savedContacts) {
        setContacts(JSON.parse(savedContacts));
      }
    }

    initialize();
  }, []);

  // Save check-ins to localStorage (as backup)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(checkIns));
    }
  }, [checkIns, isLoaded]);

  // Save contacts to localStorage (as backup)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
    }
  }, [contacts, isLoaded]);

  const checkIn = useCallback(async () => {
    const now = new Date();
    const newRecord: CheckInRecord = {
      id: crypto.randomUUID(),
      date: now.toISOString().split('T')[0],
      timestamp: now.getTime(),
    };

    if (isSupabaseConfigured() && supabase && supabaseUserId) {
      try {
        const { data, error } = await supabase
          .from('check_ins')
          .insert({
            user_id: supabaseUserId,
            checked_in_at: now.toISOString(),
          })
          .select('id')
          .single();

        if (error) throw error;
        if (data) {
          newRecord.id = data.id;
        }
      } catch (error) {
        console.error('Failed to save check-in to Supabase:', error);
      }
    }

    setCheckIns(prev => [newRecord, ...prev]);
    return newRecord;
  }, [supabaseUserId]);

  const addContact = useCallback(async (name: string, email: string) => {
    const newContact: EmergencyContact = {
      id: crypto.randomUUID(),
      name,
      email,
    };

    if (isSupabaseConfigured() && supabase && supabaseUserId) {
      try {
        const { data, error } = await supabase
          .from('emergency_contacts')
          .insert({
            user_id: supabaseUserId,
            name,
            email,
          })
          .select('id')
          .single();

        if (error) throw error;
        if (data) {
          newContact.id = data.id;
        }
      } catch (error) {
        console.error('Failed to save contact to Supabase:', error);
      }
    }

    setContacts(prev => [...prev, newContact]);
    return newContact;
  }, [supabaseUserId]);

  const removeContact = useCallback(async (id: string) => {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('emergency_contacts')
          .delete()
          .eq('id', id);
      } catch (error) {
        console.error('Failed to delete contact from Supabase:', error);
      }
    }

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
