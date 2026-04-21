export interface EventMetadata {
  [key: string]: unknown;
}

export interface EventEntityProps {
  id: string;
  type: string;
  source: string;
  status: string;
  occurredAt: Date;
  metadata: EventMetadata;
}

export class EventEntity {
  readonly id: string;
  readonly type: string;
  readonly source: string;
  readonly status: string;
  readonly occurredAt: Date;
  readonly metadata: EventMetadata;

  constructor(props: EventEntityProps) {
    this.id = props.id;
    this.type = props.type;
    this.source = props.source;
    this.status = props.status;
    this.occurredAt = props.occurredAt;
    this.metadata = props.metadata;
  }
}
