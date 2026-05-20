import {
  type IAuthService,
  type ITokenResultDTO,
  type IMsSessionDTO,
} from '../../domain/contracts/auth-service.interface';

const MOCK_MS_ACCESS_TOKEN_KEY = 'mock_ms_access_token';
const MOCK_MS_USER_INFO_KEY = 'mock_ms_user_info';

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

  saveMsSession(tokenResult: ITokenResultDTO): void {
    sessionStorage.setItem(MOCK_MS_ACCESS_TOKEN_KEY, tokenResult.accessToken);
    sessionStorage.setItem(
      MOCK_MS_USER_INFO_KEY,
      JSON.stringify({
        userId: tokenResult.userId,
        userName: tokenResult.userName,
        userEmail: tokenResult.userEmail,
      }),
    );
  }

  getMsSession(): IMsSessionDTO | null {
    const msAccessToken = sessionStorage.getItem(MOCK_MS_ACCESS_TOKEN_KEY);
    if (!msAccessToken) return null;

    let userId = '';
    let userName = '';
    let userEmail = '';
    try {
      const userInfo = JSON.parse(sessionStorage.getItem(MOCK_MS_USER_INFO_KEY) ?? '{}');
      userId = userInfo.userId ?? '';
      userName = userInfo.userName ?? '';
      userEmail = userInfo.userEmail ?? '';
    } catch {
      // non-fatal, session will be created with empty user info
    }

    return { msAccessToken, userId, userName, userEmail };
  }

  clearMsSession(): void {
    sessionStorage.removeItem(MOCK_MS_ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(MOCK_MS_USER_INFO_KEY);
  }
}
