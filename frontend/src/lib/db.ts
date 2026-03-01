import { openDB, IDBPDatabase } from 'idb';
import { CryptoEngine } from './crypto';

const DB_NAME = 'DelSchoolOfflineDB';
const DB_VERSION = 1;

export interface SyncRecord {
  operationId: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'POST' | 'PATCH';
  method?: string; // Add explicit method
  url: string;    // Add url
  entity: string;
  data: any;
  payload?: any;  // Alias for data to match some usages if needed, but data is standard
  timestamp: number;
  tenantId: string;
  version?: number;
}

export class OfflineDB {
  private static db: IDBPDatabase | null = null;

  static async getDB(): Promise<IDBPDatabase> {
    if (this.db) return this.db;

    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const stores = [
          'students', 'parents', 'locals', 'classes', 'subjects', 
          'employers', 'comptes', 'fees', 'expenses', 'payments', 
          'attendance', 'timetables', 'exams', 'grads', 'events'
        ];

        stores.forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            const s = db.createObjectStore(store, { keyPath: 'id', autoIncrement: true });
            s.createIndex('tenantId', 'tenantId', { unique: false });
            s.createIndex('pendingSync', 'pendingSync', { unique: false });
          }
        });

        if (!db.objectStoreNames.contains('sync_queue')) {
          const s = db.createObjectStore('sync_queue', { keyPath: 'operationId' });
          s.createIndex('tenantId', 'tenantId', { unique: false });
          s.createIndex('timestamp', 'timestamp', { unique: false });
        }
      },
    });

    return this.db;
  }

  static async saveRecord(storeName: string, data: any, isSyncing = false): Promise<void> {
    const db = await this.getDB();
    const encryptedData = await this.encryptSensitiveFields(storeName, { ...data });
    
    await db.put(storeName, {
      ...encryptedData,
      pendingSync: !isSyncing,
      updatedAt: new Date().toISOString(),
    });
  }

  static async getRecords(storeName: string, tenantId: string): Promise<any[]> {
    const db = await this.getDB();
    const all = await db.getAllFromIndex(storeName, 'tenantId', tenantId);
    return Promise.all(all.map(r => this.decryptSensitiveFields(storeName, r)));
  }

  static async deleteRecord(storeName: string, id: any): Promise<void> {
    const db = await this.getDB();
    await db.delete(storeName, id);
  }

  static async addToSyncQueue(record: SyncRecord): Promise<void> {
    const db = await this.getDB();
    await db.put('sync_queue', record);
  }

  static async getSyncQueue(tenantId: string): Promise<SyncRecord[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('sync_queue', 'tenantId', tenantId);
  }

  static async removeFromSyncQueue(operationId: string): Promise<void> {
    const db = await this.getDB();
    await db.delete('sync_queue', operationId);
  }

  private static sensitiveFields: Record<string, string[]> = {
    students: ['phone', 'email', 'address', 'cid'],
    parents: ['fatherNumber', 'motherNumber', 'father', 'mother'],
    employers: ['phone', 'email', 'address', 'cin', 'salary'],
  };

  private static async encryptSensitiveFields(storeName: string, data: any): Promise<any> {
    const fields = this.sensitiveFields[storeName] || [];
    for (const field of fields) {
      if (data[field]) {
        data[field] = await CryptoEngine.encrypt(data[field].toString());
      }
    }
    return data;
  }

  private static async decryptSensitiveFields(storeName: string, data: any): Promise<any> {
    const fields = this.sensitiveFields[storeName] || [];
    for (const field of fields) {
      if (data[field]) {
        try {
          data[field] = await CryptoEngine.decrypt(data[field]);
        } catch (e) {
          console.error(`Failed to decrypt field ${field} in ${storeName}`, e);
        }
      }
    }
    return data;
  }

  static async clearAll(): Promise<void> {
    const db = await this.getDB();
    const stores = Array.from(db.objectStoreNames);
    const tx = db.transaction(stores, 'readwrite');
    await Promise.all(stores.map(store => tx.objectStore(store).clear()));
    await tx.done;
  }
}
