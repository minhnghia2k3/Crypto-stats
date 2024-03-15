import { Controller, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { CurrentUser } from './auth.decorator';
import { UserResponse } from 'src/users/dto/response/user-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  async login(
    @CurrentUser() user: UserResponse,
    @Res({ passthrough: true })
    response: Response,
  ) {
    await this.authService.signToken(user, response);
    return user;
  }
}
