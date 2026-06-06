import test from 'node:test';
import assert from 'node:assert/strict';
import { UserRole } from '@prisma/client';
import { AuditService } from './audit.service';

void test('AuditService creates a log with complete fields', async () => {
  let savedAudit: Record<string, unknown> | undefined;

  const service = new AuditService(
    {
      save: async (audit: Record<string, unknown>) => {
        savedAudit = audit;
        return audit;
      },
      findPaginated: async () => ({
        items: [],
        total: 0,
      }),
    } as never,
    {} as never,
  );

  await service.log({
    actor: {
      id: 'user-1',
      email: 'diretora@empresa.com',
      role: UserRole.DIRECTOR,
    },
    action: 'DEPARTMENT_CREATED',
    entity: 'DEPARTMENT',
    entityId: 'department-1',
    companyId: 'company-1',
    departmentId: 'department-1',
    oldValue: null,
    newValue: {
      name: 'Operacoes',
    },
    metadata: {
      source: 'test',
    },
    requestContext: {
      ipAddress: '127.0.0.1',
      userAgent: 'node-test',
    },
  });

  assert.equal(savedAudit?.actorId, 'user-1');
  assert.equal(savedAudit?.actorEmail, 'diretora@empresa.com');
  assert.equal(savedAudit?.actorRole, UserRole.DIRECTOR);
  assert.equal(savedAudit?.companyId, 'company-1');
  assert.equal(savedAudit?.departmentId, 'department-1');
  assert.equal(savedAudit?.entityId, 'department-1');
  assert.equal(savedAudit?.ipAddress, '127.0.0.1');
  assert.equal(savedAudit?.userAgent, 'node-test');
  assert.equal(savedAudit?.createdAt instanceof Date, true);
});

void test('AuditService sanitizes sensitive fields from audit payloads', async () => {
  let savedAudit: Record<string, unknown> | undefined;

  const service = new AuditService(
    {
      save: async (audit: Record<string, unknown>) => {
        savedAudit = audit;
        return audit;
      },
      findPaginated: async () => ({
        items: [],
        total: 0,
      }),
    } as never,
    {} as never,
  );

  await service.log({
    actor: {
      id: 'user-1',
      email: 'diretora@empresa.com',
      role: UserRole.DIRECTOR,
    },
    action: 'PASSWORD_CHANGED',
    entity: 'USER',
    companyId: 'company-1',
    oldValue: {
      password: 'old-secret',
      profile: {
        tokenHash: '123',
        safe: 'ok',
      },
    },
    newValue: {
      hash: 'new-hash',
      avatarUrl: 'https://cdn/avatar.png',
    },
    metadata: {
      inviteId: 'invite-1',
      token: 'raw-token',
      nested: {
        jwt: 'jwt-token',
      },
    },
  });

  const oldValue = savedAudit?.oldValue as Record<string, unknown>;
  const newValue = savedAudit?.newValue as Record<string, unknown>;
  const metadata = savedAudit?.metadata as Record<string, unknown>;

  assert.equal('password' in oldValue, false);
  assert.equal('tokenHash' in (oldValue.profile as Record<string, unknown>), false);
  assert.equal((oldValue.profile as Record<string, unknown>).safe, 'ok');
  assert.equal('hash' in newValue, false);
  assert.equal(newValue.avatarUrl, 'https://cdn/avatar.png');
  assert.equal('token' in metadata, false);
  assert.equal('jwt' in (metadata.nested as Record<string, unknown>), false);
});

void test('AuditService does not throw when the repository fails', async () => {
  const service = new AuditService(
    {
      save: async () => {
        throw new Error('mongo down');
      },
      findPaginated: async () => ({
        items: [],
        total: 0,
      }),
    } as never,
    {} as never,
  );

  await assert.doesNotReject(() =>
    service.log({
      actor: {
        id: 'user-1',
        email: 'diretora@empresa.com',
        role: UserRole.DIRECTOR,
      },
      action: 'SETTINGS_UPDATED',
      entity: 'SETTINGS',
      companyId: 'company-1',
    }),
  );
});

void test('AuditService scopes listing to the actor company and keeps pagination', async () => {
  let receivedFilters: Record<string, unknown> | undefined;

  const service = new AuditService(
    {
      save: async (audit: Record<string, unknown>) => audit,
      findPaginated: async (filters: Record<string, unknown>) => {
        receivedFilters = filters;
        return {
          items: [
            {
              id: 'audit-1',
              actorId: 'user-1',
              actorEmail: 'diretora@empresa.com',
              actorRole: UserRole.DIRECTOR,
              companyId: 'company-1',
              departmentId: 'department-1',
              action: 'INVITE_SENT',
              entity: 'INVITE',
              entityId: 'invite-1',
              oldValue: null,
              newValue: { inviteId: 'invite-1' },
              metadata: null,
              ipAddress: null,
              userAgent: null,
              createdAt: new Date('2026-06-05T10:00:00.000Z'),
            },
          ],
          total: 1,
        };
      },
    } as never,
    {
      user: {
        findUnique: async () => ({
          companyId: 'company-1',
        }),
      },
    } as never,
  );

  const response = await service.list(
    { sub: 'user-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
    { action: 'INVITE_SENT', page: 2, limit: 5 },
  );

  assert.equal(receivedFilters?.companyId, 'company-1');
  assert.equal(receivedFilters?.action, 'INVITE_SENT');
  assert.equal(receivedFilters?.page, 2);
  assert.equal(receivedFilters?.limit, 5);
  assert.equal(response.page, 2);
  assert.equal(response.limit, 5);
  assert.equal(response.total, 1);
  assert.equal(response.items[0]?.action, 'INVITE_SENT');
});
