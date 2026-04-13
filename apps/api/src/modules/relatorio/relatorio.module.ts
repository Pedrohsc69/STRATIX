import { createFeatureModule, createReadModelController } from '../shared/module-factory';

const RelatorioController = createReadModelController('relatorio', 'relatorio');

export class Relatorio {
  constructor(
    public readonly id: string,
    public readonly nome: string,
  ) {}
}

export class ReportPeriod {
  constructor(
    public readonly from: Date,
    public readonly to: Date,
  ) {}
}

export interface RelatorioRepository {
  exportCompanySnapshot(companyId: string): Promise<Relatorio>;
}

export class RelatorioDomainService {
  supportsFormat(format: string) {
    return ['csv', 'pdf'].includes(format);
  }
}

export interface ExportRelatorioDto {
  companyId: string;
  format: string;
}

export class ExportRelatorioUseCase {
  execute(input: ExportRelatorioDto) {
    return input;
  }
}

export const RelatorioModule = createFeatureModule(RelatorioController);
