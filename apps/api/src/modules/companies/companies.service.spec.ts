import test from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { CompaniesService } from './companies.service';

void test('CompaniesService links a company to the authenticated director', async () => {
  const prisma = {
    user: {
      findUnique: async () => ({ id: 'user-1', companyId: null }),
    },
    company: {
      findUnique: async () => null,
    },
    $transaction: async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
      callback({
        company: {
          create: async ({ data }: { data: Record<string, unknown> }) => ({
            id: 'company-1',
            ...data,
          }),
        },
        user: {
          update: async () => undefined,
        },
      }),
  };

  const service = new CompaniesService(prisma as never);
  const company = await service.create(
    { sub: 'user-1', email: 'diretor@empresa.com', role: 'DIRECTOR' as never },
    {
      name: 'Empresa X',
      cnpj: '12345678000199',
      businessArea: 'Tecnologia',
    },
  );

  assert.equal((company as { id: string }).id, 'company-1');
});

void test('CompaniesService blocks directors that already have a company', async () => {
  const prisma = {
    user: {
      findUnique: async () => ({ id: 'user-1', companyId: 'company-1' }),
    },
  };

  const service = new CompaniesService(prisma as never);

  await assert.rejects(
    () =>
      service.create(
        { sub: 'user-1', email: 'diretor@empresa.com', role: 'DIRECTOR' as never },
        {
          name: 'Empresa X',
          cnpj: '12345678000199',
          businessArea: 'Tecnologia',
        },
      ),
    BadRequestException,
  );
});

void test('CompaniesService rejects duplicate CNPJ', async () => {
  const prisma = {
    user: {
      findUnique: async () => ({ id: 'user-1', companyId: null }),
    },
    company: {
      findUnique: async () => ({ id: 'company-1' }),
    },
  };

  const service = new CompaniesService(prisma as never);

  await assert.rejects(
    () =>
      service.create(
        { sub: 'user-1', email: 'diretor@empresa.com', role: 'DIRECTOR' as never },
        {
          name: 'Empresa X',
          cnpj: '12345678000199',
          businessArea: 'Tecnologia',
        },
      ),
    ConflictException,
  );
});
