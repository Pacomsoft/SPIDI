import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'spidi-db';
const DB_VERSION = 5;

export const STORE_CONFIGURACIONES = 'configuraciones';
export const STORE_REQUESTS = 'Requests';
export const STORE_TOKENS = 'tokens';
export const STORE_SESSIONS = 'sessions';
export const STORE_LOGIN_ATTEMPTS = 'login-attempts';

export interface IConfiguracionRecord {
  id?: number;
  key: string;
  value: string;
}

export interface IRequestRecord {
  id?: number;
  url: string;
  key: string;
  intentos: number;
  expiration: Date | null;
}

export interface ITokenRecord {
  id?: number;
  accessToken: string;
  uuid: string;
  refreshToken: string;
  expirationToken: Date;
}

export interface ISessionRecord {
  [key: string]: unknown;
}

export interface ISpidiDB {
  [STORE_CONFIGURACIONES]: {
    key: number;
    value: IConfiguracionRecord;
    indexes: { by_key: string };
  };
  [STORE_REQUESTS]: {
    key: number;
    value: IRequestRecord;
    indexes: { by_url: string };
  };
  [STORE_TOKENS]: {
    key: number;
    value: ITokenRecord;
    indexes: Record<string, never>;
  };
  [STORE_SESSIONS]: {
    key: string;
    value: ISessionRecord;
    indexes: Record<string, never>;
  };
  [STORE_LOGIN_ATTEMPTS]: {
    key: number;
    value: number;
    indexes: Record<string, never>;
  };
}

let dbPromise: Promise<IDBPDatabase<ISpidiDB>> | null = null;

export function getSpidiDb(): Promise<IDBPDatabase<ISpidiDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ISpidiDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const configStore = db.createObjectStore(STORE_CONFIGURACIONES, {
            keyPath: 'id',
            autoIncrement: true,
          });
          configStore.createIndex('by_key', 'key', { unique: true });
        }
        if (oldVersion < 2) {
          const requestStore = db.createObjectStore(STORE_REQUESTS, {
            keyPath: 'id',
            autoIncrement: true,
          });
          requestStore.createIndex('by_url', 'url', { unique: true });
        }
        if (oldVersion < 3) {
          db.createObjectStore(STORE_TOKENS, {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
        if (oldVersion < 4) {
          db.createObjectStore(STORE_SESSIONS);
        }
        if (oldVersion < 5) {
          db.createObjectStore(STORE_LOGIN_ATTEMPTS, { autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}
