export interface ITokenResultDTO {
  accessToken: string;
  userId: string;
  userName: string;
  userEmail: string;
}

export interface IMsSessionDTO {
  msAccessToken: string;
  userId: string;
  userName: string;
  userEmail: string;
}

export interface IAuthService {
  initiateRedirect(): Promise<void>;
  /** Exchanges an OAuth authorization code for a Microsoft access token (PKCE flow). */
  getCallbackToken(code: string, state: string): Promise<ITokenResultDTO>;
  /** Persists the MS token result in session storage for the next step of the auth flow. */
  saveMsSession(tokenResult: ITokenResultDTO): void;
  /** Reads and returns the MS session data previously saved, or null if absent. */
  getMsSession(): IMsSessionDTO | null;
  /** Removes MS session data from session storage. */
  clearMsSession(): void;
}
