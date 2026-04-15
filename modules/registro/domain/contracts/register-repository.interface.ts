import { ICheckDuplicateResult } from './check-duplicate-result.dto';
import { type IStateDTO } from './state.dto';
import { type IVerificationResult } from './verification-result.dto';
import { type IRegistroDTO } from './registro.dto';
import { type IRegisterApplicantDto } from './register-applicant.dto';

export interface IRegisterRepository {
  getStates(): Promise<IStateDTO[]>;
  requestVerificationCodeSMS(formId: string, phoneNumber: string): Promise<IResultApi<IVerificationResult>>;
  validateVerificationCodeSMS(formId: string, phoneNumber: string, code: string): Promise<IResultApi<IVerificationResult>>;
  requestVerificationCodeEmail(formId: string, email: string): Promise<IResultApi<IVerificationResult>>;
  validateVerificationCodeEmail(formId: string, email: string, code: string): Promise<IResultApi<IVerificationResult>>;
  checkDuplicate(phoneNumber: string, email: string): Promise<IResultApi<ICheckDuplicateResult>>;
  guardarDriver(driver: IRegistroDTO): Promise<IResultApi<IRegisterApplicantDto>>;
}
