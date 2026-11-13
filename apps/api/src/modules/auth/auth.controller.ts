import { BadRequestException, Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';
import type { Response } from 'express';

import { Public } from '../../common/decorators.js';

import { AuthService } from './auth.service.js';
import { OtpService } from './otp.service.js';

class RequestOtpDto {
  @Matches(/^\+?[1-9]\d{6,14}$/, { message: 'phone must be E.164' })
  phone!: string;
}

class VerifyOtpDto {
  @Matches(/^\+?[1-9]\d{6,14}$/)
  phone!: string;

  @Length(6, 6)
  code!: string;
}

class PasswordLoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @Length(8, 128)
  password!: string;
}

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly otp: OtpService,
  ) {}

  @Post('otp/request')
  @Public()
  @ApiBody({ type: RequestOtpDto })
  async requestOtp(@Body() body: RequestOtpDto) {
    const code = await this.otp.issueOtp(body.phone);
    // In production the code is dispatched via WhatsApp/SMS. In dev we echo it so
    // developers can test without a real sender.
    const devMode = process.env.NODE_ENV !== 'production';
    return { status: 'issued', devCode: devMode ? code : undefined };
  }

  @Post('otp/verify')
  @Public()
  async verifyOtp(@Body() body: VerifyOtpDto, @Res({ passthrough: true }) res: Response) {
    const ok = await this.otp.verify(body.phone, body.code);
    if (!ok) throw new BadRequestException('Invalid or expired OTP');
    const user = await this.auth.findOrCreateUserByPhone(body.phone);
    const membership = await this.auth.primaryMembership(user.id);
    const tokens = await this.auth.issueTokens(user.id, membership.tenantId, membership.role);
    res.cookie('refresh_token', tokens.refreshToken, { httpOnly: true, sameSite: 'strict', secure: true });
    return { accessToken: tokens.accessToken, tenantId: membership.tenantId, role: membership.role };
  }

  @Post('password/login')
  @Public()
  async passwordLogin(@Body() body: PasswordLoginDto, @Res({ passthrough: true }) res: Response) {
    if (!body.email && !body.phone) throw new BadRequestException('email or phone required');
    const user = await this.auth.validateWithPassword((body.email ?? body.phone)!, body.password);
    const membership = await this.auth.primaryMembership(user.id);
    const tokens = await this.auth.issueTokens(user.id, membership.tenantId, membership.role);
    res.cookie('refresh_token', tokens.refreshToken, { httpOnly: true, sameSite: 'strict', secure: true });
    return { accessToken: tokens.accessToken, tenantId: membership.tenantId, role: membership.role };
  }

  @Post('refresh')
  @Public()
  async refresh(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) throw new BadRequestException('refreshToken required');
    return this.auth.rotateRefresh(body.refreshToken);
  }
}
