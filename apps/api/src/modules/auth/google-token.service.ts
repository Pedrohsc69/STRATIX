import { Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
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
  private readonly logger = new Logger(GoogleTokenService.name);
  private readonly clientId: string | null;
  private readonly client: OAuth2Client | null;

  constructor(configService: ConfigService) {
    const clientId = configService.get<string>('GOOGLE_CLIENT_ID')?.trim();
    this.clientId = clientId || null;
    this.client = this.clientId ? new OAuth2Client(this.clientId) : null;

    if (!this.clientId) {
      this.logger.warn('GOOGLE_CLIENT_ID is not configured. Google login is disabled.');
    }
  }

  async verifyCredential(credential: string): Promise<GoogleIdentity> {
    if (!this.clientId || !this.client) {
      this.logger.warn(
        'Google login rejected: missing_google_client_id. Configure GOOGLE_CLIENT_ID in the API environment.',
      );
      throw new ServiceUnavailableException('Login com Google indisponível nesta configuração.');
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken: credential,
        audience: this.clientId,
      });
      const payload = ticket.getPayload();

      if (!payload?.email || !payload.sub) {
        this.logger.warn('Google login rejected: missing_email_or_subject_in_token_payload.');
        throw new UnauthorizedException('Credencial do Google inválida.');
      }

      const issuer = payload.iss;
      if (issuer !== 'accounts.google.com' && issuer !== 'https://accounts.google.com') {
        this.logger.warn(`Google login rejected: invalid_issuer issuer=${issuer ?? 'unknown'}`);
        throw new UnauthorizedException('Origem da credencial do Google inválida.');
      }

      return {
        email: payload.email.trim().toLowerCase(),
        emailVerified: payload.email_verified === true,
        name: payload.name ?? null,
        subject: payload.sub,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      const reason = this.classifyVerificationFailure(error);
      this.logger.warn(`Google login rejected: ${reason}`);

      if (reason === 'invalid_audience') {
        throw new UnauthorizedException('Credencial do Google incompatível com esta aplicação.');
      }

      throw new UnauthorizedException('Credencial do Google inválida.');
    }
  }

  private classifyVerificationFailure(error: unknown) {
    if (!(error instanceof Error)) {
      return 'unknown_google_token_error';
    }

    const message = error.message.toLowerCase();

    if (
      message.includes('wrong recipient') ||
      message.includes('audience') ||
      message.includes('client id')
    ) {
      return 'invalid_audience';
    }

    if (message.includes('expired') || message.includes('token used too late')) {
      return 'expired_token';
    }

    return 'invalid_google_token';
  }
}
