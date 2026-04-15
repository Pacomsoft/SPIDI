export interface IValidateTokenInputDTO {
  redirectAfterLogin?: string;
}

export interface IValidateTokenResultDTO {
  redirectPath: string;
  userName: string;
  userRole: string;
}
