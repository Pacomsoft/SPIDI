import { type IOtpService } from '../../domain/contracts/otp-service.interface';

/**
 * Stub implementation — always returns success.
 * Replace with a real API-backed service when the backend is ready.
 */
export class MockOtpService implements IOtpService {
  async verify(_code: string, _phase: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 1200));
    return true;
  }

  async resend(_phone: string, _email: string, _phase: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 500));
  }

  async submit(_telefono: string, _email: string, _nombre: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 1500));
  }
}
