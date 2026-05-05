import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtGuard } from './guards/jwt.guard';

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET')!,
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [JwtGuard],
    exports: [JwtGuard, JwtModule],
})
export class AuthModule { }