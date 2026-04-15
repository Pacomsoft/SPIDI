import { type Session } from '../entities/session';

export interface ISessionRepository {
  init(): Promise<void>;
  save(session: Session): Promise<void>;
  findCurrent(): Promise<Session | null>;
  clear(): Promise<void>;
  renew(session: Session): Promise<Session>;
}
