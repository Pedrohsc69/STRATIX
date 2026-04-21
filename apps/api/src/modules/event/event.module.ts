import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EVENT_REPOSITORY } from './domain/repositories/event.repository';
import { MongoEventRepository } from './infrastructure/database/event.repository';
import { EventLogDocument, EventSchema } from './infrastructure/database/event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: EventLogDocument.name,
        schema: EventSchema,
      },
    ]),
  ],
  providers: [
    MongoEventRepository,
    {
      provide: EVENT_REPOSITORY,
      useExisting: MongoEventRepository,
    },
  ],
  exports: [EVENT_REPOSITORY],
})
export class EventModule {}
