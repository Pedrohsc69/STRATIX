import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditEntity } from '../../domain/entities/audit.entity';
import { AuditRepository } from '../../domain/repositories/audit.repository';
import type { AuditLogFilters } from '../../audit.types';
import { AuditMapper } from '../mappers/audit.mapper';
import { AuditLogDocument } from './audit.schema';

@Injectable()
export class MongoAuditRepository implements AuditRepository {
  constructor(
    @InjectModel(AuditLogDocument.name)
    private readonly auditModel: Model<AuditLogDocument>,
  ) {}

  async save(audit: AuditEntity): Promise<AuditEntity> {
    const createdAudit = await this.auditModel.create(AuditMapper.toPersistence(audit));
    return AuditMapper.toDomain(createdAudit.toObject());
  }

  async findPaginated(filters: AuditLogFilters): Promise<{
    items: AuditEntity[];
    total: number;
  }> {
    const where: Record<string, unknown> = {
      companyId: filters.companyId,
    };

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.entity) {
      where.entity = filters.entity;
    }

    if (filters.actorId) {
      where.actorId = filters.actorId;
    }

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {
        ...(filters.startDate ? { $gte: filters.startDate } : {}),
        ...(filters.endDate ? { $lte: filters.endDate } : {}),
      };
    }

    const skip = (filters.page - 1) * filters.limit;
    const [documents, total] = await Promise.all([
      this.auditModel.find(where).sort({ createdAt: -1 }).skip(skip).limit(filters.limit).lean(),
      this.auditModel.countDocuments(where),
    ]);

    return {
      items: documents.map((document) => AuditMapper.toDomain(document)),
      total,
    };
  }
}
