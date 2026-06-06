import { AuditEntity } from '../entities/audit.entity';
import type { AuditLogFilters } from '../../audit.types';

export const AUDIT_REPOSITORY = Symbol('AUDIT_REPOSITORY');

export interface AuditRepository {
  save(audit: AuditEntity): Promise<AuditEntity>;
  findPaginated(filters: AuditLogFilters): Promise<{
    items: AuditEntity[];
    total: number;
  }>;
}
