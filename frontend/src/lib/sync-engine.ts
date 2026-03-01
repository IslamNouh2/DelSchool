import axios from 'axios';
import { OfflineDB, SyncRecord } from './db';
import { api } from './api';

export class SyncEngine {
  private static isSyncing = false;
  private static retryCounts: Record<string, number> = {};

  static init() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.processQueue());
      // Initial check
      if (navigator.onLine) this.processQueue();
    }
  }

  static async processQueue() {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;

    try {
      // Get tenantId from somewhere (e.g., auth store or decoded token)
      // For this example, we'll assume we can get it. 
      // In a real app, you might iterate over all tenants or get the current one.
      const tenantId = this.getCurrentTenantId(); 
      if (!tenantId) {
        this.isSyncing = false;
        return;
      }

      const queue = await OfflineDB.getSyncQueue(tenantId);
      if (queue.length === 0) {
        this.isSyncing = false;
        return;
      }

      // Sort by timestamp
      queue.sort((a, b) => a.timestamp - b.timestamp);

      // Process in batches
      const batchSize = 10;
      const batch = queue.slice(0, batchSize);

      try {
        const response = await api.post('/sync/bulk', { operations: batch });
        await this.handleSyncResults(response.data);
      } catch (error) {
        console.error('Bulk sync failed', error);
        // Implement backoff/retry if needed
      }

    } finally {
      this.isSyncing = false;
      // If there's more, schedule another run
      if (navigator.onLine) {
        const tenantId = this.getCurrentTenantId();
        if (tenantId) {
          const remaining = await OfflineDB.getSyncQueue(tenantId);
          if (remaining.length > 0) setTimeout(() => this.processQueue(), 5000);
        }
      }
    }
  }

  private static async handleSyncResults(results: any[]) {
    for (const result of results) {
      if (result.status === 'success') {
        await OfflineDB.removeFromSyncQueue(result.operationId);
        // Optional: update local record with server data (e.g., final ID, version)
      } else if (result.conflict) {
        console.warn('Conflict detected for operation', result.operationId, result);
        // Logic for conflict resolution (e.g., notifying user or auto-merging)
        // For now, we'll keep it in queue or move to a "conflicts" store
      } else {
        console.error('Operation failed', result.operationId, result.message);
        // Handle other errors (e.g., validation)
      }
    }
  }

  private static getCurrentTenantId(): string | null {
    // This should pull from your auth state management (Zustand, Redux, or Cookies)
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/tenantId=([^;]+)/);
      return match ? match[1] : null;
    }
    return null;
  }
}
