import { IsArray, IsBoolean, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class PermissionDto {
  @ApiProperty({ description: 'Permission ID (UUID)', example: 'perm-1' })
  @IsString()
  permissionId: string;

  @ApiProperty({
    description: 'Whether the permission is assigned',
    example: true,
  })
  @IsBoolean()
  checked: boolean;
}

export class AssignPermissionToRoleDto {
  @ApiProperty({ description: 'Role name', example: 'Editor' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Whether the role has notifications enabled',
    example: true,
  })
  @IsBoolean()
  hasNotification: boolean;

  @ApiProperty({
    description: 'List of permissions to assign',
    type: [PermissionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions: PermissionDto[];
}
