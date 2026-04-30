export interface ITokenResultDTO {
  accessToken: string;
  userId: string;
  userName: string;
  userEmail: string;
}

export interface IAuthService {
  initiateRedirect(): Promise<void>;
  /** Exchanges an OAuth authorization code for a Microsoft access token (PKCE flow). */
  getCallbackToken(code: string, state: string): Promise<ITokenResultDTO>;
}
