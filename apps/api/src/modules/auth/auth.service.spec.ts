import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { AuthService } from './auth.service';

const createGoogleTokenServiceMock = () =>
  ({
    verifyCredential: async () => {
      throw new UnauthorizedException('Credencial do Google inválida.');
    },
  }) as never;

void test('AcceptInviteDto requires name during invite acceptance', async () => {
  const dto = plainToInstance(AcceptInviteDto, {
    token: 'token-123',
    password: '12345678',
    confirmPassword: '12345678',
  });

  const errors = await validate(dto);
  assert.equal(errors.some((error) => error.property === 'name'), true);
});

void test('AuthService registers a director with hashed password', async () => {
  let createdPassword = '';

  const prisma = {
    user: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email) {
          return null;
        }

        if (where.id === 'user-1') {
          return {
            id: 'user-1',
            name: 'Diretor',
            email: 'diretor@empresa.com',
            password: createdPassword,
            role: UserRole.DIRECTOR,
            status: UserStatus.ACTIVE,
            isActive: true,
            companyId: null,
            departmentId: null,
            company: null,
          };
        }

        return null;
      },
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
      update: async () => undefined,
    },
  };
  const jwtService = {
    signAsync: async () => 'token-1',
  };

  const service = new AuthService(
    prisma as never,
    jwtService as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    createGoogleTokenServiceMock(),
  );
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

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    createGoogleTokenServiceMock(),
  );

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
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email === 'diretor@empresa.com') {
          return {
            id: 'user-1',
            name: 'Diretor',
            email: 'diretor@empresa.com',
            password: await bcrypt.hash('senha-correta', 10),
            role: UserRole.DIRECTOR,
            status: UserStatus.ACTIVE,
            isActive: true,
            companyId: null,
            departmentId: null,
          };
        }

        if (where.id === 'user-1') {
          return {
            id: 'user-1',
            name: 'Diretor',
            email: 'diretor@empresa.com',
            password: await bcrypt.hash('senha-correta', 10),
            role: UserRole.DIRECTOR,
            status: UserStatus.ACTIVE,
            isActive: true,
            companyId: null,
            departmentId: null,
            company: null,
          };
        }

        return null;
      },
    },
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    createGoogleTokenServiceMock(),
  );

  await assert.rejects(
    () => service.login({ email: 'diretor@empresa.com', password: 'senha-errada' }),
    UnauthorizedException,
  );
});

void test('AuthService updates lastAccessAt on successful login', async () => {
  let updatedLastAccessAt: Date | undefined;
  const hashedPassword = await bcrypt.hash('senha123', 10);

  const prisma = {
    user: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email === 'diretor@empresa.com') {
          return {
            id: 'user-1',
            name: 'Diretor',
            email: 'diretor@empresa.com',
            password: hashedPassword,
            role: UserRole.DIRECTOR,
            status: UserStatus.ACTIVE,
            isActive: true,
            companyId: null,
            departmentId: null,
          };
        }

        if (where.id === 'user-1') {
          return {
            id: 'user-1',
            name: 'Diretor',
            email: 'diretor@empresa.com',
            password: hashedPassword,
            role: UserRole.DIRECTOR,
            status: UserStatus.ACTIVE,
            isActive: true,
            companyId: null,
            departmentId: null,
            company: null,
          };
        }

        return null;
      },
      update: async ({ data }: { data: { lastAccessAt: Date } }) => {
        updatedLastAccessAt = data.lastAccessAt;
      },
    },
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token-login' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    createGoogleTokenServiceMock(),
  );

  const response = await service.login({
    email: 'diretor@empresa.com',
    password: 'senha123',
  });

  assert.equal(response.accessToken, 'token-login');
  assert.equal(updatedLastAccessAt instanceof Date, true);
});

void test('AuthService logs in with Google for an active existing user without creating a new account', async () => {
  let updatedLastAccessAt: Date | undefined;
  let updatedAvatarUrl: string | undefined;
  let createdUser = false;

  const prisma = {
    user: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email === 'diretor@empresa.com') {
          return {
            id: 'user-google',
            name: 'Diretor Google',
            email: 'diretor@empresa.com',
            password: 'hashed-password',
            role: UserRole.DIRECTOR,
            status: UserStatus.ACTIVE,
            isActive: true,
            avatarUrl: null,
            companyId: null,
            departmentId: null,
          };
        }

        if (where.id === 'user-google') {
          return {
            id: 'user-google',
            name: 'Diretor Google',
            email: 'diretor@empresa.com',
            password: 'hashed-password',
            role: UserRole.DIRECTOR,
            status: UserStatus.ACTIVE,
            isActive: true,
            avatarUrl: updatedAvatarUrl ?? null,
            companyId: null,
            departmentId: null,
            company: null,
          };
        }

        return null;
      },
      update: async ({ data }: { data: { lastAccessAt?: Date; avatarUrl?: string } }) => {
        if (data.lastAccessAt) {
          updatedLastAccessAt = data.lastAccessAt;
        }

        if (data.avatarUrl) {
          updatedAvatarUrl = data.avatarUrl;
        }
      },
      create: async () => {
        createdUser = true;
      },
    },
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token-google' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    {
      verifyCredential: async () => ({
        email: 'Diretor@Empresa.com',
        emailVerified: true,
        name: 'Diretor Google',
        picture: 'https://lh3.googleusercontent.com/director.png',
        subject: 'google-sub-1',
      }),
    } as never,
  );

  const response = await service.loginWithGoogle({ credential: 'google-credential' });

  assert.equal(response.accessToken, 'token-google');
  assert.equal(response.user.email, 'diretor@empresa.com');
  assert.equal(response.user.avatarUrl, 'https://lh3.googleusercontent.com/director.png');
  assert.equal(createdUser, false);
  assert.equal(updatedLastAccessAt instanceof Date, true);
});

void test('AuthService rejects invalid Google credentials', async () => {
  const service = new AuthService(
    {
      user: {
        findUnique: async () => null,
      },
    } as never,
    { signAsync: async () => 'token' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    {
      verifyCredential: async () => {
        throw new UnauthorizedException('Credencial do Google inválida.');
      },
    } as never,
  );

  await assert.rejects(
    () => service.loginWithGoogle({ credential: 'invalid-google-token' }),
    UnauthorizedException,
  );
});

void test('AuthService rejects Google login when the e-mail is not verified', async () => {
  const service = new AuthService(
    {
      user: {
        findUnique: async () => null,
      },
    } as never,
    { signAsync: async () => 'token' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    {
      verifyCredential: async () => ({
        email: 'diretor@empresa.com',
        emailVerified: false,
        name: 'Diretor',
        picture: null,
        subject: 'google-sub-2',
      }),
    } as never,
  );

  await assert.rejects(
    () => service.loginWithGoogle({ credential: 'google-credential' }),
    UnauthorizedException,
  );
});

void test('AuthService rejects Google login when the local account does not exist', async () => {
  const service = new AuthService(
    {
      user: {
        findUnique: async () => null,
      },
    } as never,
    { signAsync: async () => 'token' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    {
      verifyCredential: async () => ({
        email: 'novo@empresa.com',
        emailVerified: true,
        name: 'Novo Usuário',
        picture: null,
        subject: 'google-sub-3',
      }),
    } as never,
  );

  await assert.rejects(async () => {
    await service.loginWithGoogle({ credential: 'google-credential' });
  }, (error: unknown) => {
    assert.equal(error instanceof NotFoundException, true);
    assert.equal(
      error instanceof NotFoundException ? error.message : '',
      'Conta não encontrada. Cadastre-se ou aceite um convite antes de entrar com Google.',
    );
    return true;
  });
});

void test('AuthService rejects Google login for inactive users', async () => {
  const service = new AuthService(
    {
      user: {
        findUnique: async () => ({
          id: 'user-inactive',
          name: 'Usuário Inativo',
          email: 'inativo@empresa.com',
          password: 'hashed-password',
          role: UserRole.MANAGER,
          status: UserStatus.DISABLED,
          isActive: false,
          companyId: 'company-1',
          departmentId: 'department-1',
        }),
      },
    } as never,
    { signAsync: async () => 'token' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    {
      verifyCredential: async () => ({
        email: 'inativo@empresa.com',
        emailVerified: true,
        name: 'Usuário Inativo',
        picture: null,
        subject: 'google-sub-4',
      }),
    } as never,
  );

  await assert.rejects(
    () => service.loginWithGoogle({ credential: 'google-credential' }),
    UnauthorizedException,
  );
});

void test('AuthService registers a director with Google and returns auth response', async () => {
  let createdData: Record<string, unknown> | null = null;
  let updatedLastAccessAt: Date | undefined;

  const prisma = {
    user: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email === 'diretor.google@empresa.com') {
          return null;
        }

        if (where.id === 'user-google-register') {
          return {
            id: 'user-google-register',
            name: 'Diretora Google',
            email: 'diretor.google@empresa.com',
            password: String(createdData?.password),
            role: UserRole.DIRECTOR,
            status: UserStatus.ACTIVE,
            isActive: true,
            companyId: null,
            departmentId: null,
            company: null,
          };
        }

        return null;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        createdData = data;

        return {
          id: 'user-google-register',
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          status: data.status,
          isActive: data.isActive,
          companyId: null,
          departmentId: null,
        };
      },
      update: async ({ data }: { data: { lastAccessAt: Date } }) => {
        updatedLastAccessAt = data.lastAccessAt;
      },
    },
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token-google-register' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    {
      verifyCredential: async () => ({
        email: ' Diretor.Google@Empresa.com ',
        emailVerified: true,
        name: 'Diretora Google',
        picture: 'https://lh3.googleusercontent.com/register.png',
        subject: 'google-sub-register',
      }),
    } as never,
  );

  const response = await service.registerDirectorWithGoogle({ credential: 'google-credential' });

  assert.equal(response.accessToken, 'token-google-register');
  assert.equal(response.user.email, 'diretor.google@empresa.com');
  assert.equal(response.user.name, 'Diretora Google');
  assert.equal(response.user.role, UserRole.DIRECTOR);
  assert.notEqual(createdData, null);
  const createdUserData = createdData as unknown as Record<string, unknown>;
  assert.equal(createdUserData.role, UserRole.DIRECTOR);
  assert.equal(createdUserData.status, UserStatus.ACTIVE);
  assert.equal(createdUserData.isActive, true);
  assert.equal(createdUserData.email, 'diretor.google@empresa.com');
  assert.equal(createdUserData.avatarUrl, 'https://lh3.googleusercontent.com/register.png');
  assert.notEqual(typeof createdUserData.password === 'string' ? createdUserData.password : '', '');
  assert.notEqual(createdUserData.password, 'google-credential');
  assert.equal(updatedLastAccessAt instanceof Date, true);
});

void test('AuthService rejects Google director registration when e-mail already exists', async () => {
  let createdUser = false;
  const service = new AuthService(
    {
      user: {
        findUnique: async ({ where }: { where: { email?: string } }) =>
          where.email === 'existente@empresa.com' ? { id: 'existing-user' } : null,
        create: async () => {
          createdUser = true;
        },
      },
    } as never,
    { signAsync: async () => 'token' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    {
      verifyCredential: async () => ({
        email: 'existente@empresa.com',
        emailVerified: true,
        name: 'Diretor Existente',
        picture: null,
        subject: 'google-sub-existing',
      }),
    } as never,
  );

  await assert.rejects(
    () => service.registerDirectorWithGoogle({ credential: 'google-credential' }),
    ConflictException,
  );
  assert.equal(createdUser, false);
});

void test('AuthService rejects Google director registration when e-mail is not verified', async () => {
  let userLookup = false;
  const service = new AuthService(
    {
      user: {
        findUnique: async () => {
          userLookup = true;
          return null;
        },
      },
    } as never,
    { signAsync: async () => 'token' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    {
      verifyCredential: async () => ({
        email: 'novo@empresa.com',
        emailVerified: false,
        name: 'Novo Diretor',
        picture: null,
        subject: 'google-sub-unverified',
      }),
    } as never,
  );

  await assert.rejects(
    () => service.registerDirectorWithGoogle({ credential: 'google-credential' }),
    UnauthorizedException,
  );
  assert.equal(userLookup, false);
});

void test('AuthService accepts a valid invite and activates the account', async () => {
  let createdPassword = '';
  const updatedDepartmentIds: string[] = [];
  const auditCommands: Array<Record<string, unknown>> = [];

  const prisma = {
    invite: {
      findUnique: async () => ({
        id: 'invite-1',
        email: 'gestor@empresa.com',
        role: UserRole.MANAGER,
        companyId: 'company-1',
        departmentId: 'department-1',
        token: 'token-123',
        accepted: false,
        expiresAt: new Date(Date.now() + 1000 * 60),
        company: { name: 'Empresa X' },
        department: { name: 'Comercial' },
      }),
      update: async () => undefined,
    },
    user: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email === 'gestor@empresa.com') {
          return null;
        }

        if (where.id === 'user-2') {
          return {
            id: 'user-2',
            name: 'Gestor Comercial',
            email: 'gestor@empresa.com',
            password: createdPassword,
            role: UserRole.MANAGER,
            status: UserStatus.ACTIVE,
            isActive: true,
            companyId: 'company-1',
            departmentId: 'department-1',
            company: {
              id: 'company-1',
              name: 'Empresa X',
              businessArea: 'Tecnologia',
            },
          };
        }

        return null;
      },
      update: async () => undefined,
    },
    $transaction: async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
      callback({
        department: {
          findUnique: async () => ({
            id: 'department-1',
            companyId: 'company-1',
            managerId: null,
          }),
          update: async ({ where }: { where: { id: string } }) => {
            updatedDepartmentIds.push(where.id);
          },
        },
        user: {
          create: async ({ data }: { data: Record<string, unknown> }) => {
            createdPassword = String(data.password);
            return {
              id: 'user-2',
              name: data.name,
              email: data.email,
              password: data.password,
              role: data.role,
              status: UserStatus.ACTIVE,
              isActive: true,
              companyId: data.companyId,
              departmentId: data.departmentId,
            };
          },
        },
        invite: {
          update: async () => undefined,
        },
      }),
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token-accepted' } as never,
    {
      log: async (command: Record<string, unknown>) => {
        auditCommands.push(command);
      },
    } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    createGoogleTokenServiceMock(),
  );

  const response = await service.acceptInvite({
    name: 'Gestor Comercial',
    token: 'token-123',
    password: '12345678',
    confirmPassword: '12345678',
  });

  assert.equal(response.accessToken, 'token-accepted');
  assert.equal(response.user.name, 'Gestor Comercial');
  assert.equal(response.user.email, 'gestor@empresa.com');
  assert.equal(response.user.role, UserRole.MANAGER);
  assert.equal(response.user.companyId, 'company-1');
  assert.equal(response.user.departmentId, 'department-1');
  assert.deepEqual(updatedDepartmentIds, ['department-1']);
  assert.equal(await bcrypt.compare('12345678', createdPassword), true);
  assert.equal(auditCommands[0]?.action, 'INVITE_ACCEPTED');
});

void test('AuthService accepts an employee invite without changing the department manager', async () => {
  const updatedDepartmentIds: string[] = [];

  const prisma = {
    invite: {
      findUnique: async () => ({
        id: 'invite-employee',
        email: 'colaborador@empresa.com',
        role: UserRole.EMPLOYEE,
        companyId: 'company-1',
        departmentId: 'department-1',
        token: 'token-employee',
        accepted: false,
        expiresAt: new Date(Date.now() + 1000 * 60),
        company: { name: 'Empresa X' },
        department: { name: 'Comercial' },
      }),
      update: async () => undefined,
    },
    user: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email === 'colaborador@empresa.com') {
          return null;
        }

        if (where.id === 'user-employee') {
          return {
            id: 'user-employee',
            name: 'Colaborador',
            email: 'colaborador@empresa.com',
            password: 'hashed',
            role: UserRole.EMPLOYEE,
            status: UserStatus.ACTIVE,
            isActive: true,
            companyId: 'company-1',
            departmentId: 'department-1',
            company: {
              id: 'company-1',
              name: 'Empresa X',
              businessArea: 'Tecnologia',
            },
          };
        }

        return null;
      },
      update: async () => undefined,
    },
    $transaction: async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
      callback({
        department: {
          findUnique: async () => ({
            id: 'department-1',
            companyId: 'company-1',
            managerId: 'manager-1',
          }),
          update: async ({ where }: { where: { id: string } }) => {
            updatedDepartmentIds.push(where.id);
          },
        },
        user: {
          create: async ({ data }: { data: Record<string, unknown> }) => ({
            id: 'user-employee',
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role,
            status: UserStatus.ACTIVE,
            isActive: true,
            companyId: data.companyId,
            departmentId: data.departmentId,
          }),
        },
        invite: {
          update: async () => undefined,
        },
      }),
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token-employee' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    createGoogleTokenServiceMock(),
  );

  const response = await service.acceptInvite({
    name: 'Colaborador',
    token: 'token-employee',
    password: '12345678',
    confirmPassword: '12345678',
  });

  assert.equal(response.user.name, 'Colaborador');
  assert.equal(response.user.email, 'colaborador@empresa.com');
  assert.equal(response.user.role, UserRole.EMPLOYEE);
  assert.equal(response.user.departmentId, 'department-1');
  assert.deepEqual(updatedDepartmentIds, []);
});

void test('AuthService rejects manager invites when the department already has a manager', async () => {
  const prisma = {
    invite: {
      findUnique: async () => ({
        id: 'invite-1',
        email: 'gestor@empresa.com',
        role: UserRole.MANAGER,
        companyId: 'company-1',
        departmentId: 'department-1',
        token: 'token-123',
        accepted: false,
        expiresAt: new Date(Date.now() + 1000 * 60),
        company: { name: 'Empresa X' },
        department: { name: 'Comercial' },
      }),
    },
    user: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email) {
          return null;
        }

        return null;
      },
    },
    $transaction: async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
      callback({
        department: {
          findUnique: async () => ({
            id: 'department-1',
            companyId: 'company-1',
            managerId: 'existing-manager',
          }),
        },
        user: {
          create: async () => {
            throw new Error('should not create user');
          },
        },
        invite: {
          update: async () => undefined,
        },
      }),
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token-accepted' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    createGoogleTokenServiceMock(),
  );

  await assert.rejects(
    () =>
      service.acceptInvite({
        name: 'Gestor Comercial',
        token: 'token-123',
        password: '12345678',
        confirmPassword: '12345678',
      }),
    ConflictException,
  );
});

void test('AuthService rejects invites when department data is inconsistent with invite company', async () => {
  const prisma = {
    invite: {
      findUnique: async () => ({
        id: 'invite-1',
        email: 'gestor@empresa.com',
        role: UserRole.MANAGER,
        companyId: 'company-1',
        departmentId: 'department-1',
        token: 'token-123',
        accepted: false,
        expiresAt: new Date(Date.now() + 1000 * 60),
        company: { name: 'Empresa X' },
        department: { name: 'Comercial' },
      }),
    },
    user: {
      findUnique: async () => null,
    },
    $transaction: async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
      callback({
        department: {
          findUnique: async () => ({
            id: 'department-1',
            companyId: 'company-2',
            managerId: null,
          }),
        },
        user: {
          create: async () => {
            throw new Error('should not create user');
          },
        },
        invite: {
          update: async () => undefined,
        },
      }),
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token-accepted' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    createGoogleTokenServiceMock(),
  );

  await assert.rejects(
    () =>
      service.acceptInvite({
        name: 'Gestor Comercial',
        token: 'token-123',
        password: '12345678',
        confirmPassword: '12345678',
      }),
    BadRequestException,
  );
});

void test('AuthService rejects expired invites and removes the token', async () => {
  const deletedInviteIds: string[] = [];

  const prisma = {
    invite: {
      findUnique: async () => ({
        id: 'invite-expired',
        email: 'colaborador@empresa.com',
        role: UserRole.EMPLOYEE,
        companyId: 'company-1',
        departmentId: 'department-1',
        token: 'expired-token',
        accepted: false,
        expiresAt: new Date(Date.now() - 1000),
        company: { name: 'Empresa X' },
        department: { name: 'Operações' },
      }),
      delete: async ({ where }: { where: { id: string } }) => {
        deletedInviteIds.push(where.id);
      },
    },
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    createGoogleTokenServiceMock(),
  );

  await assert.rejects(
    () => service.getInviteDetails('expired-token'),
    BadRequestException,
  );

  assert.deepEqual(deletedInviteIds, ['invite-expired']);
});

void test('AuthService changes the password when the current password is correct', async () => {
  let updatedPassword = '';
  const auditCommands: Array<Record<string, unknown>> = [];

  const prisma = {
    user: {
      findUnique: async () => ({
        id: 'user-1',
        name: 'Diretor',
        email: 'diretor@empresa.com',
        password: await bcrypt.hash('senha123', 10),
        role: UserRole.DIRECTOR,
        status: UserStatus.ACTIVE,
        isActive: true,
        companyId: null,
        departmentId: null,
      }),
      update: async ({ data }: { data: { password: string } }) => {
        updatedPassword = data.password;
      },
    },
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token' } as never,
    {
      log: async (command: Record<string, unknown>) => {
        auditCommands.push(command);
      },
    } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    createGoogleTokenServiceMock(),
  );

  const response = await service.changePassword(
    { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
    {
      currentPassword: 'senha123',
      newPassword: 'novaSenha1',
      confirmPassword: 'novaSenha1',
    },
  );

  assert.equal(response.success, true);
  assert.equal(await bcrypt.compare('novaSenha1', updatedPassword), true);
  assert.equal('password' in response, false);
  assert.equal(auditCommands[0]?.action, 'PASSWORD_CHANGED');
  assert.equal(JSON.stringify(auditCommands[0]).includes('password'), false);
  assert.equal(JSON.stringify(auditCommands[0]).includes('hash'), false);
});

void test('AuthService rejects password change with incorrect current password', async () => {
  const prisma = {
    user: {
      findUnique: async () => ({
        id: 'user-1',
        name: 'Diretor',
        email: 'diretor@empresa.com',
        password: await bcrypt.hash('senha123', 10),
        role: UserRole.DIRECTOR,
        status: UserStatus.ACTIVE,
        isActive: true,
        companyId: null,
        departmentId: null,
      }),
    },
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    createGoogleTokenServiceMock(),
  );

  await assert.rejects(
    () =>
      service.changePassword(
        { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
        {
          currentPassword: 'errada',
          newPassword: 'novaSenha1',
          confirmPassword: 'novaSenha1',
        },
      ),
    UnauthorizedException,
  );
});

void test('AuthService rejects password change when the new password is equal to the current one', async () => {
  const currentHash = await bcrypt.hash('senha123', 10);
  const prisma = {
    user: {
      findUnique: async () => ({
        id: 'user-1',
        name: 'Diretor',
        email: 'diretor@empresa.com',
        password: currentHash,
        role: UserRole.DIRECTOR,
        status: UserStatus.ACTIVE,
        isActive: true,
        companyId: null,
        departmentId: null,
      }),
    },
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    createGoogleTokenServiceMock(),
  );

  await assert.rejects(
    () =>
      service.changePassword(
        { sub: 'user-1', email: 'diretor@empresa.com', role: UserRole.DIRECTOR },
        {
          currentPassword: 'senha123',
          newPassword: 'senha123',
          confirmPassword: 'senha123',
        },
      ),
    BadRequestException,
  );
});

void test('AuthService forgotPassword returns a generic response and sends email when the account exists', async () => {
  const sentEmails: Array<Record<string, unknown>> = [];
  let createdTokenHash = '';

  const prisma = {
    user: {
      findUnique: async () => ({
        id: 'user-1',
        name: 'Diretor',
        email: 'diretor@empresa.com',
        password: 'hashed',
        role: UserRole.DIRECTOR,
        status: UserStatus.ACTIVE,
        isActive: true,
        companyId: 'company-1',
        departmentId: null,
        company: {
          name: 'Empresa X',
        },
      }),
    },
    passwordResetToken: {
      deleteMany: async () => undefined,
      create: async ({ data }: { data: { tokenHash: string } }) => {
        createdTokenHash = data.tokenHash;
      },
    },
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token' } as never,
    { log: async () => undefined } as never,
    {
      sendPasswordResetEmail: async (payload: Record<string, unknown>) => {
        sentEmails.push(payload);
      },
    } as never,
    createGoogleTokenServiceMock(),
  );

  const response = await service.forgotPassword({ email: 'diretor@empresa.com' });

  assert.equal(response.success, true);
  assert.equal(sentEmails.length, 1);
  assert.equal(createdTokenHash.length > 0, true);
});

void test('AuthService forgotPassword returns a generic response when the account does not exist', async () => {
  const service = new AuthService(
    {
      user: {
        findUnique: async () => null,
      },
    } as never,
    { signAsync: async () => 'token' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    createGoogleTokenServiceMock(),
  );

  const response = await service.forgotPassword({ email: 'naoexiste@empresa.com' });

  assert.equal(response.success, true);
  assert.match(response.message, /recovery link/i);
});

void test('AuthService resetPassword updates the hash with a valid token and blocks reused tokens', async () => {
  let updatedPassword = '';
  let usedResetTokenId = '';
  const currentHash = await bcrypt.hash('senha123', 10);

  const resetToken = {
    id: 'reset-1',
    userId: 'user-1',
    tokenHash: 'hashed-token',
    expiresAt: new Date(Date.now() + 1000 * 60),
    usedAt: null,
    user: {
      id: 'user-1',
      email: 'diretor@empresa.com',
      password: currentHash,
    },
  };

  const prisma = {
    passwordResetToken: {
      findUnique: async ({ where }: { where: { tokenHash: string } }) => {
        if (where.tokenHash === createHash('sha256').update('token-bruto').digest('hex')) {
          return resetToken;
        }

        return {
          ...resetToken,
          usedAt: new Date(),
        };
      },
    },
    $transaction: async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
      callback({
        user: {
          update: async ({ data }: { data: { password: string } }) => {
            updatedPassword = data.password;
          },
        },
        passwordResetToken: {
          update: async ({ where }: { where: { id: string } }) => {
            usedResetTokenId = where.id;
          },
          updateMany: async () => undefined,
        },
      }),
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    createGoogleTokenServiceMock(),
  );

  await service.resetPassword({
    token: 'token-bruto',
    newPassword: 'novaSenha1',
    confirmPassword: 'novaSenha1',
  });

  assert.equal(await bcrypt.compare('novaSenha1', updatedPassword), true);
  assert.equal(usedResetTokenId, 'reset-1');

  await assert.rejects(
    () =>
      service.resetPassword({
        token: 'token-usado',
        newPassword: 'novaSenha1',
        confirmPassword: 'novaSenha1',
      }),
    BadRequestException,
  );
});

void test('AuthService rejects expired reset tokens', async () => {
  const prisma = {
    passwordResetToken: {
      findUnique: async () => ({
        id: 'reset-1',
        userId: 'user-1',
        tokenHash: 'hashed',
        expiresAt: new Date(Date.now() - 1000),
        usedAt: null,
        user: {
          id: 'user-1',
          email: 'diretor@empresa.com',
          password: await bcrypt.hash('senha123', 10),
        },
      }),
    },
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: async () => 'token' } as never,
    { log: async () => undefined } as never,
    { sendPasswordResetEmail: async () => undefined } as never,
    createGoogleTokenServiceMock(),
  );

  await assert.rejects(
    () =>
      service.resetPassword({
        token: 'token-expirado',
        newPassword: 'novaSenha1',
        confirmPassword: 'novaSenha1',
      }),
    BadRequestException,
  );
});
