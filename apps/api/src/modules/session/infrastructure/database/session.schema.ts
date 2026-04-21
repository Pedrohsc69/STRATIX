import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type SessionDocument = HydratedDocument<SessionDocumentModel>;

@Schema({
  collection: 'user_sessions',
  versionKey: false,
})
export class SessionDocumentModel {
  @Prop({ required: true, unique: true })
  sessionId!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true, expires: 0 })
  expiration!: Date;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata!: Record<string, unknown>;
}

export const SessionSchema = SchemaFactory.createForClass(SessionDocumentModel);
SessionSchema.index({ userId: 1 });
