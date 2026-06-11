import { Body, Controller, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  type AuditRequestLike,
  extractAuditRequestContext,
} from '../audit/audit-request.util';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './auth.types';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetInviteDetailsDto } from './dto/get-invite-details.dto';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDirectorDto } from './dto/register-director.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-director')
  registerDirector(@Body() body: RegisterDirectorDto) {
    return this.authService.registerDirector(body);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('google/login')
  loginWithGoogle(@Body() body: GoogleLoginDto) {
    return this.authService.loginWithGoogle(body);
  }

  @Get('invite-details')
  getInviteDetails(@Query() query: GetInviteDetailsDto) {
    return this.authService.getInviteDetails(query.token);
  }

  @Post('accept-invite')
  acceptInvite(
    @Body() body: AcceptInviteDto,
    @Req() request: AuditRequestLike,
  ) {
    return this.authService.acceptInvite(body, extractAuditRequestContext(request));
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ChangePasswordDto,
    @Req() request: AuditRequestLike,
  ) {
    return this.authService.changePassword(user, body, extractAuditRequestContext(request));
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }
}
