import { type IRegistrationSessionRepository } from '../domain/contracts/registration-session-repository.interface';
import { type IGetConfirmationUseCase } from '../domain/contracts/get-confirmation.use-case.interface';
import { SessionRegistrationRepository } from './repositories/session-registration.repository';
import { GetRegistrationConfirmationUseCase } from '../application/use-cases/get-registration-confirmation.use-case';

export function createRegistrationSessionRepository(): IRegistrationSessionRepository {
  return new SessionRegistrationRepository();
}

export function createGetConfirmationUseCase(
  repository: IRegistrationSessionRepository,
): IGetConfirmationUseCase {
  return new GetRegistrationConfirmationUseCase(repository);
}

export function createConfirmacionModule() {
  const repository = createRegistrationSessionRepository();
  return {
    useCases: {
      getConfirmation: createGetConfirmationUseCase(repository),
    },
  };
}
