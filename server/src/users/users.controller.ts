import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CreateUserRequest } from './dto/request/create-user-dto';
import { UsersService } from './users.service';
import { UserResponse } from './dto/response/user-response.dto';
import { findUserByEmail } from './dto/request/find-user-by-email.dto';
import { CurrentUser } from 'src/auth/auth.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(
    @Body() createUserRequest: CreateUserRequest,
  ): Promise<UserResponse> {
    return this.usersService.createUser(createUserRequest);
  }

  @Get(':email')
  async findUserByEmail(@Param() user: findUserByEmail): Promise<boolean> {
    return await this.usersService.isExistEmail(user.email);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(
    @CurrentUser() user: UserResponse,
  ): Promise<UserResponse> {
    return user;
  }
}
