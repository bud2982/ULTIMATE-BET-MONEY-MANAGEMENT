/**
 * Data Synchronization Utilities
 * 
 * Gestisce la sincronizzazione tra localStorage e database server
 */

import { apiRequest } from './queryClient';

// Storage keys utilizzati dall'applicazione
export const STORAGE_KEYS = {
  // Betting sessions
  CURRENT_SESSION: 'betting_current_session',
  BETTING_STATE: 'betting_state',
  SESSIONS_CACHE: 'betting_sessions_cache',
  BETS_CACHE: 'betting_bets_cache',
  
  // Beat the Delay sessions
  BEAT_DELAY_SELECTED_SESSION: 'beat_delay_selected_session',
  BEAT_DELAY_SESSIONS_CACHE: 'beat_delay_sessions_cache',
  BEAT_DELAY_BETS_CACHE: 'beat_delay_bets_cache',
  
  // Sync metadata
  LAST_SYNC: 'last_sync_timestamp',
  PENDING_SYNC: 'pending_sync_operations'
};

// Utility functions
export const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`✅ Saved to localStorage: ${key}`);
  } catch (error) {
    console.warn('❌ Failed to save to localStorage:', error);
  }
};

export const loadFromLocalStorage = (key: string) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('❌ Failed to load from localStorage:', error);
    return null;
  }
};

export const removeFromLocalStorage = (key: string) => {
  try {
    localStorage.removeItem(key);
    console.log(`🗑️ Removed from localStorage: ${key}`);
  } catch (error) {
    console.warn('❌ Failed to remove from localStorage:', error);
  }
};

// Sync operations queue
interface PendingSyncOperation {
  id: string;
  type: 'CREATE_SESSION' | 'UPDATE_SESSION' | 'CREATE_BET' | 'CREATE_BEAT_DELAY_SESSION' | 'CREATE_BEAT_DELAY_BET';
  data: any;
  timestamp: number;
}

export class DataSyncManager {
  private static instance: DataSyncManager;
  private syncInProgress = false;

  static getInstance(): DataSyncManager {
    if (!DataSyncManager.instance) {
      DataSyncManager.instance = new DataSyncManager();
    }
    return DataSyncManager.instance;
  }

  // Add operation to sync queue
  addPendingOperation(operation: Omit<PendingSyncOperation, 'id' | 'timestamp'>) {
    const pendingOps = loadFromLocalStorage(STORAGE_KEYS.PENDING_SYNC) || [];
    const newOp: PendingSyncOperation = {
      ...operation,
      id: `${operation.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    pendingOps.push(newOp);
    saveToLocalStorage(STORAGE_KEYS.PENDING_SYNC, pendingOps);
    
    console.log(`📝 Added pending sync operation: ${newOp.type}`, newOp);
  }

  // Check if server is available
  async isServerAvailable(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        timeout: 5000 
      } as any);
      return response.ok;
    } catch (error) {
      console.warn('🔌 Server not available:', error);
      return false;
    }
  }

  // Sync pending operations with server
  async syncPendingOperations(): Promise<void> {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress, skipping...');
      return;
    }

    const isAvailable = await this.isServerAvailable();
    if (!isAvailable) {
      console.log('🔌 Server not available, skipping sync');
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 Starting sync of pending operations...');

    try {
      const pendingOps = loadFromLocalStorage(STORAGE_KEYS.PENDING_SYNC) || [];
      const successfulOps: string[] = [];

      for (const op of pendingOps) {
        try {
          await this.syncOperation(op);
          successfulOps.push(op.id);
          console.log(`✅ Synced operation: ${op.type} (${op.id})`);
        } catch (error) {
          console.warn(`❌ Failed to sync operation: ${op.type} (${op.id})`, error);
        }
      }

      // Remove successful operations
      if (successfulOps.length > 0) {
        const remainingOps = pendingOps.filter(op => !successfulOps.includes(op.id));
        saveToLocalStorage(STORAGE_KEYS.PENDING_SYNC, remainingOps);
        console.log(`🧹 Removed ${successfulOps.length} synced operations`);
      }

      // Update last sync timestamp
      saveToLocalStorage(STORAGE_KEYS.LAST_SYNC, Date.now());
      
    } catch (error) {
      console.error('❌ Sync process failed:', error);
    } finally {
      this.syncInProgress = false;
      console.log('✅ Sync process completed');
    }
  }

  // Sync individual operation
  private async syncOperation(op: PendingSyncOperation): Promise<void> {
    switch (op.type) {
      case 'CREATE_SESSION':
        await apiRequest('POST', '/api/sessions', op.data);
        break;
      
      case 'UPDATE_SESSION':
        await apiRequest('PATCH', `/api/sessions/${op.data.id}`, op.data.updates);
        break;
      
      case 'CREATE_BET':
        await apiRequest('POST', `/api/sessions/${op.data.sessionId}/bets`, op.data.bet);
        break;
      
      case 'CREATE_BEAT_DELAY_SESSION':
        await apiRequest('POST', '/api/beat-delay-sessions', op.data);
        break;
      
      case 'CREATE_BEAT_DELAY_BET':
        await apiRequest('POST', `/api/beat-delay-sessions/${op.data.sessionId}/bets`, op.data.bet);
        break;
      
      default:
        throw new Error(`Unknown operation type: ${(op as any).type}`);
    }
  }

  // Get sync status
  getSyncStatus() {
    const lastSync = loadFromLocalStorage(STORAGE_KEYS.LAST_SYNC);
    const pendingOps = loadFromLocalStorage(STORAGE_KEYS.PENDING_SYNC) || [];
    
    return {
      lastSyncTimestamp: lastSync,
      lastSyncDate: lastSync ? new Date(lastSync) : null,
      pendingOperations: pendingOps.length,
      syncInProgress: this.syncInProgress
    };
  }

  // Clear all local data (use with caution!)
  clearAllLocalData() {
    const keys = Object.values(STORAGE_KEYS);
    keys.forEach(key => {
      removeFromLocalStorage(key);
    });
    console.log('🧹 Cleared all local data');
  }

  // Export local data for backup
  exportLocalData() {
    const data: Record<string, any> = {};
    const keys = Object.values(STORAGE_KEYS);
    
    keys.forEach(key => {
      const value = loadFromLocalStorage(key);
      if (value !== null) {
        data[key] = value;
      }
    });

    return {
      exportDate: new Date().toISOString(),
      data
    };
  }

  // Import local data from backup
  importLocalData(backup: { exportDate: string; data: Record<string, any> }) {
    Object.entries(backup.data).forEach(([key, value]) => {
      saveToLocalStorage(key, value);
    });
    console.log(`📥 Imported data from backup (${backup.exportDate})`);
  }
}

// Auto-sync functionality
export const setupAutoSync = () => {
  const syncManager = DataSyncManager.getInstance();
  
  // Sync on page load
  window.addEventListener('load', () => {
    setTimeout(() => syncManager.syncPendingOperations(), 2000);
  });

  // Sync when coming back online
  window.addEventListener('online', () => {
    console.log('🌐 Back online, starting sync...');
    setTimeout(() => syncManager.syncPendingOperations(), 1000);
  });

  // Periodic sync every 5 minutes
  setInterval(() => {
    syncManager.syncPendingOperations();
  }, 5 * 60 * 1000);

  console.log('🔄 Auto-sync setup completed');
};

// Export singleton instance
export const dataSyncManager = DataSyncManager.getInstance();