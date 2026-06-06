import type { AuditRequestContext } from './audit.types';

export type AuditRequestLike = {
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
  headers?: Record<string, string | string[] | undefined>;
};

export function extractAuditRequestContext(request: AuditRequestLike): AuditRequestContext {
  const userAgentHeader = request.headers?.['user-agent'];

  return {
    ipAddress: request.ip ?? request.socket?.remoteAddress ?? null,
    userAgent: Array.isArray(userAgentHeader) ? userAgentHeader[0] : userAgentHeader ?? null,
  };
}
