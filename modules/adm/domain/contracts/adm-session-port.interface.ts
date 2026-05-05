import { type ISessionInfoDTO } from './adm.dto';

export interface IAdmSessionPort {
  getSessionInfo(): Promise<ISessionInfoDTO | null>;
  logout(): Promise<void>;
  clearSession(): Promise<void>;
}
