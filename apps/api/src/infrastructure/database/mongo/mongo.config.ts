export interface MongoConfig {
  uri: string;
  dbName: string;
}

function normalizeMongoUrl(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function getMongoConfig(): MongoConfig {
  const uri = process.env.MONGO_URL ?? process.env.MONGODB_URI;
  const dbName = process.env.MONGO_DB ?? process.env.MONGODB_DATABASE;

  if (!uri) {
    throw new Error('MONGO_URL or MONGODB_URI is not defined');
  }

  if (!dbName) {
    throw new Error('MONGO_DB or MONGODB_DATABASE is not defined');
  }

  return {
    uri: normalizeMongoUrl(uri),
    dbName,
  };
}
