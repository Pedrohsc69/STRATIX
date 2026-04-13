import { createFeatureModule, createReadModelController } from '../shared/module-factory';

const DepartamentoController = createReadModelController('departamento', 'departamento');

export class Departamento {
  constructor(
    public readonly id: string,
    public readonly nome: string,
  ) {}
}

export class DepartmentCode {
  constructor(public readonly value: string) {}
}

export interface DepartamentoRepository {
  listByCompany(companyId: string): Promise<Departamento[]>;
}

export class DepartamentoDomainService {
  hasBudgetOwner() {
    return true;
  }
}

export interface CreateDepartamentoDto {
  nome: string;
  companyId: string;
}

export class CreateDepartamentoUseCase {
  execute(input: CreateDepartamentoDto) {
    return input;
  }
}

export const DepartamentoModule = createFeatureModule(DepartamentoController);
