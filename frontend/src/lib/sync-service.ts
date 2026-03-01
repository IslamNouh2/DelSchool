import { SyncEngine } from './sync-engine';
import { toast } from 'sonner';

/**
 * Service to handle synchronization of offline mutations with the backend.
 * Now delegates to the hardened SyncEngine.
 */
export const syncOfflineData = async () => {
    console.log(`[SyncService] Triggering bulk sync via SyncEngine...`);
    await SyncEngine.processQueue();
};

/**
 * Initialize listeners for online/offline events.
 */
export const initSyncListeners = () => {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
        console.log('[SyncService] App is online. Triggering sync...');
        SyncEngine.processQueue();
        toast.success('Back online. Synchronizing data...');
    });

    window.addEventListener('offline', () => {
        console.log('[SyncService] App is offline.');
        toast.warning('Working offline. Changes will be saved locally and encrypted.');
    });

    // Initial check
    if (navigator.onLine) {
        SyncEngine.processQueue();
    }
};
