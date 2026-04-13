import { createFeatureModule, createReadModelController } from '../shared/module-factory';

const OkrController = createReadModelController('okr', 'okr');

export class Okr {
  constructor(
    public readonly id: string,
    public readonly titulo: string,
  ) {}
}

export class MetricTarget {
  constructor(
    public readonly current: number,
    public readonly target: number,
  ) {}
}

export interface OkrRepository {
  listByObjective(objectiveId: string): Promise<Okr[]>;
}

export class OkrDomainService {
  calculateCompletion(current: number, target: number) {
    return target === 0 ? 0 : current / target;
  }
}

export interface CreateOkrDto {
  titulo: string;
  objectiveId: string;
  target: number;
}

export class CreateOkrUseCase {
  execute(input: CreateOkrDto) {
    return input;
  }
}

export const OkrModule = createFeatureModule(OkrController);
