import test from 'node:test';
import assert from 'node:assert/strict';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

void test('AuthService registers a director with hashed password', async () => {
  let createdPassword = '';

  const prisma = {
    user: {
      findUnique: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        createdPassword = String(data.password);

        return {
          id: 'user-1',
          name: data.name,
          email: data.email,
          password: data.password,
          role: UserRole.DIRECTOR,
          status: UserStatus.ACTIVE,
          isActive: true,
          companyId: null,
          departmentId: null,
        };
      },
    },
  };
  const jwtService = {
    signAsync: async () => 'token-1',
  };

  const service = new AuthService(prisma as never, jwtService as never);
  const response = await service.registerDirector({
    name: 'Diretor',
    email: 'diretor@empresa.com',
    password: '12345678',
    confirmPassword: '12345678',
  });

  assert.equal(response.accessToken, 'token-1');
  assert.equal(response.user.role, UserRole.DIRECTOR);
  assert.notEqual(createdPassword, '12345678');
  assert.equal(await bcrypt.compare('12345678', createdPassword), true);
});

void test('AuthService rejects duplicate director e-mail', async () => {
  const prisma = {
    user: {
      findUnique: async () => ({ id: 'existing-user' }),
    },
  };

  const service = new AuthService(prisma as never, { signAsync: async () => 'token' } as never);

  await assert.rejects(
    () =>
      service.registerDirector({
        name: 'Diretor',
        email: 'diretor@empresa.com',
        password: '12345678',
        confirmPassword: '12345678',
      }),
    ConflictException,
  );
});

void test('AuthService rejects invalid login credentials', async () => {
  const prisma = {
    user: {
      findUnique: async () => ({
        id: 'user-1',
        name: 'Diretor',
        email: 'diretor@empresa.com',
        password: await bcrypt.hash('senha-correta', 10),
        role: UserRole.DIRECTOR,
        status: UserStatus.ACTIVE,
        isActive: true,
        companyId: null,
        departmentId: null,
      }),
    },
  };

  const service = new AuthService(prisma as never, { signAsync: async () => 'token' } as never);

  await assert.rejects(
    () => service.login({ email: 'diretor@empresa.com', password: 'senha-errada' }),
    UnauthorizedException,
  );
});
