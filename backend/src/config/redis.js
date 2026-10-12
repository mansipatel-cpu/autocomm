import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

export const redisConnectionOptions = {
  host: env.REDIS.HOST,
  port: env.REDIS.PORT,
  password: env.REDIS.PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

let redisClient = null;

export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis(redisConnectionOptions);
    redisClient.on('connect', () => {
      logger.info(`Connected to Redis at ${env.REDIS.HOST}:${env.REDIS.PORT}`);
    });
    redisClient.on('error', (err) => {
      logger.warn(`Redis connection warning: ${err.message}`);
    });
  }
  return redisClient;
};
