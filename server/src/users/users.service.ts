import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserRequest } from './dto/request/create-user-dto';
import { UsersRepository } from './user.repository';
import { hash, compare } from 'bcrypt';
import { UserResponse } from './dto/response/user-response.dto';
import { User } from './schemas/User.schema';
import { CoinbaseAuth } from './schemas/coinbase-auth.schema';
@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  private buildResponse(user: User): UserResponse {
    return {
      _id: user._id.toHexString(),
      email: user.email,
      isCoinbaseAuthorized: !!user.coinbaseAuth, // convert user.coinbaseAuth to boolean
    };
  }

  private async validateCreateUserRequest(
    createUserRequest: CreateUserRequest,
  ): Promise<void> {
    const user = await this.usersRepository.findOneByEmail(
      createUserRequest.email,
    );
    if (user) {
      throw new ConflictException('This user is already exist.');
    }
  }

  async createUser(
    createUserRequest: CreateUserRequest,
  ): Promise<UserResponse> {
    await this.validateCreateUserRequest(createUserRequest);
    const newUser = await this.usersRepository.insertOne({
      ...createUserRequest,
      password: await hash(createUserRequest.password, 10),
    });
    return this.buildResponse(newUser);
  }

  async validateUser(email: string, password: string): Promise<UserResponse> {
    const user = await this.usersRepository.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await compare(password, user.password);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildResponse(user);
  }

  async isExistEmail(email: string): Promise<boolean> {
    const user = await this.usersRepository.findOneByEmail(email);
    if (!user) {
      return false;
    }
    return true;
  }

  async getUserById(userId: string): Promise<UserResponse> {
    const user = await this.usersRepository.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found by id.');
    }
    return this.buildResponse(user);
  }

  async updateUser(userId: string, data: Partial<User>): Promise<UserResponse> {
    const user = await this.usersRepository.updateOne(userId, data);
    if (!user) {
      throw new NotFoundException('User not found by id.');
    }
    return this.buildResponse(user);
  }

  async getCoinbaseAuth(userId: string): Promise<CoinbaseAuth> {
    const user = await this.usersRepository.findOneById(userId);
    if (!user) {
      throw new NotFoundException('Not found by user id.');
    }
    if (!user.coinbaseAuth) {
      throw new UnauthorizedException('Coin base authentication is not valid.');
    }
    return user.coinbaseAuth;
  }
}
