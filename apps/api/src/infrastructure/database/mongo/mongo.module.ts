import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { getMongoConfig } from './mongo.config';

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
  ],
  exports: [MongooseModule],
})
export class MongoModule {}
