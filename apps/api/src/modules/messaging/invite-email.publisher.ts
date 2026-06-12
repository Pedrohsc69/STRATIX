import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { InviteEmailPayload } from './messaging.types';
import { RabbitMQService } from './rabbitmq.service';

@Injectable()
export class InviteEmailPublisher {
  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly configService: ConfigService,
  ) {}

  async publish(payload: InviteEmailPayload) {
    await this.rabbitMQService.publish(
      this.getQueueName(),
      payload,
      {
        persistent: true,
        contentType: 'application/json',
        messageId: payload.inviteId,
        timestamp: Date.parse(payload.createdAt),
        type: 'invite.email',
      },
    );
  }

  private getQueueName() {
    return (
      this.configService.get<string>('RABBITMQ_INVITE_EMAIL_QUEUE')?.trim()
      || 'stratix.invites.email'
    );
  }
}
