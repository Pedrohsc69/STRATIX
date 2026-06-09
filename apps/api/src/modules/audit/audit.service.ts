import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../core/shared/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import type {
  AuditLogInput,
  AuditLogListResult,
  AuditValue,
} from './audit.types';
import { AuditEntity } from './domain/entities/audit.entity';
import { AUDIT_REPOSITORY, AuditRepository } from './domain/repositories/audit.repository';
import { ListAuditLogsDto } from './dto/list-audit-logs.dto';

const SENSITIVE_KEY_PARTS = ['password', 'hash', 'token', 'jwt', 'authorization'];

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @Inject(AUDIT_REPOSITORY)
    private readonly auditRepository: AuditRepository,
    private readonly prisma: PrismaService,
  ) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      const createdAt = new Date();
      const audit = new AuditEntity({
        id: randomUUID(),
        actorId: input.actor.id,
        actorEmail: input.actor.email,
        actorRole: input.actor.role,
        companyId: input.companyId ?? null,
        departmentId: input.departmentId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        oldValue: this.sanitizeValue(input.oldValue),
        newValue: this.sanitizeValue(input.newValue),
        metadata: this.sanitizeValue(input.metadata),
        ipAddress: input.requestContext?.ipAddress ?? null,
        userAgent: input.requestContext?.userAgent ?? null,
        createdAt,
      });

      await this.auditRepository.save(audit);
    } catch (error) {
      this.logger.error(
        'Failed to persist audit log',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async list(
    actor: AuthenticatedUser,
    filters: ListAuditLogsDto,
  ): Promise<AuditLogListResult<Record<string, unknown>>> {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.sub },
      select: {
        companyId: true,
      },
    });

    if (!user?.companyId) {
      throw new NotFoundException('Company not found');
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const result = await this.auditRepository.findPaginated({
      companyId: user.companyId,
      action: filters.action,
      entity: filters.entity,
      actorId: filters.actorId,
      departmentId: filters.departmentId,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      page,
      limit,
    });

    return {
      items: result.items.map((item) => this.mapResponseItem(item)),
      page,
      limit,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / limit)),
    };
  }

  private mapResponseItem(item: AuditEntity) {
    return {
      id: item.id,
      actorId: item.actorId,
      actorEmail: item.actorEmail,
      actorRole: item.actorRole,
      companyId: item.companyId,
      departmentId: item.departmentId,
      action: item.action,
      entity: item.entity,
      entityId: item.entityId,
      oldValue: item.oldValue,
      newValue: item.newValue,
      metadata: item.metadata,
      ipAddress: item.ipAddress,
      userAgent: item.userAgent,
      createdAt: item.createdAt,
    };
  }

  private sanitizeValue(value: unknown): AuditValue {
    if (value == null) {
      return null;
    }

    if (Array.isArray(value)) {
      return {
        items: value
          .map((entry) => this.sanitizeUnknown(entry))
          .filter((entry) => entry !== undefined),
      };
    }

    if (typeof value !== 'object') {
      return {
        value: this.sanitizeUnknown(value),
      };
    }

    return this.sanitizeUnknown(value) as AuditValue;
  }

  private sanitizeUnknown(value: unknown): unknown {
    if (value == null) {
      return value;
    }

    if (Array.isArray(value)) {
      return value
        .map((entry) => this.sanitizeUnknown(entry))
        .filter((entry) => entry !== undefined);
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value !== 'object') {
      return value;
    }

    const sanitizedEntries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !this.isSensitiveKey(key))
      .map(([key, entryValue]) => [key, this.sanitizeUnknown(entryValue)] as const)
      .filter(([, entryValue]) => entryValue !== undefined);

    return Object.fromEntries(sanitizedEntries);
  }

  private isSensitiveKey(key: string) {
    const normalized = key.toLowerCase();
    return SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part));
  }
}
