import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuditController } from './interfaces/routes/audit.controller';

function createExecutionContext(
  handler: Function,
  role: UserRole,
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => AuditController,
    switchToHttp: () => ({
      getRequest: () => ({
        user: {
          sub: 'user-1',
          email: 'diretora@empresa.com',
          role,
        },
      }),
    }),
  } as ExecutionContext;
}

void test('AuditController marks listing as DIRECTOR-only', () => {
  const roles = Reflect.getMetadata(ROLES_KEY, AuditController.prototype.list) as UserRole[];
  assert.deepEqual(roles, [UserRole.DIRECTOR]);
});

void test('RolesGuard allows DIRECTOR and blocks MANAGER/EMPLOYEE on audit listing', () => {
  const guard = new RolesGuard(new Reflector());

  assert.equal(
    guard.canActivate(createExecutionContext(AuditController.prototype.list, UserRole.DIRECTOR)),
    true,
  );
  assert.equal(
    guard.canActivate(createExecutionContext(AuditController.prototype.list, UserRole.MANAGER)),
    false,
  );
  assert.equal(
    guard.canActivate(createExecutionContext(AuditController.prototype.list, UserRole.EMPLOYEE)),
    false,
  );
});

void test('AuditController forwards filters and paginated response', async () => {
  let receivedUser: Record<string, unknown> | undefined;
  let receivedQuery: Record<string, unknown> | undefined;

  const controller = new AuditController({
    list: async (user: Record<string, unknown>, query: Record<string, unknown>) => {
      receivedUser = user;
      receivedQuery = query;

      return {
        items: [
          {
            id: 'audit-1',
            action: 'INVITE_SENT',
          },
        ],
        page: 2,
        limit: 1,
        total: 1,
        totalPages: 1,
      };
    },
  } as never);

  const response = await controller.list(
    { sub: 'user-1', email: 'diretora@empresa.com', role: UserRole.DIRECTOR },
    { action: 'INVITE_SENT', page: 2, limit: 1 },
  );

  assert.equal(receivedUser?.sub, 'user-1');
  assert.equal(receivedQuery?.action, 'INVITE_SENT');
  assert.equal(receivedQuery?.page, 2);
  assert.equal(response.page, 2);
  assert.equal(response.limit, 1);
  assert.equal(response.items[0]?.action, 'INVITE_SENT');
});
