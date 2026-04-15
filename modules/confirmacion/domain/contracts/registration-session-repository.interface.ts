import { type IRegistrationSessionDTO } from './confirmation.dto';

export interface IRegistrationSessionRepository {
  getSession(): IRegistrationSessionDTO | null;
  clearSession(): void;
}
