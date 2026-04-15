import { type ITokenDto } from './token.dto';

export interface ITokenRepository {
  getToken(): Promise<ITokenDto>;
  addToken(token: ITokenDto): Promise<boolean>;
  clearToken(): Promise<boolean>;
}
