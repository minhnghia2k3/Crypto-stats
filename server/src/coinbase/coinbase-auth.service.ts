import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { lastValueFrom } from 'rxjs';
import { EncryptionService } from 'src/auth/encryption.service';
import { UserResponse } from 'src/users/dto/response/user-response.dto';
import { CoinbaseAuth } from 'src/users/schemas/coinbase-auth.schema';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class CoinbaseAuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly usersService: UsersService,
    private readonly encryptionService: EncryptionService,
  ) {}

  private buildAuthorizeUrl() {
    //https://www.coinbase.com/oauth/authorize?client_id=...&...
    const authorizeUrl = new URL('https://www.coinbase.com/oauth/authorize');
    authorizeUrl.searchParams.append(
      'client_id',
      this.configService.get('COINBASE_CLIENT_ID'),
    );
    authorizeUrl.searchParams.append('response_type', 'code');
    authorizeUrl.searchParams.append(
      'redirect_uri',
      this.configService.get('COINBASE_REDIRECT_URI'),
    );
    authorizeUrl.searchParams.append(
      'scope',
      'wallet:accounts:read,wallet:transactions:read',
    );
    return authorizeUrl;
  }

  public authorize(res: Response) {
    const authorizeUrl = this.buildAuthorizeUrl();
    res.redirect(authorizeUrl.href);
    return;
  }

  public handleCallback(req: Request, res: Response) {
    const { code } = req.query;
    const { user } = req;
    this.getTokensFromCode(code as string).subscribe(async (tokensResponse) => {
      await this.updateUserCoinbaseAuth(
        (user as UserResponse)._id,
        tokensResponse.data,
      );
      res.redirect(this.configService.get('AUTH_REDIRECT_URI'));
    });
  }

  private getTokensFromCode(code: string) {
    return this.httpService.post('https://api.coinbase.com/oauth/token', {
      grant_type: 'authorization_code',
      code,
      client_id: this.configService.get('COINBASE_CLIENT_ID'),
      client_secret: this.configService.get('COINBASE_CLIENT_SECRET'),
      redirect_uri: this.configService.get('COINBASE_REDIRECT_URI'),
    });
  }

  private updateUserCoinbaseAuth(
    userId: string,
    tokenPayload: any,
  ): Promise<UserResponse> {
    /** Equal to
        const {access_token, refresh_token, expires_in} = tokenPayload;
        const access_token = access_token
        const expiresIn = expires_in
        const refresh_token = refresh_token
     */
    const {
      access_token: access_token,
      refresh_token: refresh_token,
      expires_in: expiresIn,
    } = tokenPayload;

    const expires = new Date();
    expires.setSeconds(expires.getSeconds() + expiresIn);

    return this.usersService.updateUser(userId, {
      coinbaseAuth: {
        accessToken: this.encryptionService.encrypt(access_token),
        refreshToken: this.encryptionService.encrypt(refresh_token),
        expires: expires,
      },
    });
  }

  async getAccessToken(userId: string): Promise<any> {
    /** Get coinbaseAuth data,
     * check if token is expires ?
     */

    const coinbaseAuth = await this.usersService.getCoinbaseAuth(userId);
    if (new Date().getTime() >= coinbaseAuth.expires.getTime()) {
      const _response = this.refreshAccessToken(coinbaseAuth);
      // resolving and return the last value
      const response = await lastValueFrom(_response);
      await this.updateUserCoinbaseAuth(userId, response.data);
      return response.data.access_token;
    }
    return this.encryptionService.decrypt(coinbaseAuth.accessToken);
  }

  private refreshAccessToken(coinbaseAuth: CoinbaseAuth) {
    try {
      return this.httpService.post('https://api.coinbase.com/oauth/token', {
        grant_type: 'refresh_token',
        client_id: this.configService.get<string>('COINBASE_CLIENT_ID'),
        client_secret: this.configService.get<string>('COINBASE_CLIENT_SECRET'),
        refresh_token: this.encryptionService.decrypt(
          coinbaseAuth.refreshToken,
        ),
      });
    } catch (error) {
      throw new Error(error);
    }
  }
}
