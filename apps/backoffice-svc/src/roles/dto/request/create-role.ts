import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString, Max } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Max(50)
  name: string;

  @ApiProperty()
  @IsBoolean()
  has_notifications: boolean;
}
