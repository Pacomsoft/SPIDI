import { type IVerificationStateDTO } from './verification-state.dto';

export interface IVerificationStateRepository {
  load(): IVerificationStateDTO | null;
  save(state: IVerificationStateDTO): void;
  clear(): void;
}
