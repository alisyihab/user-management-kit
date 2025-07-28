import { ApiProperty } from '@nestjs/swagger';

class User {
  @ApiProperty({ example: 'uuid-user' })
  user_id: string;

  @ApiProperty({ example: 'superadmin' })
  username: string;

  @ApiProperty({ example: 'super admin' })
  role: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'jwt.token.here' })
  access_token: string;

  @ApiProperty({ type: () => User })
  user: User;

  @ApiProperty({
    example: ['permission:1', 'permission:2', 'permission:3'],
    isArray: true,
  })
  permissions: string[];
}
