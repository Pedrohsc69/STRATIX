import { createFeatureModule, createReadModelController } from '../shared/module-factory';

const ObjetivoController = createReadModelController('objetivo', 'objetivo');

export class Objetivo {
  constructor(
    public readonly id: string,
    public readonly titulo: string,
  ) {}
}

export class ObjetivoStatus {
  constructor(public readonly value: 'draft' | 'active' | 'closed') {}
}

export interface ObjetivoRepository {
  listByDepartment(departmentId: string): Promise<Objetivo[]>;
}

export class ObjetivoDomainService {
  scoreProgress(progress: number) {
    return Math.min(1, Math.max(0, progress));
  }
}

export interface CreateObjetivoDto {
  titulo: string;
  departmentId: string;
  cycleId: string;
}

export class CreateObjetivoUseCase {
  execute(input: CreateObjetivoDto) {
    return input;
  }
}

export const ObjetivoModule = createFeatureModule(ObjetivoController);
