import { type IOtpService } from '../../domain/contracts/otp-service.interface';

/**
 * @description Mock implementation of IOtpService for development.
 * @implements {IOtpService}
 *
 * Stub implementation — always returns success.
 *
 * TO REPLACE WITH REAL BACKEND:
 * 1. Create `api-otp.service.ts` implementing `IOtpService` in this same folder.
 * 2. In `dependency-injection.ts`, replace `new MockOtpService()` with `new ApiOtpService(httpClient)`
 *    inside `createOtpService()`.
 * 3. Delete or keep this file for testing purposes.
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
