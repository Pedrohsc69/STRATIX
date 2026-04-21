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
  userId!: string;

  @Prop({ required: true })
  action!: string;

  @Prop({ required: true })
  entity!: string;

  @Prop({ required: true })
  timestamp!: Date;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata!: Record<string, unknown>;
}

export const AuditSchema = SchemaFactory.createForClass(AuditLogDocument);
AuditSchema.index({ userId: 1, timestamp: -1 });
AuditSchema.index({ entity: 1, action: 1, timestamp: -1 });
