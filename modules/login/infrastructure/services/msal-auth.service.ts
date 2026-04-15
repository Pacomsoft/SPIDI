import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { msalInstance, LOGIN_SCOPES } from '../config/msal.config';
import { type IAuthService, type ITokenResultDTO } from '../../domain/contracts/auth-service.interface';

export class MsalAuthService implements IAuthService {
  async initiateRedirect(): Promise<void> {
    await msalInstance.loginRedirect({
      scopes: LOGIN_SCOPES,
      prompt: 'select_account',
    });
  }

  async handleRedirectResult(): Promise<ITokenResultDTO | null> {
    const accounts = msalInstance.getAllAccounts();
    if (!accounts.length) return null;

    const account = accounts[0];
    try {
      const result = await msalInstance.acquireTokenSilent({
        scopes: LOGIN_SCOPES,
        account,
      });
      return {
        accessToken: result.accessToken,
        userId: account.localAccountId,
        userName: account.name ?? account.username,
        userEmail: account.username,
      };
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) throw error;
      return null;
    }
  }
}
