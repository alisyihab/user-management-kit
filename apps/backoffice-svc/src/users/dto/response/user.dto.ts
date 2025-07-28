import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user-list.dto';

export class UserDetailDto extends UserDto {
  @ApiProperty({ type: Object })
  roles: object;
}
