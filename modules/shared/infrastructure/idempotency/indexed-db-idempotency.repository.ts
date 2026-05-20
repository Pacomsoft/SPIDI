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
    // expiration=null significa que el backend ya respondió con ETag (request completado)
    // En ese caso se considera expirado y se genera nueva key
    const expiration = existing.expiration ?? new Date(0);
    let { key, intentos } = existing;

    if (expiration <= now) {
      // El registro expiró o ya fue completado → nueva request, nueva key
      key = uuidv7();
      intentos = 0;
    } else {
      // Aún dentro de la ventana de 3 min → mismo request en vuelo, incrementar intentos
      intentos = existing.intentos + 1;
    }

    if (intentos >= MAX_INTENTOS) {
      // Demasiados reintentos del mismo request → reset con nueva key
      key = uuidv7();
      intentos = 0;
    }

    await db.put(STORE_REQUESTS, {
      ...existing,
      key,
      intentos,
      expiration: expiration <= now ? new Date(Date.now() + THREE_MINUTES_MS) : existing.expiration,
    });

    return key;
  }

  async updateRequest(url: string, newKey: string): Promise<void> {
    if (typeof window === 'undefined') return;
    if (!newKey || !UUID_REGEX.test(newKey)) return;

    const db = await getSpidiDb();
    const existing = await db.getFromIndex(STORE_REQUESTS, 'by_url', url);
    if (!existing) return;

    // Marcar como completado: expiration en el pasado para que el próximo
    // fetch genere una key nueva en lugar de reusar la del request anterior
    await db.put(STORE_REQUESTS, {
      ...existing,
      key: newKey,
      intentos: 0,
      expiration: new Date(0), // ya completado → expira inmediatamente
    });
  }
}
