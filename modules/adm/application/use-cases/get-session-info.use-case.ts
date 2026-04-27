import { type IGetSessionInfoUseCase } from '../../domain/contracts/get-session-info-use-case.interface';
import { type ISessionInfoDTO } from '../../domain/contracts/adm.dto';
import { type IAdmSessionPort } from '../../domain/contracts/adm-session-port.interface';

export class GetSessionInfoUseCase implements IGetSessionInfoUseCase {
  constructor(private readonly sessionPort: IAdmSessionPort) {}

  async execute(): Promise<ISessionInfoDTO | null> {
    return this.sessionPort.getSessionInfo();
  }
}
