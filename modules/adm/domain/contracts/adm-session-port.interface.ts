import { type ISessionInfoDTO } from './adm.dto';

export interface IAdmSessionPort {
  getSessionInfo(): Promise<ISessionInfoDTO | null>;
  clearSession(): Promise<void>;
}
