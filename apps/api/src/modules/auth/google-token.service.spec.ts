import test from 'node:test';
import assert from 'node:assert/strict';
import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { GoogleTokenService } from './google-token.service';

void test('GoogleTokenService rejects login when GOOGLE_CLIENT_ID is not configured', async () => {
  const service = new GoogleTokenService({
    get: () => undefined,
  } as never);

  await assert.rejects(
    () => service.verifyCredential('credential'),
    (error: unknown) => {
      assert.equal(error instanceof ServiceUnavailableException, true);
      assert.equal(
        error instanceof ServiceUnavailableException ? error.message : '',
        'Login com Google indisponível nesta configuração.',
      );
      return true;
    },
  );
});

void test('GoogleTokenService accepts both Google issuers and normalizes the e-mail', async () => {
  const service = new GoogleTokenService({
    get: () => 'google-client-id.apps.googleusercontent.com',
  } as never);

  Object.assign(service as object, {
    client: {
      verifyIdToken: async () => ({
        getPayload: () => ({
          email: '  Stratix05@Gmail.com ',
          email_verified: true,
          iss: 'https://accounts.google.com',
          name: 'STRATIX',
          sub: 'google-subject-1',
        }),
      }),
    },
  });

  const identity = await service.verifyCredential('credential');

  assert.deepEqual(identity, {
    email: 'stratix05@gmail.com',
    emailVerified: true,
    name: 'STRATIX',
    subject: 'google-subject-1',
  });
});

void test('GoogleTokenService reports invalid audience with a specific message', async () => {
  const service = new GoogleTokenService({
    get: () => 'google-client-id.apps.googleusercontent.com',
  } as never);

  Object.assign(service as object, {
    client: {
      verifyIdToken: async () => {
        throw new Error('Wrong recipient, payload audience != requiredAudience');
      },
    },
  });

  await assert.rejects(
    () => service.verifyCredential('credential'),
    (error: unknown) => {
      assert.equal(error instanceof UnauthorizedException, true);
      assert.equal(
        error instanceof UnauthorizedException ? error.message : '',
        'Credencial do Google incompatível com esta aplicação.',
      );
      return true;
    },
  );
});
