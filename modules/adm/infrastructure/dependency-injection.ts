import { type IAdmSessionPort } from '../domain/contracts/adm-session-port.interface';
import { type ICheckModuleAccessUseCase } from '../domain/contracts/check-module-access-use-case.interface';
import { type IGetHomePageUseCase } from '../domain/contracts/get-home-page-use-case.interface';
import { type IGetSessionInfoUseCase } from '../domain/contracts/get-session-info-use-case.interface';
import { AdmSessionAdapter } from './session/adm-session.adapter';
import { CheckModuleAccessUseCase } from '../application/use-cases/check-module-access.use-case';
import { GetHomePageUseCase } from '../application/use-cases/get-home-page.use-case';
import { GetSessionInfoUseCase } from '../application/use-cases/get-session-info.use-case';
import { createSessionRepository } from '@/modules/login/infrastructure/dependency-injection';

export function createAdmSessionAdapter(): IAdmSessionPort {
  return new AdmSessionAdapter(createSessionRepository());
}

export function createCheckModuleAccessUseCase(): ICheckModuleAccessUseCase {
  return new CheckModuleAccessUseCase(createAdmSessionAdapter());
}

export function createGetHomePageUseCase(): IGetHomePageUseCase {
  return new GetHomePageUseCase(createAdmSessionAdapter());
}

export function createGetSessionInfoUseCase(): IGetSessionInfoUseCase {
  return new GetSessionInfoUseCase(createAdmSessionAdapter());
}

export function createAdmModule() {
  const sessionAdapter = createAdmSessionAdapter();
  return {
    useCases: {
      checkModuleAccess: new CheckModuleAccessUseCase(sessionAdapter) as ICheckModuleAccessUseCase,
      getHomePage: new GetHomePageUseCase(sessionAdapter) as IGetHomePageUseCase,
      getSessionInfo: new GetSessionInfoUseCase(sessionAdapter) as IGetSessionInfoUseCase,
    },
    sessionAdapter,
  };
}
