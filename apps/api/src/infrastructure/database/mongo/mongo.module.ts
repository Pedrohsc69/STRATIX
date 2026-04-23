import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { getMongoConfig } from './mongo.config';
import { AuditSchema } from '../../../modules/audit/infrastructure/database/audit.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async () => {
        const config = getMongoConfig();

        return {
          uri: config.uri,
          dbName: config.dbName,
          lazyConnection: true,
          serverSelectionTimeoutMS: 3000,
        };
      },
    }),
    MongooseModule.forFeature([
      { name: 'Audit', schema: AuditSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class MongoModule {}
