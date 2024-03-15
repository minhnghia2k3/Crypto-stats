import { Module } from '@nestjs/common';
import { CoinbaseController } from './coinbase.controller';
import { CoinbaseAuthService } from './coinbase-auth.service';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { CoinbaseService } from './coinbase.service';

@Module({
  imports: [HttpModule, AuthModule, UsersModule],
  providers: [CoinbaseAuthService, CoinbaseService],
  controllers: [CoinbaseController],
})
export class CoinbaseModule {}
