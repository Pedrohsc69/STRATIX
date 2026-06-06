import type { UserRole } from '@prisma/client';

export type AuditValue = Record<string, unknown> | null;

export type AuditActor = {
  id: string;
  email: string;
  role: UserRole | string;
};

export type AuditRequestContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AuditLogInput = {
  actor: AuditActor;
  action: string;
  entity: string;
  entityId?: string | null;
  companyId?: string | null;
  departmentId?: string | null;
  oldValue?: AuditValue;
  newValue?: AuditValue;
  metadata?: AuditValue;
  requestContext?: AuditRequestContext | null;
};

export type AuditLogFilters = {
  companyId: string;
  action?: string;
  entity?: string;
  actorId?: string;
  departmentId?: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
};

export type AuditLogListResult<TItem> = {
  items: TItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
