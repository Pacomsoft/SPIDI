import { type IHttpClient } from '@/modules/shared/domain/contracts/http-client.interface';
import { type IConfiguracionRepository } from '@/modules/shared/domain/contracts/configuracion-repository.interface';
import { type IRegisterRepository } from '../domain/contracts/register-repository.interface';
import { type IUseCase } from '@/modules/shared/domain/contracts/use-case.interface';
import { type IStateDTO } from '../domain/contracts/state.dto';
import { type IVerificationResult } from '../domain/contracts/verification-result.dto';
import { type IRegistroDTO } from '../domain/contracts/registro.dto';
import { type IRegisterApplicantDto } from '../domain/contracts/register-applicant.dto';
import { type ICheckDuplicateResult } from '../domain/contracts/check-duplicate-result.dto';
import type { IResultApi } from '@/modules/shared/domain/entities/result-api.interface';
import { ApiRegisterRepository } from './repositories/api-register.repository';
import { MockRegisterRepository } from './repositories/mock-register.repository';
import { GetStatesUseCase } from '../application/use-cases/get-states.use-case';
import { RequestVerificationCodeSmsUseCase, type IRequestVerificationCodeSmsInput } from '../application/use-cases/request-verification-code-sms.use-case';
import { ValidateVerificationCodeSmsUseCase, type IValidateVerificationCodeSmsInput } from '../application/use-cases/validate-verification-code-sms.use-case';
import { RequestVerificationCodeEmailUseCase, type IRequestVerificationCodeEmailInput } from '../application/use-cases/request-verification-code-email.use-case';
import { ValidateVerificationCodeEmailUseCase, type IValidateVerificationCodeEmailInput } from '../application/use-cases/validate-verification-code-email.use-case';
import { GuardarDriverUseCase } from '../application/use-cases/guardar-driver.use-case';
import { CheckDuplicateUseCase, type ICheckDuplicateInput } from '../application/use-cases/check-duplicate.use-case';

// ─── SWAP POINT ───────────────────────────────────────────────────────────────
// NEXT_PUBLIC_USE_MOCK_AUTH=true  → MockRegisterRepository (Vercel/demo, 0 HTTP)
// Cualquier otro entorno           → ApiRegisterRepository  (backend real)
// ─────────────────────────────────────────────────────────────────────────────
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

export function createRegisterRepository(
  httpClient: IHttpClient,
  configuracionRepository?: IConfiguracionRepository,
): IRegisterRepository {
  return USE_MOCK
    ? new MockRegisterRepository()
    : new ApiRegisterRepository(httpClient, configuracionRepository);
}

export function createGetStatesUseCase(
  registerRepository: IRegisterRepository,
): IUseCase<void, IStateDTO[]> {
  return new GetStatesUseCase(registerRepository);
}

export function createRequestVerificationCodeSmsUseCase(
  registerRepository: IRegisterRepository,
): IUseCase<IRequestVerificationCodeSmsInput, IResultApi<IVerificationResult>> {
  return new RequestVerificationCodeSmsUseCase(registerRepository);
}

export function createValidateVerificationCodeSmsUseCase(
  registerRepository: IRegisterRepository,
): IUseCase<IValidateVerificationCodeSmsInput, IResultApi<IVerificationResult>> {
  return new ValidateVerificationCodeSmsUseCase(registerRepository);
}

export function createRequestVerificationCodeEmailUseCase(
  registerRepository: IRegisterRepository,
): IUseCase<IRequestVerificationCodeEmailInput, IResultApi<IVerificationResult>> {
  return new RequestVerificationCodeEmailUseCase(registerRepository);
}

export function createValidateVerificationCodeEmailUseCase(
  registerRepository: IRegisterRepository,
): IUseCase<IValidateVerificationCodeEmailInput, IResultApi<IVerificationResult>> {
  return new ValidateVerificationCodeEmailUseCase(registerRepository);
}

export function createGuardarDriverUseCase(
  registerRepository: IRegisterRepository,
): IUseCase<IRegistroDTO, IResultApi<IRegisterApplicantDto>> {
  return new GuardarDriverUseCase(registerRepository);
}

export function createCheckDuplicateUseCase(
  registerRepository: IRegisterRepository,
): IUseCase<ICheckDuplicateInput, IResultApi<ICheckDuplicateResult>> {
  return new CheckDuplicateUseCase(registerRepository);
}

export interface IRegistroModuleOutput {
  useCases: {
    getStates: IUseCase<void, IStateDTO[]>;
    requestVerificationCodeSms: IUseCase<IRequestVerificationCodeSmsInput, IResultApi<IVerificationResult>>;
    validateVerificationCodeSms: IUseCase<IValidateVerificationCodeSmsInput, IResultApi<IVerificationResult>>;
    requestVerificationCodeEmail: IUseCase<IRequestVerificationCodeEmailInput, IResultApi<IVerificationResult>>;
    validateVerificationCodeEmail: IUseCase<IValidateVerificationCodeEmailInput, IResultApi<IVerificationResult>>;
    guardarDriver: IUseCase<IRegistroDTO, IResultApi<IRegisterApplicantDto>>;
    checkDuplicate: IUseCase<ICheckDuplicateInput, IResultApi<ICheckDuplicateResult>>;
  };
  configuracionRepository: IConfiguracionRepository;
}

export function createRegistroModule(
  httpClient: IHttpClient,
  configuracionRepository: IConfiguracionRepository,
): IRegistroModuleOutput {
  const registerRepository = createRegisterRepository(httpClient, configuracionRepository);
  return {
    useCases: {
      getStates: createGetStatesUseCase(registerRepository),
      requestVerificationCodeSms: createRequestVerificationCodeSmsUseCase(registerRepository),
      validateVerificationCodeSms: createValidateVerificationCodeSmsUseCase(registerRepository),
      requestVerificationCodeEmail: createRequestVerificationCodeEmailUseCase(registerRepository),
      validateVerificationCodeEmail: createValidateVerificationCodeEmailUseCase(registerRepository),
      guardarDriver: createGuardarDriverUseCase(registerRepository),
      checkDuplicate: createCheckDuplicateUseCase(registerRepository),
    },
    configuracionRepository,
  };
}
