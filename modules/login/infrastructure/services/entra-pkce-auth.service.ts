import axios from 'axios';
import {
  type IAuthService,
  type ITokenResultDTO,
} from '../../domain/contracts/auth-service.interface';
import { LoginFailedError } from '../../domain/errors/login-failed.error';
import { AccountDisabledError } from '../../domain/errors/account-disabled.error';

const PKCE_VERIFIER_KEY = 'pkce_code_verifier';
const PKCE_STATE_KEY = 'pkce_state';
export const MS_ACCESS_TOKEN_KEY = 'ms_access_token';
export const MS_USER_INFO_KEY = 'ms_user_info';

function base64UrlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  // Convert base64url to base64 and fix padding
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array.buffer);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

export class EntraPkceAuthService implements IAuthService {
  private readonly clientId: string;
  private readonly tenantId: string;
  private readonly redirectUri: string;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_MICROSOFT_ENTRA_CLIENT_ID ?? '';
    this.tenantId = process.env.NEXT_PUBLIC_MICROSOFT_ENTRA_TENANT_ID ?? '';
    this.redirectUri =
      process.env.NEXT_PUBLIC_MICROSOFT_ENTRA_REDIRECT_URI ??
      (typeof window !== 'undefined' ? `${window.location.origin}/validate-token` : '');
  }

  async initiateRedirect(): Promise<void> {
    const verifier = await generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const state = base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)).buffer);

    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
    sessionStorage.setItem(PKCE_STATE_KEY, state);

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: 'openid profile email offline_access .default',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
      prompt: 'login',
    });

    window.location.href = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async getCallbackToken(code: string, state: string): Promise<ITokenResultDTO> {
    const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
    const savedState = sessionStorage.getItem(PKCE_STATE_KEY);

    if (!verifier) {
      throw new LoginFailedError('No se encontró el verificador PKCE. Intenta iniciar sesión de nuevo.');
    }

    if (savedState && state && savedState !== state) {
      sessionStorage.removeItem(PKCE_VERIFIER_KEY);
      sessionStorage.removeItem(PKCE_STATE_KEY);
      throw new LoginFailedError('El estado de la solicitud no coincide. Posible ataque CSRF.');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
      code_verifier: verifier,
    });

    let responseData: { access_token: string; id_token?: string };
    try {
      const response = await axios.post<typeof responseData>(
        `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
        params.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
      responseData = response.data;
    } catch (err) {
      // Clean up verifier on failure so a fresh login is required
      sessionStorage.removeItem(PKCE_VERIFIER_KEY);
      sessionStorage.removeItem(PKCE_STATE_KEY);

      const errorDesc: string =
        axios.isAxiosError(err)
          ? (err.response?.data?.error_description ?? err.message)
          : String(err);

      if (errorDesc.includes('AADSTS50057')) {
        throw new AccountDisabledError();
      }
      throw new LoginFailedError(`Error al intercambiar el código de Microsoft: ${errorDesc}`);
    }

    // Only remove the verifier after a successful exchange
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    sessionStorage.removeItem(PKCE_STATE_KEY);

    const { access_token, id_token } = responseData;

    let userId = '';
    let userName = '';
    let userEmail = '';

    if (id_token) {
      try {
        const payload = JSON.parse(base64UrlDecode(id_token.split('.')[1]));
        userId = payload.oid ?? payload.sub ?? '';
        userName = payload.name ?? '';
        userEmail = payload.preferred_username ?? payload.email ?? '';
      } catch {
        // id_token decode failure is non-fatal; user info will be empty
      }
    }

    return { accessToken: access_token, userId, userName, userEmail };
  }
}
