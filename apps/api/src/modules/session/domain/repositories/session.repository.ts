import { SessionEntity } from '../entities/session.entity';

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');

export interface SessionRepository {
  save(session: SessionEntity): Promise<SessionEntity>;
}
