export type ProblemObject = {
  status: number;
  title: string;
  detail?: string;
  type: string;
  instance?: string;
} & Record<string, unknown>;
