import type { IPagination } from '@/modules/shared/domain/contracts/pagination.interface';

export type TrainingType = 'Mandatory' | 'Optional' | 'CompanyPolicy';
export type SendType = 'Individual' | 'Group' | 'Mass';

export interface IQuestionOptionDTO {
  optionIndex: number;
  text: string;
}

export interface IQuestionDTO {
  questionIndex: number;
  questionText: string;
  options: IQuestionOptionDTO[];
  correctOption: number;
}

export interface ITrainingListItemDTO {
  trainingId: string;
  title: string;
  trainingType: TrainingType;
  createdAt: string;
}

export interface ITrainingDetailDTO extends ITrainingListItemDTO {
  content: string;
  documentUrl?: string;
  hasQuiz: boolean;
  questions?: IQuestionDTO[];
  minimumScore?: number;
  createdBy: string;
  isOnboarding?: boolean;
}

export interface ICreateTrainingDTO {
  title: string;
  trainingType: TrainingType;
  content: string;
  documentUrl?: string;
  hasQuiz: boolean;
  questions?: IQuestionDTO[];
  minimumScore?: number;
  isOnboarding?: boolean;
}

export interface IUpdateTrainingDTO {
  title?: string;
  trainingType?: TrainingType;
  content?: string;
  documentUrl?: string;
  hasQuiz?: boolean;
  questions?: IQuestionDTO[];
  minimumScore?: number;
  isOnboarding?: boolean;
}

export interface ISendTrainingDTO {
  trainingId: string;
  sendType: SendType;
  recipientEmails?: string[];
}

export interface ITrainingProgressDTO {
  progressId: string;
  trainingId: string;
  driverName: string;
  driverId: string;
  answersCount: number;
  correctAnswers: number;
  responseDate: string;
}

export interface ITrainingFiltersDTO extends IPagination {
  search?: string;
}
