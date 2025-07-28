import { ApiProperty } from '@nestjs/swagger';

export class RolesDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  has_notifications: boolean;

  @ApiProperty()
  createdAt: Date;
}
