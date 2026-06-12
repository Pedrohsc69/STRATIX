import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Channel, ChannelModel, ConfirmChannel, ConsumeMessage, Options } from 'amqplib';
import { connect } from 'amqplib';

type ConsumerHandler = (message: ConsumeMessage) => Promise<void>;

type ConsumerRegistration = {
  queue: string;
  handler: ConsumerHandler;
  consumerTag?: string;
};

@Injectable()
export class RabbitMQService implements OnApplicationShutdown {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection?: ChannelModel;
  private publishChannel?: ConfirmChannel;
  private consumerChannel?: Channel;
  private connectionPromise?: Promise<ChannelModel>;
  private publishChannelPromise?: Promise<ConfirmChannel>;
  private consumerChannelPromise?: Promise<Channel>;
  private reconnectTimeout?: NodeJS.Timeout;
  private readonly consumers = new Map<string, ConsumerRegistration>();
  private shuttingDown = false;

  constructor(private readonly configService: ConfigService) {}

  isEnabled() {
    return this.configService.get<string>('RABBITMQ_ENABLED') === 'true';
  }

  async publish(queue: string, payload: unknown, options?: Options.Publish) {
    if (!this.isEnabled()) {
      throw new Error('RabbitMQ is disabled');
    }

    const channel = await this.ensurePublishChannel();
    await channel.assertQueue(queue, { durable: true });

    const published = channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(payload)),
      options,
    );

    if (!published) {
      throw new Error(`RabbitMQ publish buffer is full for queue ${queue}`);
    }

    await channel.waitForConfirms();
  }

  async registerConsumer(queue: string, handler: ConsumerHandler) {
    if (!this.isEnabled()) {
      return;
    }

    this.consumers.set(queue, { queue, handler });
    await this.ensureConsumer(queue);
  }

  ack(message: ConsumeMessage) {
    if (!this.consumerChannel) {
      throw new Error('RabbitMQ consumer channel is not available');
    }

    this.consumerChannel.ack(message);
  }

  nack(message: ConsumeMessage, requeue = true) {
    if (!this.consumerChannel) {
      throw new Error('RabbitMQ consumer channel is not available');
    }

    this.consumerChannel.nack(message, false, requeue);
  }

  async onApplicationShutdown() {
    this.shuttingDown = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    for (const consumer of this.consumers.values()) {
      if (consumer.consumerTag && this.consumerChannel) {
        await this.consumerChannel.cancel(consumer.consumerTag).catch(() => undefined);
      }
    }

    this.clearConsumerTags();

    await this.consumerChannel?.close().catch(() => undefined);
    await this.publishChannel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);

    this.consumerChannel = undefined;
    this.publishChannel = undefined;
    this.connection = undefined;
  }

  private async ensureConnection() {
    if (this.connection) {
      return this.connection;
    }

    if (!this.connectionPromise) {
      this.connectionPromise = this.createConnection().finally(() => {
        this.connectionPromise = undefined;
      });
    }

    return this.connectionPromise;
  }

  private async createConnection() {
    const connection = await connect(this.getRabbitMqUrl());

    connection.on('error', (error) => {
      this.handleDisconnect('connection error', error);
    });

    connection.on('close', () => {
      this.handleDisconnect('connection closed');
    });

    this.connection = connection;

    return connection;
  }

  private async ensurePublishChannel() {
    if (this.publishChannel) {
      return this.publishChannel;
    }

    if (!this.publishChannelPromise) {
      this.publishChannelPromise = this.createPublishChannel().finally(() => {
        this.publishChannelPromise = undefined;
      });
    }

    return this.publishChannelPromise;
  }

  private async createPublishChannel() {
    const connection = await this.ensureConnection();
    const channel = await connection.createConfirmChannel();

    channel.on('error', (error) => {
      this.logger.warn(
        `RabbitMQ publish channel error: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      if (this.publishChannel === channel) {
        this.publishChannel = undefined;
      }
    });

    channel.on('close', () => {
      if (this.publishChannel === channel) {
        this.publishChannel = undefined;
      }
    });

    this.publishChannel = channel;

    return channel;
  }

  private async ensureConsumer(queue: string) {
    const registration = this.consumers.get(queue);

    if (!registration || registration.consumerTag) {
      return;
    }

    const channel = await this.ensureConsumerChannel();
    await channel.assertQueue(queue, { durable: true });
    await channel.prefetch(1);

    const reply = await channel.consume(
      queue,
      (message) => {
        if (!message) {
          return;
        }

        void registration.handler(message).catch((error) => {
          this.logger.error(
            `Unhandled RabbitMQ consumer error for queue ${queue}`,
            error instanceof Error ? error.stack : undefined,
          );

          try {
            this.nack(message, true);
          } catch {
            this.logger.warn(`Unable to nack message for queue ${queue}`);
          }
        });
      },
      { noAck: false },
    );

    const currentRegistration = this.consumers.get(queue);

    if (currentRegistration) {
      currentRegistration.consumerTag = reply.consumerTag;
    }
  }

  private async ensureConsumerChannel() {
    if (this.consumerChannel) {
      return this.consumerChannel;
    }

    if (!this.consumerChannelPromise) {
      this.consumerChannelPromise = this.createConsumerChannel().finally(() => {
        this.consumerChannelPromise = undefined;
      });
    }

    return this.consumerChannelPromise;
  }

  private async createConsumerChannel() {
    const connection = await this.ensureConnection();
    const channel = await connection.createChannel();

    channel.on('error', (error) => {
      this.logger.warn(
        `RabbitMQ consumer channel error: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      if (this.consumerChannel === channel) {
        this.consumerChannel = undefined;
        this.clearConsumerTags();
      }
    });

    channel.on('close', () => {
      if (this.consumerChannel === channel) {
        this.consumerChannel = undefined;
        this.clearConsumerTags();
      }
    });

    this.consumerChannel = channel;

    for (const queue of this.consumers.keys()) {
      await this.ensureConsumer(queue);
    }

    return channel;
  }

  private getRabbitMqUrl() {
    return (
      this.configService.get<string>('RABBITMQ_URL')?.trim()
      || 'amqp://guest:guest@localhost:5672'
    );
  }

  private handleDisconnect(reason: string, error?: unknown) {
    if (this.shuttingDown) {
      return;
    }

    if (this.connection) {
      this.logger.warn(
        `RabbitMQ disconnected: ${reason}${error instanceof Error ? ` (${error.message})` : ''}`,
      );
    }

    this.connection = undefined;
    this.publishChannel = undefined;
    this.consumerChannel = undefined;
    this.clearConsumerTags();
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout || this.consumers.size < 1 || !this.isEnabled()) {
      return;
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = undefined;
      void this.reconnectConsumers();
    }, 5_000);
  }

  private async reconnectConsumers() {
    try {
      await this.ensureConnection();
      await this.ensureConsumerChannel();
    } catch (error) {
      this.logger.warn(
        `RabbitMQ reconnect failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      this.scheduleReconnect();
    }
  }

  private clearConsumerTags() {
    for (const consumer of this.consumers.values()) {
      consumer.consumerTag = undefined;
    }
  }
}
