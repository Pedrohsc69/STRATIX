export interface AuditMetadata {
  [key: string]: unknown;
}

export interface AuditEntityProps {
  id: string;
  userId: string;
  action: string;
  entity: string;
  timestamp: Date;
  metadata: AuditMetadata;
}

export class AuditEntity {
  readonly id: string;
  readonly userId: string;
  readonly action: string;
  readonly entity: string;
  readonly timestamp: Date;
  readonly metadata: AuditMetadata;

  constructor(props: AuditEntityProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.action = props.action;
    this.entity = props.entity;
    this.timestamp = props.timestamp;
    this.metadata = props.metadata;
  }
}
