import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import type { ConsumeMessage } from 'amqplib';
import { EmailService } from '../email/email.service';
import type { InviteEmailPayload } from './messaging.types';
import { RabbitMQService } from './rabbitmq.service';

@Injectable()
export class InviteEmailConsumer implements OnModuleInit {
  private readonly logger = new Logger(InviteEmailConsumer.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    if (!this.isActive()) {
      return;
    }

    try {
      await this.rabbitMQService.registerConsumer(this.getQueueName(), (message) =>
        this.handleMessage(message),
      );
    } catch (error) {
      this.logger.warn(
        `RabbitMQ invite consumer was not started: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  private async handleMessage(message: ConsumeMessage) {
    const payload = this.parseMessage(message);

    if (!payload) {
      this.rabbitMQService.ack(message);
      return;
    }

    try {
      await this.emailService.sendInviteEmail(payload);
      this.rabbitMQService.ack(message);
    } catch (error) {
      this.logger.error(
        `Failed to process invite e-mail ${payload.inviteId}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.rabbitMQService.nack(message, true);
    }
  }

  private parseMessage(message: ConsumeMessage) {
    try {
      const parsed = JSON.parse(message.content.toString('utf8')) as Record<string, unknown>;

      if (!this.isInviteEmailPayload(parsed)) {
        this.logger.warn('Discarding invalid invite e-mail payload');
        return null;
      }

      return parsed;
    } catch (error) {
      this.logger.warn(
        `Discarding malformed invite e-mail payload: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return null;
    }
  }

  private isInviteEmailPayload(value: Record<string, unknown>): value is InviteEmailPayload {
    const allowedKeys = new Set([
      'inviteId',
      'email',
      'role',
      'companyName',
      'departmentName',
      'inviteUrl',
      'createdAt',
    ]);

    if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
      return false;
    }

    return (
      typeof value.inviteId === 'string'
      && typeof value.email === 'string'
      && (value.role === UserRole.MANAGER || value.role === UserRole.EMPLOYEE)
      && typeof value.companyName === 'string'
      && (typeof value.departmentName === 'string' || value.departmentName === null)
      && typeof value.inviteUrl === 'string'
      && typeof value.createdAt === 'string'
    );
  }

  private getQueueName() {
    return (
      this.configService.get<string>('RABBITMQ_INVITE_EMAIL_QUEUE')?.trim()
      || 'stratix.invites.email'
    );
  }

  private isActive() {
    return (
      this.configService.get<string>('RABBITMQ_ENABLED') === 'true'
      && this.configService.get<string>('EMAIL_DEMO_MODE') !== 'true'
    );
  }
}
