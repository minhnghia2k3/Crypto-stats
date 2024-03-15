import { Injectable } from '@nestjs/common';
import { CoinbaseAuthService } from './coinbase-auth.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class CoinbaseService {
  constructor(
    private readonly coinbaseAuthService: CoinbaseAuthService,
    private readonly httpService: HttpService,
  ) {}

  async getPrimaryAccountTransaction(userId: string): Promise<any> {
    const primaryAccount = await this.getPrimaryAccount(userId);
    return await this.getAccountTransactions(primaryAccount.id, userId);
  }

  async getPrimaryAccount(userId: string): Promise<any> {
    try {
      const response$ = this.httpService.get(
        'https://api.coinbase.com/v2/accounts',
        {
          headers: await this.getHeaders(userId),
        },
      );
      const response = await lastValueFrom(response$);
      return response.data.data.find((account) => account.primary);
    } catch (error) {
      throw new Error(error);
    }
  }

  private async getAccountTransactions(accountId: string, userId: string) {
    try {
      const response$ = this.httpService.get(
        `https://api.coinbase.com/v2/accounts/${accountId}/transactions`,
        {
          headers: await this.getHeaders(userId),
        },
      );
      const response = await lastValueFrom(response$);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  }

  private async getHeaders(userId: string) {
    return {
      Authorization: `Bearer ${await this.coinbaseAuthService.getAccessToken(userId)}`,
      'CB-Version': '2024-02-07',
    };
  }
}
