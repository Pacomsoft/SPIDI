import { type IAuthService, type ITokenResultDTO } from '../../domain/contracts/auth-service.interface';

/** @deprecated — replaced by NextAuthAuthService. For local dev without Azure credentials only. */
export class MockSSOAuthService implements IAuthService {
  async initiateRedirect(): Promise<void> {
    // Simulate redirect delay then auto-complete for dev purposes
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  async handleRedirectResult(): Promise<ITokenResultDTO | null> {
    return {
      accessToken: 'mock-token',
      userId: 'mock-user-123',
      userName: 'Juan Pérez',
      userEmail: 'juan.perez@example.com',
    };
  }
}
