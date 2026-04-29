import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            useFactory: (configService: ConfigService): Redis => {
                const client = new Redis(
                    configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
                    {
                        retryStrategy: (times) => Math.min(times * 100, 3000),
                    },
                );

                client.on('connect', () => console.log('Redis connected'));
                client.on('error', (err) => console.error('Redis error:', err));

                return client;
            },
            inject: [ConfigService],
        },
    ],
    exports: [REDIS_CLIENT],
})
export class RedisModule { }