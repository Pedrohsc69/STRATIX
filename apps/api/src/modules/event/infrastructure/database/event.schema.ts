import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type EventDocument = HydratedDocument<EventLogDocument>;

@Schema({
  collection: 'event_logs',
  versionKey: false,
})
export class EventLogDocument {
  @Prop({ required: true, unique: true })
  id!: string;

  @Prop({ required: true })
  type!: string;

  @Prop({ required: true })
  source!: string;

  @Prop({ required: true })
  status!: string;

  @Prop({ required: true })
  occurredAt!: Date;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata!: Record<string, unknown>;
}

export const EventSchema = SchemaFactory.createForClass(EventLogDocument);
EventSchema.index({ type: 1, occurredAt: -1 });
