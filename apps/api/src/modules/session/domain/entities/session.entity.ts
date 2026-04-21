export interface SessionMetadata {
  [key: string]: unknown;
}

export interface SessionEntityProps {
  sessionId: string;
  userId: string;
  expiration: Date;
  metadata: SessionMetadata;
}

export class SessionEntity {
  readonly sessionId: string;
  readonly userId: string;
  readonly expiration: Date;
  readonly metadata: SessionMetadata;

  constructor(props: SessionEntityProps) {
    this.sessionId = props.sessionId;
    this.userId = props.userId;
    this.expiration = props.expiration;
    this.metadata = props.metadata;
  }
}
