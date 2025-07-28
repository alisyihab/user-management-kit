import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CommonAuthModule } from '@libs/common/src/module/common-auth.module';
import { PrismaModule } from '@libs/database/src';

@Module({
  imports: [PrismaModule, CommonAuthModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
