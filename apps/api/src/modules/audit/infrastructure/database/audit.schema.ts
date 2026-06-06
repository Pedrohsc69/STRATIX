import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AuditDocument = HydratedDocument<AuditLogDocument>;

@Schema({
  collection: 'audit_logs',
  versionKey: false,
})
export class AuditLogDocument {
  @Prop({ required: true, unique: true })
  id!: string;

  @Prop({ required: true })
  actorId!: string;

  @Prop({ required: true })
  actorEmail!: string;

  @Prop({ required: true })
  actorRole!: string;

  @Prop({ default: null })
  companyId!: string | null;

  @Prop({ default: null })
  departmentId!: string | null;

  @Prop({ required: true })
  action!: string;

  @Prop({ required: true })
  entity!: string;

  @Prop({ default: null })
  entityId!: string | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  oldValue!: Record<string, unknown> | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  newValue!: Record<string, unknown> | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  metadata!: Record<string, unknown> | null;

  @Prop({ default: null })
  ipAddress!: string | null;

  @Prop({ default: null })
  userAgent!: string | null;

  @Prop({ required: true, default: () => new Date() })
  createdAt!: Date;
}

export const AuditSchema = SchemaFactory.createForClass(AuditLogDocument);
AuditSchema.index({ companyId: 1, createdAt: -1 });
AuditSchema.index({ actorId: 1, createdAt: -1 });
AuditSchema.index({ entity: 1, action: 1, createdAt: -1 });
AuditSchema.index({ departmentId: 1, createdAt: -1 });
