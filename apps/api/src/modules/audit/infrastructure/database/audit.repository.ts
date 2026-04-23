import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditEntity } from '../../domain/entities/audit.entity';
import { AuditRepository } from '../../domain/repositories/audit.repository';
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

  async findByUser(userId: string): Promise<AuditEntity[]> {
    const documents = await this.auditModel.find({ userId }).sort({ timestamp: -1 }).lean();
    return documents.map((document) => AuditMapper.toDomain(document));
  }

  async findByEntity(entity: string): Promise<AuditEntity[]> {
    const documents = await this.auditModel.find({ entity }).sort({ timestamp: -1 }).lean();
    return documents.map((document) => AuditMapper.toDomain(document));
  }

  async findRecent(limit: number): Promise<AuditEntity[]> {
    const documents = await this.auditModel.find().sort({ timestamp: -1 }).limit(limit).lean();
    return documents.map((document) => AuditMapper.toDomain(document));
  }
}
