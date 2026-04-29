import test from 'node:test';
import assert from 'node:assert/strict';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { EmailService } from './email.service';

void test('EmailService sends invite emails with the configured frontend URL', async () => {
  const sentMessages: Array<Record<string, unknown>> = [];
  const configService = {
    getOrThrow: (key: string) => {
      const values: Record<string, string> = {
        RESEND_API_KEY: 'resend-key',
        FRONTEND_URL: 'http://localhost:5173',
        EMAIL_FROM: 'no-reply@stratix.test',
      };

      return values[key];
    },
  };

  const service = new EmailService(configService as ConfigService);
  (service as unknown as { resend: { emails: { send: (message: Record<string, unknown>) => Promise<void> } } }).resend = {
    emails: {
      send: async (message) => {
        sentMessages.push(message);
      },
    },
  };

  await service.sendInviteEmail({
    companyName: 'Empresa X',
    departmentName: 'Comercial',
    email: 'gestor@empresa.com',
    role: UserRole.MANAGER,
    token: 'token-123',
  });

  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0]?.to, 'gestor@empresa.com');
  assert.equal(sentMessages[0]?.from, 'no-reply@stratix.test');
  assert.match(String(sentMessages[0]?.html), /accept-invite\?token=token-123/);
});

void test('EmailService masks provider failures with a generic exception', async () => {
  const configService = {
    getOrThrow: (key: string) => {
      const values: Record<string, string> = {
        RESEND_API_KEY: 'resend-key',
        FRONTEND_URL: 'http://localhost:5173',
        EMAIL_FROM: 'no-reply@stratix.test',
      };

      return values[key];
    },
  };

  const service = new EmailService(configService as ConfigService);
  (service as unknown as { resend: { emails: { send: () => Promise<void> } } }).resend = {
    emails: {
      send: async () => {
        throw new Error('provider error');
      },
    },
  };

  await assert.rejects(
    () =>
      service.sendInviteEmail({
        companyName: 'Empresa X',
        departmentName: null,
        email: 'colaborador@empresa.com',
        role: UserRole.EMPLOYEE,
        token: 'token-123',
      }),
    InternalServerErrorException,
  );
});
