import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { UserResponse } from 'src/users/dto/response/user-response.dto';

export interface Payload {
  user: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}
  async signToken(user: UserResponse, response: Response): Promise<void> {
    /** 1. Prepare for payload
     *  2. Prepare for secretKey
     *  3. Prepare for expires
     *  4. Get token then assign to response cookie
     */

    const payload: Payload = {
      user: user._id,
      email: user.email,
    };

    const secretKey = this.configService.get<string>('JWT_SECRET');

    const expires = new Date();
    expires.setSeconds(
      expires.getSeconds() +
        +this.configService.get<number>('JWT_EXPIRATION_TIME'),
    );

    const access_token = this.jwtService.sign(payload, {
      secret: secretKey,
    });

    response.cookie('Authentication', access_token, {
      // httpOnly: true,
      expires: expires,
    });
  }
}
