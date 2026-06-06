import { AuditEntity } from '../../domain/entities/audit.entity';
import { AuditLogDocument } from '../database/audit.schema';

export class AuditMapper {
  static toDomain(document: AuditLogDocument | (AuditLogDocument & { _id?: unknown })) {
    return new AuditEntity({
      id: document.id,
      actorId: document.actorId,
      actorEmail: document.actorEmail,
      actorRole: document.actorRole,
      companyId: document.companyId ?? null,
      departmentId: document.departmentId ?? null,
      action: document.action,
      entity: document.entity,
      entityId: document.entityId ?? null,
      oldValue: document.oldValue ?? null,
      newValue: document.newValue ?? null,
      metadata: document.metadata ?? null,
      ipAddress: document.ipAddress ?? null,
      userAgent: document.userAgent ?? null,
      createdAt: document.createdAt,
    });
  }

  static toPersistence(entity: AuditEntity) {
    return {
      id: entity.id,
      actorId: entity.actorId,
      actorEmail: entity.actorEmail,
      actorRole: entity.actorRole,
      companyId: entity.companyId,
      departmentId: entity.departmentId,
      action: entity.action,
      entity: entity.entity,
      entityId: entity.entityId,
      oldValue: entity.oldValue,
      newValue: entity.newValue,
      metadata: entity.metadata,
      ipAddress: entity.ipAddress,
      userAgent: entity.userAgent,
      createdAt: entity.createdAt,
    };
  }
}
