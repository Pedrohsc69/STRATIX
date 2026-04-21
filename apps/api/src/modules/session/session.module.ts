import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SESSION_REPOSITORY } from './domain/repositories/session.repository';
import { MongoSessionRepository } from './infrastructure/database/session.repository';
import { SessionDocumentModel, SessionSchema } from './infrastructure/database/session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SessionDocumentModel.name,
        schema: SessionSchema,
      },
    ]),
  ],
  providers: [
    MongoSessionRepository,
    {
      provide: SESSION_REPOSITORY,
      useExisting: MongoSessionRepository,
    },
  ],
  exports: [SESSION_REPOSITORY],
})
export class SessionModule {}
