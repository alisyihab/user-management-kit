import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PermissionResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the permission (UUID)',
    example: 'perm-1',
    type: String,
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Name of the permission',
    example: 'Login',
    type: String,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the permission (optional)',
    example: 'Allow user login',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Module to which the permission belongs',
    example: 'auth',
    type: String,
  })
  @IsString()
  module: string;

  @ApiProperty({
    description: 'Indicates whether the permission is assigned to the role',
    example: true,
    type: Boolean,
  })
  @IsBoolean()
  checked: boolean;
}

export class GroupedPermissionDto {
  @ApiProperty({
    description: 'Name of the module grouping the permissions',
    example: 'auth',
    type: String,
  })
  @IsString()
  module: string;

  @ApiProperty({
    description: 'List of permissions belonging to the module',
    type: () => [PermissionResponseDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionResponseDto)
  permissions: PermissionResponseDto[];
}
