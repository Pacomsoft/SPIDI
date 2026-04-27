import { type IGetHomePageUseCase } from '../../domain/contracts/get-home-page-use-case.interface';
import { type IGetHomePageResultDTO } from '../../domain/contracts/adm.dto';
import { type IAdmSessionPort } from '../../domain/contracts/adm-session-port.interface';

export class GetHomePageUseCase implements IGetHomePageUseCase {
  constructor(private readonly sessionPort: IAdmSessionPort) {}

  async execute(): Promise<IGetHomePageResultDTO> {
    const sessionInfo = await this.sessionPort.getSessionInfo();
    if (!sessionInfo) return { homePage: '/login', role: null };

    return { homePage: '/adm/home', role: sessionInfo.role };
  }
}
