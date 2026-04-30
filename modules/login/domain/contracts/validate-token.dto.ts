export interface IValidateTokenInputDTO {
  msAccessToken: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  redirectAfterLogin?: string;
}

export interface IValidateTokenResultDTO {
  redirectPath: string;
  userName: string;
  userRole: string;
}
