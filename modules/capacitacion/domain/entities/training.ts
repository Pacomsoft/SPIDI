import type { ITrainingDetailDTO, TrainingType } from '../contracts/training.dto';

interface ITrainingSchema {
  trainingId: string;
  title: string;
  trainingType: TrainingType;
  content: string;
  documentUrl?: string;
  hasQuiz: boolean;
  minimumScore?: number;
  createdBy: string;
  createdAt: string;
}

export class Training {
  private readonly _entity: ITrainingSchema;

  private constructor(schema: ITrainingSchema) {
    this._entity = schema;
  }

  static create(dto: ITrainingDetailDTO): Training {
    return new Training({
      trainingId: dto.trainingId,
      title: dto.title,
      trainingType: dto.trainingType,
      content: dto.content,
      documentUrl: dto.documentUrl,
      hasQuiz: dto.hasQuiz,
      minimumScore: dto.minimumScore,
      createdBy: dto.createdBy,
      createdAt: dto.createdAt,
    });
  }

  get trainingId(): string { return this._entity.trainingId; }
  get title(): string { return this._entity.title; }
  get trainingType(): TrainingType { return this._entity.trainingType; }
  get hasQuiz(): boolean { return this._entity.hasQuiz; }
  get canHaveQuiz(): boolean {
    return this._entity.trainingType === 'Mandatory' || this._entity.trainingType === 'Optional';
  }
  get typeLabel(): string {
    const labels: Record<TrainingType, string> = {
      Mandatory: 'Obligatorio',
      Optional: 'Opcional',
      CompanyPolicy: 'Política de empresa',
    };
    return labels[this._entity.trainingType];
  }
}
