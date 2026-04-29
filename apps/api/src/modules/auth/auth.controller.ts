import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { GetInviteDetailsDto } from './dto/get-invite-details.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDirectorDto } from './dto/register-director.dto';

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

  @Get('invite-details')
  getInviteDetails(@Query() query: GetInviteDetailsDto) {
    return this.authService.getInviteDetails(query.token);
  }

  @Post('accept-invite')
  acceptInvite(@Body() body: AcceptInviteDto) {
    return this.authService.acceptInvite(body);
  }
}
