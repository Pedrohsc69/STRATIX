import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SessionEntity } from '../../domain/entities/session.entity';
import { SessionRepository } from '../../domain/repositories/session.repository';
import { SessionDocumentModel } from './session.schema';

@Injectable()
export class MongoSessionRepository implements SessionRepository {
  constructor(
    @InjectModel(SessionDocumentModel.name)
    private readonly sessionModel: Model<SessionDocumentModel>,
  ) {}

  async save(session: SessionEntity): Promise<SessionEntity> {
    const createdSession = await this.sessionModel.findOneAndUpdate(
      { sessionId: session.sessionId },
      {
        sessionId: session.sessionId,
        userId: session.userId,
        expiration: session.expiration,
        metadata: session.metadata,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    return new SessionEntity({
      sessionId: createdSession.sessionId,
      userId: createdSession.userId,
      expiration: createdSession.expiration,
      metadata: createdSession.metadata ?? {},
    });
  }
}
