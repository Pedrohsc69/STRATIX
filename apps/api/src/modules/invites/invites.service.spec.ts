import test from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { InvitesService } from './invites.service';

void test('InvitesService requires at least one department before creating invites', async () => {
  const prisma = {
    user: {
      findUnique: async () => ({ companyId: 'company-1' }),
    },
    department: {
      count: async () => 0,
    },
  };

  const service = new InvitesService(prisma as never);

  await assert.rejects(
    () =>
      service.create(
        { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
        {
          email: 'colaborador@empresa.com',
          role: UserRole.EMPLOYEE,
          departmentId: 'department-1',
        },
      ),
    BadRequestException,
  );
});

void test('InvitesService rejects director invites', async () => {
  const service = new InvitesService({} as never);

  await assert.rejects(
    () =>
      service.create(
        { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
        {
          email: 'gestor@empresa.com',
          role: UserRole.DIRECTOR,
          departmentId: 'department-1',
        },
      ),
    BadRequestException,
  );
});

void test('InvitesService rejects duplicate invite e-mail', async () => {
  const prisma = {
    user: {
      findUnique: async ({ where }: { where?: { id?: string; email?: string } }) => {
        if (where?.id) {
          return { companyId: 'company-1' };
        }

        return null;
      },
    },
    department: {
      count: async () => 1,
      findFirst: async () => ({ id: 'department-1' }),
    },
    invite: {
      findUnique: async () => ({ id: 'invite-1' }),
    },
  };

  const service = new InvitesService(prisma as never);

  await assert.rejects(
    () =>
      service.create(
        { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
        {
          email: 'gestor@empresa.com',
          role: UserRole.MANAGER,
          departmentId: 'department-1',
        },
      ),
    ConflictException,
  );
});
