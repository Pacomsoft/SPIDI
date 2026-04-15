import { type IVerificationStateRepository } from '../../domain/contracts/verification-state-repository.interface';
import { type IVerificationStateDTO } from '../../domain/contracts/verification-state.dto';

const SESSION_KEY = 'spidi_verification_state';

export class SessionVerificationStateRepository implements IVerificationStateRepository {
  load(): IVerificationStateDTO | null {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as IVerificationStateDTO;
    } catch {
      return null;
    }
  }

  save(state: IVerificationStateDTO): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    }
  }

  clear(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }
}
