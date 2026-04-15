import { type ITokenDto } from '../../domain/contracts/token.dto';
import { type ITokenRepository } from '../../domain/contracts/token-repository.interface';
import { getSpidiDb, STORE_TOKENS } from '../indexed-db/spidi-db';

const EMPTY_TOKEN: ITokenDto = {
  accessToken: '',
  uuid: '',
  refreshToken: '',
  expirationToken: new Date(0),
};

export class IndexedDbTokenRepository implements ITokenRepository {
  async getToken(): Promise<ITokenDto> {
    if (typeof window === 'undefined') return { ...EMPTY_TOKEN };
    try {
      const db = await getSpidiDb();
      const records = await db.getAll(STORE_TOKENS);
      const record = records.at(-1);
      if (!record) return { ...EMPTY_TOKEN };
      return {
        accessToken: record.accessToken,
        uuid: record.uuid,
        refreshToken: record.refreshToken,
        expirationToken: record.expirationToken,
      };
    } catch {
      return { ...EMPTY_TOKEN };
    }
  }

  async addToken(token: ITokenDto): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const db = await getSpidiDb();
      const records = await db.getAll(STORE_TOKENS);
      const existing = records[0];
      if (existing?.id !== undefined) {
        await db.put(STORE_TOKENS, { ...token, id: existing.id });
      } else {
        await db.add(STORE_TOKENS, token);
      }
      return true;
    } catch {
      return false;
    }
  }

  async clearToken(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const db = await getSpidiDb();
      await db.clear(STORE_TOKENS);
      return true;
    } catch {
      return false;
    }
  }
}
