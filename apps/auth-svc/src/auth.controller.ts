import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { Public } from '@libs/common/src';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Successful login',
    type: LoginResponseDto,
  })
  async login(@Body() body: LoginDto): Promise<LoginResponseDto> {
    const user = await this.authService.validateUser(
      body.username,
      body.password,
    );

    return this.authService.login(user);
  }
}
