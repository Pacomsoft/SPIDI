export class TrainingNotFoundError extends Error {
  constructor(trainingId: string) {
    super(`Training with id '${trainingId}' was not found`);
    this.name = 'TrainingNotFoundError';
  }
}
