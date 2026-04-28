export class ApplicantNotFoundError extends Error {
  constructor(id: string) {
    super(`Applicant with id "${id}" was not found`);
    this.name = 'ApplicantNotFoundError';
  }
}
