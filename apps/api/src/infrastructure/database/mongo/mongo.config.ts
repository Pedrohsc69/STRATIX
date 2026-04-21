export interface MongoConfig {
  uri: string;
  dbName: string;
}

function normalizeMongoUrl(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function getMongoConfig(): MongoConfig {
  const uri = process.env.MONGO_URL;
  const dbName = process.env.MONGO_DB;

  if (!uri) {
    throw new Error('MONGO_URL is not defined');
  }

  if (!dbName) {
    throw new Error('MONGO_DB is not defined');
  }

  return {
    uri: normalizeMongoUrl(uri),
    dbName,
  };
}
