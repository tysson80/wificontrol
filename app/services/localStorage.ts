
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  NETWORK_SETTINGS: '@parental_control:network_settings',
  TIME_LIMITS: '@parental_control:time_limits',
  USAGE_LOGS: '@parental_control:usage_logs',
  DEVICES: '@parental_control:devices',
  CONTENT_FILTERS: '@parental_control:content_filters',
};

// Types
export interface NetworkSetting {
  id: string;
  ssid: string;
  password: string;
  securityType: 'WPA2' | 'WPA3' | 'WEP' | 'Open';
  isConnected: boolean;
  lastConnected?: string;
  signalStrength?: number;
  createdAt: string;
}

export interface TimeLimit {
  id: string;
  profileName: string;
  enabled: boolean;
  dailyLimit: number;
  scheduleStart: string;
  scheduleEnd: string;
  days: string[];
  createdAt: string;
}

export interface UsageLog {
  id: string;
  timeLimitId: string;
  date: string;
  hoursUsed: number;
}

export interface Device {
  id: string;
  name: string;
  type: 'phone' | 'laptop' | 'tablet' | 'gaming' | 'tv' | 'other';
  owner: string;
  isBlocked: boolean;
  isOnline: boolean;
  ipAddress: string;
  macAddress: string;
  dataUsage: string;
  lastSeen: string;
  createdAt: string;
}

export interface ContentFilter {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  color: string;
}

// Helper function to generate unique IDs
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Network Settings
export const networkSettingsStorage = {
  async getAll(): Promise<NetworkSetting[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.NETWORK_SETTINGS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting network settings:', error);
      return [];
    }
  },

  async add(network: Omit<NetworkSetting, 'id' | 'createdAt'>): Promise<NetworkSetting> {
    try {
      const networks = await this.getAll();
      const newNetwork: NetworkSetting = {
        ...network,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      networks.unshift(newNetwork);
      await AsyncStorage.setItem(STORAGE_KEYS.NETWORK_SETTINGS, JSON.stringify(networks));
      return newNetwork;
    } catch (error) {
      console.error('Error adding network setting:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<NetworkSetting>): Promise<void> {
    try {
      const networks = await this.getAll();
      const index = networks.findIndex(n => n.id === id);
      if (index !== -1) {
        networks[index] = { ...networks[index], ...updates };
        await AsyncStorage.setItem(STORAGE_KEYS.NETWORK_SETTINGS, JSON.stringify(networks));
      }
    } catch (error) {
      console.error('Error updating network setting:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const networks = await this.getAll();
      const filtered = networks.filter(n => n.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.NETWORK_SETTINGS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting network setting:', error);
      throw error;
    }
  },

  async updateAllConnectedStatus(connectedId?: string): Promise<void> {
    try {
      const networks = await this.getAll();
      const updated = networks.map(n => ({
        ...n,
        isConnected: n.id === connectedId,
        lastConnected: n.id === connectedId ? new Date().toISOString() : n.lastConnected,
      }));
      await AsyncStorage.setItem(STORAGE_KEYS.NETWORK_SETTINGS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating connected status:', error);
      throw error;
    }
  },
};

// Time Limits
export const timeLimitsStorage = {
  async getAll(): Promise<TimeLimit[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TIME_LIMITS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting time limits:', error);
      return [];
    }
  },

  async add(limit: Omit<TimeLimit, 'id' | 'createdAt'>): Promise<TimeLimit> {
    try {
      const limits = await this.getAll();
      const newLimit: TimeLimit = {
        ...limit,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      limits.unshift(newLimit);
      await AsyncStorage.setItem(STORAGE_KEYS.TIME_LIMITS, JSON.stringify(limits));
      return newLimit;
    } catch (error) {
      console.error('Error adding time limit:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<TimeLimit>): Promise<void> {
    try {
      const limits = await this.getAll();
      const index = limits.findIndex(l => l.id === id);
      if (index !== -1) {
        limits[index] = { ...limits[index], ...updates };
        await AsyncStorage.setItem(STORAGE_KEYS.TIME_LIMITS, JSON.stringify(limits));
      }
    } catch (error) {
      console.error('Error updating time limit:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const limits = await this.getAll();
      const filtered = limits.filter(l => l.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.TIME_LIMITS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting time limit:', error);
      throw error;
    }
  },
};

// Usage Logs
export const usageLogsStorage = {
  async getAll(): Promise<UsageLog[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USAGE_LOGS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting usage logs:', error);
      return [];
    }
  },

  async getByDate(date: string): Promise<UsageLog[]> {
    try {
      const logs = await this.getAll();
      return logs.filter(log => log.date === date);
    } catch (error) {
      console.error('Error getting usage logs by date:', error);
      return [];
    }
  },

  async getByTimeLimitId(timeLimitId: string, date: string): Promise<UsageLog | undefined> {
    try {
      const logs = await this.getAll();
      return logs.find(log => log.timeLimitId === timeLimitId && log.date === date);
    } catch (error) {
      console.error('Error getting usage log:', error);
      return undefined;
    }
  },

  async add(log: Omit<UsageLog, 'id'>): Promise<UsageLog> {
    try {
      const logs = await this.getAll();
      const newLog: UsageLog = {
        ...log,
        id: generateId(),
      };
      logs.push(newLog);
      await AsyncStorage.setItem(STORAGE_KEYS.USAGE_LOGS, JSON.stringify(logs));
      return newLog;
    } catch (error) {
      console.error('Error adding usage log:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<UsageLog>): Promise<void> {
    try {
      const logs = await this.getAll();
      const index = logs.findIndex(l => l.id === id);
      if (index !== -1) {
        logs[index] = { ...logs[index], ...updates };
        await AsyncStorage.setItem(STORAGE_KEYS.USAGE_LOGS, JSON.stringify(logs));
      }
    } catch (error) {
      console.error('Error updating usage log:', error);
      throw error;
    }
  },

  async generateSampleData(): Promise<void> {
    try {
      console.log('Generating sample usage data...');
      
      const timeLimits = await timeLimitsStorage.getAll();
      if (timeLimits.length === 0) {
        console.log('No time limits found. Please create time limits first.');
        return;
      }

      const today = new Date();
      const logs: UsageLog[] = [];

      // Generate data for the last 14 days
      for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];

        // Generate usage for each time limit
        timeLimits.forEach(limit => {
          const randomUsage = Math.random() * limit.dailyLimit * 1.2; // Sometimes exceed limit
          logs.push({
            id: generateId(),
            timeLimitId: limit.id,
            date: dateString,
            hoursUsed: parseFloat(randomUsage.toFixed(2)),
          });
        });
      }

      await AsyncStorage.setItem(STORAGE_KEYS.USAGE_LOGS, JSON.stringify(logs));
      console.log(`Generated ${logs.length} sample usage logs`);
    } catch (error) {
      console.error('Error generating sample data:', error);
      throw error;
    }
  },
};

// Devices
export const devicesStorage = {
  async getAll(): Promise<Device[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DEVICES);
      if (data) {
        return JSON.parse(data);
      }
      
      // Return default devices if none exist
      const defaultDevices: Device[] = [
        {
          id: generateId(),
          name: 'iPhone أحمد',
          type: 'phone',
          owner: 'أحمد',
          isBlocked: false,
          isOnline: true,
          ipAddress: '192.168.1.10',
          macAddress: 'AA:BB:CC:DD:EE:01',
          dataUsage: '2.5 GB',
          lastSeen: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          name: 'Laptop سارة',
          type: 'laptop',
          owner: 'سارة',
          isBlocked: true,
          isOnline: false,
          ipAddress: '192.168.1.11',
          macAddress: 'AA:BB:CC:DD:EE:02',
          dataUsage: '5.2 GB',
          lastSeen: new Date(Date.now() - 3600000).toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          name: 'iPad محمد',
          type: 'tablet',
          owner: 'محمد',
          isBlocked: false,
          isOnline: true,
          ipAddress: '192.168.1.12',
          macAddress: 'AA:BB:CC:DD:EE:03',
          dataUsage: '1.8 GB',
          lastSeen: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          name: 'PlayStation 5',
          type: 'gaming',
          owner: 'أحمد',
          isBlocked: false,
          isOnline: true,
          ipAddress: '192.168.1.13',
          macAddress: 'AA:BB:CC:DD:EE:04',
          dataUsage: '12.5 GB',
          lastSeen: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          name: 'Smart TV',
          type: 'tv',
          owner: 'العائلة',
          isBlocked: false,
          isOnline: false,
          ipAddress: '192.168.1.14',
          macAddress: 'AA:BB:CC:DD:EE:05',
          dataUsage: '8.3 GB',
          lastSeen: new Date(Date.now() - 7200000).toISOString(),
          createdAt: new Date().toISOString(),
        },
      ];
      
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(defaultDevices));
      return defaultDevices;
    } catch (error) {
      console.error('Error getting devices:', error);
      return [];
    }
  },

  async add(device: Omit<Device, 'id' | 'createdAt'>): Promise<Device> {
    try {
      const devices = await this.getAll();
      const newDevice: Device = {
        ...device,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      devices.push(newDevice);
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
      return newDevice;
    } catch (error) {
      console.error('Error adding device:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Device>): Promise<void> {
    try {
      const devices = await this.getAll();
      const index = devices.findIndex(d => d.id === id);
      if (index !== -1) {
        devices[index] = { ...devices[index], ...updates };
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
      }
    } catch (error) {
      console.error('Error updating device:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const devices = await this.getAll();
      const filtered = devices.filter(d => d.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting device:', error);
      throw error;
    }
  },
};

// Content Filters
export const contentFiltersStorage = {
  async getAll(): Promise<ContentFilter[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CONTENT_FILTERS);
      if (data) {
        return JSON.parse(data);
      }
      
      // Return default filters if none exist
      const defaultFilters: ContentFilter[] = [
        {
          id: '1',
          name: 'محتوى البالغين',
          description: 'حظر المواقع والمحتوى غير المناسب للأطفال',
          icon: 'eye.slash',
          enabled: true,
          color: '#FF3B30',
        },
        {
          id: '2',
          name: 'وسائل التواصل الاجتماعي',
          description: 'حظر منصات التواصل الاجتماعي',
          icon: 'person.2.slash',
          enabled: false,
          color: '#007AFF',
        },
        {
          id: '3',
          name: 'الألعاب',
          description: 'حظر مواقع وتطبيقات الألعاب',
          icon: 'gamecontroller',
          enabled: false,
          color: '#FF9500',
        },
        {
          id: '4',
          name: 'مواقع التسوق',
          description: 'حظر مواقع التسوق والشراء الإلكتروني',
          icon: 'cart',
          enabled: false,
          color: '#34C759',
        },
        {
          id: '5',
          name: 'البث المباشر',
          description: 'حظر منصات البث المباشر والفيديو',
          icon: 'play.rectangle',
          enabled: false,
          color: '#AF52DE',
        },
        {
          id: '6',
          name: 'المقامرة',
          description: 'حظر مواقع المقامرة والرهان',
          icon: 'dice',
          enabled: true,
          color: '#FF2D55',
        },
      ];
      
      await AsyncStorage.setItem(STORAGE_KEYS.CONTENT_FILTERS, JSON.stringify(defaultFilters));
      return defaultFilters;
    } catch (error) {
      console.error('Error getting content filters:', error);
      return [];
    }
  },

  async update(id: string, updates: Partial<ContentFilter>): Promise<void> {
    try {
      const filters = await this.getAll();
      const index = filters.findIndex(f => f.id === id);
      if (index !== -1) {
        filters[index] = { ...filters[index], ...updates };
        await AsyncStorage.setItem(STORAGE_KEYS.CONTENT_FILTERS, JSON.stringify(filters));
      }
    } catch (error) {
      console.error('Error updating content filter:', error);
      throw error;
    }
  },
};

// Clear all data (for testing/reset)
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    console.log('All data cleared successfully');
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};
