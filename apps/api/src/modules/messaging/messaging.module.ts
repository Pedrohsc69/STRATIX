import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { InviteEmailConsumer } from './invite-email.consumer';
import { InviteEmailPublisher } from './invite-email.publisher';
import { RabbitMQService } from './rabbitmq.service';

@Module({
  imports: [EmailModule],
  providers: [RabbitMQService, InviteEmailPublisher, InviteEmailConsumer],
  exports: [RabbitMQService, InviteEmailPublisher],
})
export class MessagingModule {}
