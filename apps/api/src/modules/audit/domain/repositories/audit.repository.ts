import { AuditEntity } from '../entities/audit.entity';

export const AUDIT_REPOSITORY = Symbol('AUDIT_REPOSITORY');

export interface AuditRepository {
  save(audit: AuditEntity): Promise<AuditEntity>;
  findByUser(userId: string): Promise<AuditEntity[]>;
  findByEntity(entity: string): Promise<AuditEntity[]>;
  findRecent(limit: number): Promise<AuditEntity[]>;
}