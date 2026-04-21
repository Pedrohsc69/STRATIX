import { AuditEntity } from '../../domain/entities/audit.entity';
import { AuditLogDocument } from '../database/audit.schema';

export class AuditMapper {
  static toDomain(document: AuditLogDocument | (AuditLogDocument & { _id?: unknown })) {
    return new AuditEntity({
      id: document.id,
      userId: document.userId,
      action: document.action,
      entity: document.entity,
      timestamp: document.timestamp,
      metadata: document.metadata ?? {},
    });
  }

  static toPersistence(entity: AuditEntity) {
    return {
      id: entity.id,
      userId: entity.userId,
      action: entity.action,
      entity: entity.entity,
      timestamp: entity.timestamp,
      metadata: entity.metadata,
    };
  }
}
