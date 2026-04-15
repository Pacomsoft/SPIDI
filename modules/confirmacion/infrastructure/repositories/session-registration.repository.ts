import { type IRegistrationSessionRepository } from '../../domain/contracts/registration-session-repository.interface';
import { type IRegistrationSessionDTO } from '../../domain/contracts/confirmation.dto';

const SESSION_KEY = 'spidi_step1';

export class SessionRegistrationRepository implements IRegistrationSessionRepository {
  getSession(): IRegistrationSessionDTO | null {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as IRegistrationSessionDTO;
    } catch {
      return null;
    }
  }

  clearSession(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }
}
