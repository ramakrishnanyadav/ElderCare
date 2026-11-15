import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import {
  LoginRequest,
  ElderPinAuthRequest,
  CreateInviteRequest,
  RedeemInviteRequest,
} from '@eldercare/contracts';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { PolicyGuard } from '../../common/guards/policy.guard';
import { RequireAction } from '../../common/decorators/require-action.decorator';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginRequest, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(body);
    // Set HttpOnly, Secure, SameSite=Lax cookie
    res.cookie('eldercare_session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { user: result.user, sessionToken: result.sessionToken };
  }

  @Post('elder/pin')
  @HttpCode(HttpStatus.OK)
  async verifyElderPin(
    @Body() body: ElderPinAuthRequest,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.verifyElderPin(body);
    res.cookie('eldercare_session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { sessionToken: result.sessionToken };
  }

  @Post('invites')
  @UseGuards(SessionAuthGuard, PolicyGuard)
  @RequireAction('INVITE_MEMBER')
  async createInvite(@Body() body: CreateInviteRequest, @Req() req: any) {
    return this.authService.createInvite(body, req.actor.id);
  }

  @Post('invites/redeem')
  @HttpCode(HttpStatus.CREATED)
  async redeemInvite(
    @Body() body: RedeemInviteRequest,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.redeemInvite(body);
    res.cookie('eldercare_session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { sessionToken: result.sessionToken };
  }

  @Post('devices/:id/revoke')
  @UseGuards(SessionAuthGuard)
  async revokeDevice(@Param('id') deviceId: string, @Req() req: any) {
    await this.authService.revokeDevice(deviceId, req.actor.id);
    return { success: true, message: 'Device revoked and all associated sessions terminated.' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.['eldercare_session'];
    if (token) {
      await this.authService.revokeSession(token);
    }
    res.clearCookie('eldercare_session');
    return { success: true };
  }
}
