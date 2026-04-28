import { type IDriverDetailDTO } from './driver-detail.dto';

export type IUpdateDriverDTO = Partial<Omit<IDriverDetailDTO, 'id'>>;
