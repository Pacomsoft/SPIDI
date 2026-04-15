import { v7 as uuidv7 } from 'uuid';
import { type IIdempotencyRepository } from '../../domain/contracts/idempotency-repository.interface';
import { getSpidiDb, STORE_REQUESTS } from '../indexed-db/spidi-db';

const THREE_MINUTES_MS = 3 * 60 * 1000;
const MAX_INTENTOS = 5;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class IndexedDbIdempotencyRepository implements IIdempotencyRepository {
  async addRequest(url: string): Promise<string> {
    if (typeof window === 'undefined') return uuidv7();

    const db = await getSpidiDb();
    const existing = await db.getFromIndex(STORE_REQUESTS, 'by_url', url);

    if (!existing) {
      const record = {
        url,
        key: uuidv7(),
        intentos: 0,
        expiration: new Date(Date.now() + THREE_MINUTES_MS),
      };
      await db.add(STORE_REQUESTS, record);
      return record.key;
    }

    const now = new Date();
    const expiration = existing.expiration ?? now;
    let { key, intentos } = existing;

    if (expiration <= now) {
      intentos = existing.intentos + 1;
    } else {
      key = uuidv7();
    }

    if (intentos >= MAX_INTENTOS) {
      key = uuidv7();
      intentos = 0;
    }

    await db.put(STORE_REQUESTS, {
      ...existing,
      key,
      intentos,
      expiration: existing.expiration ?? now,
    });

    return key;
  }

  async updateRequest(url: string, newKey: string): Promise<void> {
    if (typeof window === 'undefined') return;
    if (!newKey || !UUID_REGEX.test(newKey)) return;

    const db = await getSpidiDb();
    const existing = await db.getFromIndex(STORE_REQUESTS, 'by_url', url);
    if (!existing) return;

    await db.put(STORE_REQUESTS, {
      ...existing,
      key: newKey,
      intentos: 0,
      expiration: null,
    });
  }
}
