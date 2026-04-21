import { EventEntity } from '../entities/event.entity';

export const EVENT_REPOSITORY = Symbol('EVENT_REPOSITORY');

export interface EventRepository {
  save(event: EventEntity): Promise<EventEntity>;
}
