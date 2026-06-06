export interface AuditEntityProps {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  companyId: string | null;
  departmentId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export class AuditEntity {
  readonly id: string;
  readonly actorId: string;
  readonly actorEmail: string;
  readonly actorRole: string;
  readonly companyId: string | null;
  readonly departmentId: string | null;
  readonly action: string;
  readonly entity: string;
  readonly entityId: string | null;
  readonly oldValue: Record<string, unknown> | null;
  readonly newValue: Record<string, unknown> | null;
  readonly metadata: Record<string, unknown> | null;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly createdAt: Date;

  constructor(props: AuditEntityProps) {
    this.id = props.id;
    this.actorId = props.actorId;
    this.actorEmail = props.actorEmail;
    this.actorRole = props.actorRole;
    this.companyId = props.companyId;
    this.departmentId = props.departmentId;
    this.action = props.action;
    this.entity = props.entity;
    this.entityId = props.entityId;
    this.oldValue = props.oldValue;
    this.newValue = props.newValue;
    this.metadata = props.metadata;
    this.ipAddress = props.ipAddress;
    this.userAgent = props.userAgent;
    this.createdAt = props.createdAt;
  }
}
