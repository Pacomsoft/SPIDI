import { type IConfiguracionRepository } from '../../domain/contracts/configuracion-repository.interface';
import { getSpidiDb, STORE_CONFIGURACIONES } from '../indexed-db/spidi-db';

export class IndexedDbConfiguracionRepository implements IConfiguracionRepository {
  async get(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const db = await getSpidiDb();
    const record = await db.getFromIndex(STORE_CONFIGURACIONES, 'by_key', key);
    return record?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const db = await getSpidiDb();
    const existing = await db.getFromIndex(STORE_CONFIGURACIONES, 'by_key', key);
    if (existing) {
      await db.put(STORE_CONFIGURACIONES, { ...existing, value });
    } else {
      try {
        await db.add(STORE_CONFIGURACIONES, { key, value });
      } catch (err) {
        // Guard against concurrent set() calls hitting the unique index constraint
        if (err instanceof DOMException && err.name === 'ConstraintError') {
          const record = await db.getFromIndex(STORE_CONFIGURACIONES, 'by_key', key);
          if (record) {
            await db.put(STORE_CONFIGURACIONES, { ...record, value });
          }
        } else {
          throw err;
        }
      }
    }
  }

  async remove(key: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const db = await getSpidiDb();
    const existing = await db.getFromIndex(STORE_CONFIGURACIONES, 'by_key', key);
    if (existing?.id !== undefined) {
      await db.delete(STORE_CONFIGURACIONES, existing.id);
    }
  }
}
