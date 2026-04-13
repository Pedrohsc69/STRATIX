import { createFeatureModule, createReadModelController } from '../shared/module-factory';

const EmpresaController = createReadModelController('empresa', 'empresa');

export class Empresa {
  constructor(
    public readonly id: string,
    public readonly nome: string,
  ) {}
}

export class Cnpj {
  constructor(public readonly value: string) {}
}

export interface EmpresaRepository {
  findById(id: string): Promise<Empresa | null>;
}

export class EmpresaDomainService {
  canActivateCompany() {
    return true;
  }
}

export interface CreateEmpresaDto {
  nome: string;
}

export class CreateEmpresaUseCase {
  execute(input: CreateEmpresaDto) {
    return input;
  }
}

export const EmpresaModule = createFeatureModule(EmpresaController);
