import { type IAuthService, type ITokenResultDTO } from '../../domain/contracts/auth-service.interface';

/** @deprecated — for local dev without Azure credentials only. */
export class MockSSOAuthService implements IAuthService {
  async initiateRedirect(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  async getCallbackToken(_code: string, _state: string): Promise<ITokenResultDTO> {
    return {
      accessToken: 'mock-token',
      userId: 'mock-user-123',
      userName: 'Juan Pérez',
      userEmail: 'juan.perez@example.com',
    };
  }
}
