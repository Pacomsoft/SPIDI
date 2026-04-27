import { type ICheckModuleAccessUseCase } from '../../domain/contracts/check-module-access-use-case.interface';
import { type ICheckModuleAccessInputDTO, type ICheckModuleAccessResultDTO } from '../../domain/contracts/adm.dto';
import { type IAdmSessionPort } from '../../domain/contracts/adm-session-port.interface';
import { ModuleAccess } from '../../domain/value-objects/module-access';

export class CheckModuleAccessUseCase implements ICheckModuleAccessUseCase {
  constructor(private readonly sessionPort: IAdmSessionPort) {}

  async execute(input: ICheckModuleAccessInputDTO): Promise<ICheckModuleAccessResultDTO> {
    const sessionInfo = await this.sessionPort.getSessionInfo();
    if (!sessionInfo) return { hasAccess: false, role: null };

    const moduleAccess = ModuleAccess.create(sessionInfo.menus);
    const hasAccess = moduleAccess.canAccess(input.moduleKey);
    return { hasAccess, role: sessionInfo.role };
  }
}
