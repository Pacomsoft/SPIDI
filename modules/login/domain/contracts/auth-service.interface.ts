export interface ITokenResultDTO {
  accessToken: string;
  userId: string;
  userName: string;
  userEmail: string;
}

export interface IAuthService {
  initiateRedirect(): Promise<void>;
  handleRedirectResult(): Promise<ITokenResultDTO | null>;
}
