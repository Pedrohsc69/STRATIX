import { createFeatureModule, createReadModelController } from '../shared/module-factory';

const CicloController = createReadModelController('ciclo', 'ciclo');

export class Ciclo {
  constructor(
    public readonly id: string,
    public readonly nome: string,
  ) {}
}

export class Periodo {
  constructor(
    public readonly inicio: Date,
    public readonly fim: Date,
  ) {}
}

export interface CicloRepository {
  findActive(companyId: string): Promise<Ciclo | null>;
}

export class CicloDomainService {
  overlaps() {
    return false;
  }
}

export interface CreateCicloDto {
  nome: string;
  startsAt: string;
  endsAt: string;
}

export class CreateCicloUseCase {
  execute(input: CreateCicloDto) {
    return input;
  }
}

export const CicloModule = createFeatureModule(CicloController);
