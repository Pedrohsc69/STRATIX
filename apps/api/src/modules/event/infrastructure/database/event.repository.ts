import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEntity } from '../../domain/entities/event.entity';
import { EventRepository } from '../../domain/repositories/event.repository';
import { EventLogDocument } from './event.schema';

@Injectable()
export class MongoEventRepository implements EventRepository {
  constructor(
    @InjectModel(EventLogDocument.name)
    private readonly eventModel: Model<EventLogDocument>,
  ) {}

  async save(event: EventEntity): Promise<EventEntity> {
    const createdEvent = await this.eventModel.create({
      id: event.id,
      type: event.type,
      source: event.source,
      status: event.status,
      occurredAt: event.occurredAt,
      metadata: event.metadata,
    });

    return new EventEntity({
      id: createdEvent.id,
      type: createdEvent.type,
      source: createdEvent.source,
      status: createdEvent.status,
      occurredAt: createdEvent.occurredAt,
      metadata: createdEvent.metadata ?? {},
    });
  }
}
