import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { EncryptionService } from '../../common/encryption.service.js';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './jwt.strategy.js';
import { OtpService } from './otp.service.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret') ?? process.env.JWT_ACCESS_SECRET,
        signOptions: { expiresIn: `${config.get<number>('jwt.accessTtl') ?? 900}s` },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, OtpService, EncryptionService],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
