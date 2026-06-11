import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

type GoogleIdentity = {
  email: string;
  emailVerified: boolean;
  name: string | null;
  subject: string;
};

@Injectable()
export class GoogleTokenService {
  private readonly clientId: string | null;
  private readonly client: OAuth2Client | null;

  constructor(configService: ConfigService) {
    const clientId = configService.get<string>('GOOGLE_CLIENT_ID')?.trim();
    this.clientId = clientId || null;
    this.client = this.clientId ? new OAuth2Client(this.clientId) : null;
  }

  async verifyCredential(credential: string): Promise<GoogleIdentity> {
    if (!this.clientId || !this.client) {
      throw new UnauthorizedException('Login com Google indisponível nesta configuração.');
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken: credential,
        audience: this.clientId,
      });
      const payload = ticket.getPayload();

      if (!payload?.email || !payload.sub) {
        throw new UnauthorizedException('Credencial do Google inválida.');
      }

      const issuer = payload.iss;
      if (issuer !== 'accounts.google.com' && issuer !== 'https://accounts.google.com') {
        throw new UnauthorizedException('Credencial do Google inválida.');
      }

      return {
        email: payload.email,
        emailVerified: payload.email_verified === true,
        name: payload.name ?? null,
        subject: payload.sub,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Credencial do Google inválida.');
    }
  }
}
